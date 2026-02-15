import express from 'express';
import Stripe from 'stripe';
import { supabase } from '../db/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Lazy-init Stripe (env vars may not be loaded at import time)
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment');
        _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
    }
    return _stripe;
}

const getFrontendUrl = () => process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for plan upgrade
 * Body: { plan: 'explorer' | 'custom' }
 */
router.post('/create-checkout-session', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { plan } = req.body;

        if (!plan) {
            return res.status(400).json({ error: 'Plan is required' });
        }

        // 1. Get the Stripe price ID for the requested plan
        const { data: planConfig, error: planError } = await supabase
            .from('plan_config')
            .select('stripe_price_id, plan')
            .eq('plan', plan)
            .single();

        if (planError || !planConfig) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        if (!planConfig.stripe_price_id) {
            return res.status(400).json({
                error: 'This plan is not available for purchase yet',
                message: 'Payment integration is being set up. Please contact support.'
            });
        }

        // 2. Get or create Stripe Customer
        let stripeCustomerId;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

        if (profile?.stripe_customer_id) {
            stripeCustomerId = profile.stripe_customer_id;
        } else {
            // Create a new Stripe customer
            const customer = await getStripe().customers.create({
                email: userEmail,
                metadata: {
                    supabase_user_id: userId
                }
            });
            stripeCustomerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from('user_profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('user_id', userId);
        }

        // 3. Create Checkout Session
        const session = await getStripe().checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [{
                price: planConfig.stripe_price_id,
                quantity: 1
            }],
            mode: 'payment', // one-time payment
            success_url: `${getFrontendUrl()}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getFrontendUrl()}/profile`,
            metadata: {
                supabase_user_id: userId,
                plan: plan
            }
        });

        res.json({ url: session.url, sessionId: session.id });

    } catch (error) {
        console.error('[Stripe] Checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
    }
});

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * IMPORTANT: This route uses raw body (not JSON parsed)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (webhookSecret && sig) {
            event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // In development/test without webhook secret, parse directly
            event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            console.warn('[Stripe Webhook] No webhook secret configured — skipping signature verification');
        }
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata?.supabase_user_id;
            const plan = session.metadata?.plan;

            if (!userId || !plan) {
                console.error('[Stripe Webhook] Missing metadata in session:', session.id);
                break;
            }

            console.log(`[Stripe Webhook] Checkout completed for user ${userId}, upgrading to ${plan}`);

            try {
                // Get new plan limits
                const { data: planConfig } = await supabase
                    .from('plan_config')
                    .select('max_generations, max_saves')
                    .eq('plan', plan)
                    .single();

                // Update user's plan and reset usage counters
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        plan: plan,
                        generations_used: 0,
                        saves_used: 0,
                        stripe_customer_id: session.customer
                    })
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('[Stripe Webhook] Failed to update profile:', updateError);
                } else {
                    console.log(`[Stripe Webhook] User ${userId} upgraded to ${plan} plan successfully`);
                }
            } catch (err) {
                console.error('[Stripe Webhook] Error processing checkout:', err);
            }
            break;
        }

        default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
});

/**
 * GET /api/stripe/session-status
 * Check the status of a checkout session (used on success page)
 */
router.get('/session-status', verifyAuth, async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ error: 'session_id is required' });
        }

        const session = await getStripe().checkout.sessions.retrieve(session_id);

        res.json({
            status: session.payment_status,
            plan: session.metadata?.plan,
            customerEmail: session.customer_details?.email
        });
    } catch (error) {
        console.error('[Stripe] Session status error:', error);
        res.status(500).json({ error: 'Failed to fetch session status' });
    }
});

export default router;

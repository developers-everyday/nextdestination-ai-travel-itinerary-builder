import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
        update: vi.fn(() => chain),
    };
    return chain;
}

let chainQueue = [];
const mockFrom = vi.fn(() => chainQueue.length > 0 ? chainQueue.shift() : createChainedMock());

vi.mock('../../../db/supabase.js', () => ({
    supabase: { from: mockFrom },
}));

vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => {
        req.user = { id: 'user-1', email: 'test@test.com' };
        next();
    },
}));

// Mock Stripe — the module uses lazy init via getStripe(), so the constructor
// should return a persistent mock instance
const mockCustomersCreate = vi.fn();
const mockSessionsCreate = vi.fn();
const mockSessionsRetrieve = vi.fn();
const mockWebhooksConstructEvent = vi.fn();

vi.mock('stripe', () => {
    // Stripe is used as `new Stripe(key, opts)` — must be constructable
    return {
        default: class MockStripe {
            constructor() {
                this.customers = { create: mockCustomersCreate };
                this.checkout = { sessions: { create: mockSessionsCreate, retrieve: mockSessionsRetrieve } };
                this.webhooks = { constructEvent: mockWebhooksConstructEvent };
            }
        },
    };
});

process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.FRONTEND_URL = 'http://localhost:3000';

const { default: router } = await import('../../../routes/stripe.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return {
        headers: {}, body: {}, query: {}, params: {},
        user: { id: 'user-1', email: 'test@test.com' },
        ...overrides,
    };
}

function createRes() {
    const res = { _status: 200, _json: null, status(c) { res._status = c; return res; }, json(b) { res._json = b; return res; } };
    return res;
}

function getHandler(method, path) {
    const route = router.stack.find(l => l.route && l.route.path === path && l.route.methods[method]);
    return route.route.stack[route.route.stack.length - 1].handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /create-checkout-session
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /create-checkout-session', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when plan is missing', async () => {
        const handler = getHandler('post', '/create-checkout-session');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('Plan is required');
    });

    it('returns 404 when plan config not found', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { message: 'Not found' } }));

        const handler = getHandler('post', '/create-checkout-session');
        const res = createRes();
        await handler(createReq({ body: { plan: 'nonexistent' } }), res, vi.fn());

        expect(res._status).toBe(404);
    });

    it('returns 400 when plan has no stripe_price_id', async () => {
        chainQueue.push(createChainedMock({
            data: { plan: 'free', stripe_price_id: null }, error: null,
        }));

        const handler = getHandler('post', '/create-checkout-session');
        const res = createRes();
        await handler(createReq({ body: { plan: 'free' } }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('not available for purchase');
    });

    it('creates checkout session with existing Stripe customer', async () => {
        // Step 1: plan_config
        chainQueue.push(createChainedMock({ data: { plan: 'explorer', stripe_price_id: 'price_abc' }, error: null }));
        // Step 2: profile (has customer ID)
        chainQueue.push(createChainedMock({ data: { stripe_customer_id: 'cus_existing' }, error: null }));

        mockSessionsCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/session', id: 'cs_test_1' });

        const handler = getHandler('post', '/create-checkout-session');
        const res = createRes();
        await handler(createReq({ body: { plan: 'explorer' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.url).toBe('https://checkout.stripe.com/session');
        expect(res._json.sessionId).toBe('cs_test_1');
    });

    it('creates new Stripe customer when profile lacks customer ID', async () => {
        chainQueue.push(createChainedMock({ data: { plan: 'explorer', stripe_price_id: 'price_abc' }, error: null }));
        chainQueue.push(createChainedMock({ data: { stripe_customer_id: null }, error: null }));
        // Save customer ID back to profile
        const saveChain = createChainedMock();
        saveChain.eq.mockResolvedValueOnce({ error: null });
        chainQueue.push(saveChain);

        mockCustomersCreate.mockResolvedValueOnce({ id: 'cus_new' });
        mockSessionsCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/new', id: 'cs_test_2' });

        const handler = getHandler('post', '/create-checkout-session');
        const res = createRes();
        await handler(createReq({ body: { plan: 'explorer' } }), res, vi.fn());

        expect(mockCustomersCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@test.com' }));
        expect(res._json.url).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /webhook', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('handles checkout.session.completed and upgrades plan', async () => {
        chainQueue.push(createChainedMock({ data: { max_generations: 50, max_saves: 10 }, error: null }));
        const updateChain = createChainedMock();
        updateChain.eq.mockResolvedValueOnce({ error: null });
        chainQueue.push(updateChain);

        const handler = getHandler('post', '/webhook');
        const res = createRes();
        await handler(createReq({
            body: {
                type: 'checkout.session.completed',
                data: { object: { id: 'cs_1', customer: 'cus_1', metadata: { supabase_user_id: 'user-1', plan: 'explorer' } } },
            },
        }), res, vi.fn());

        expect(res._json.received).toBe(true);
    });

    it('returns 200 for unhandled event types', async () => {
        const handler = getHandler('post', '/webhook');
        const res = createRes();
        await handler(createReq({ body: { type: 'invoice.paid', data: { object: {} } } }), res, vi.fn());

        expect(res._json.received).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /session-status
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /session-status', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when session_id is missing', async () => {
        const handler = getHandler('get', '/session-status');
        const res = createRes();
        await handler(createReq({ query: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns session status successfully', async () => {
        mockSessionsRetrieve.mockResolvedValueOnce({
            payment_status: 'paid',
            metadata: { plan: 'explorer' },
            customer_details: { email: 'test@test.com' },
        });

        const handler = getHandler('get', '/session-status');
        const res = createRes();
        await handler(createReq({ query: { session_id: 'cs_test_1' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.status).toBe('paid');
        expect(res._json.plan).toBe('explorer');
    });

    it('returns 500 when Stripe API fails', async () => {
        mockSessionsRetrieve.mockRejectedValueOnce(new Error('Stripe API error'));

        const handler = getHandler('get', '/session-status');
        const res = createRes();
        await handler(createReq({ query: { session_id: 'cs_bad' } }), res, vi.fn());

        expect(res._status).toBe(500);
    });
});

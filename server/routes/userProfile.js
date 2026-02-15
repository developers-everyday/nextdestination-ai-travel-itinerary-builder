import express from 'express';
import { supabase, getAuthenticatedClient } from '../db/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/profile/me - Get or auto-create profile for the current user
router.get('/me', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const authClient = getAuthenticatedClient(req.headers.authorization?.split(' ')[1]);

        // Try to fetch existing profile joined with plan limits
        let { data: profile, error } = await authClient
            .from('user_profiles')
            .select(`
                id,
                user_id,
                display_name,
                avatar_url,
                role,
                plan,
                generations_used,
                saves_used,
                bio,
                is_verified,
                created_at,
                updated_at,
                plan_config (
                    max_generations,
                    max_saves,
                    has_voice_agent,
                    has_affiliate,
                    can_sell_packages
                )
            `)
            .eq('user_id', userId)
            .single();

        // If profile doesn't exist (missed trigger), auto-create it
        if (error && error.code === 'PGRST116') {
            const userMeta = req.user.user_metadata || {};
            const displayName = userMeta.full_name || userMeta.name || (req.user.email ? req.user.email.split('@')[0] : 'User');
            const avatarUrl = userMeta.avatar_url || userMeta.picture || null;

            const { data: newProfile, error: insertError } = await authClient
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    display_name: displayName,
                    avatar_url: avatarUrl
                })
                .select(`
                    id,
                    user_id,
                    display_name,
                    avatar_url,
                    role,
                    plan,
                    generations_used,
                    saves_used,
                    bio,
                    is_verified,
                    created_at,
                    updated_at,
                    plan_config (
                        max_generations,
                        max_saves,
                        has_voice_agent,
                        has_affiliate,
                        can_sell_packages
                    )
                `)
                .single();

            if (insertError) {
                console.error('[Profile] Auto-create failed:', insertError);
                return res.status(500).json({ error: 'Failed to create profile', details: insertError.message });
            }

            profile = newProfile;
        } else if (error) {
            throw error;
        }

        // Flatten the response for frontend convenience
        const planConfig = profile.plan_config || {};
        const response = {
            id: profile.id,
            userId: profile.user_id,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
            plan: profile.plan,
            generationsUsed: profile.generations_used,
            savesUsed: profile.saves_used,
            maxGenerations: planConfig.max_generations || 5,
            maxSaves: planConfig.max_saves || 1,
            hasVoiceAgent: planConfig.has_voice_agent || false,
            hasAffiliate: planConfig.has_affiliate || false,
            canSellPackages: planConfig.can_sell_packages || false,
            bio: profile.bio,
            isVerified: profile.is_verified,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at
        };

        res.json(response);
    } catch (error) {
        console.error('[Profile] Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
    }
});

// PATCH /api/profile/me - Update own profile
router.patch('/me', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { displayName, bio, avatarUrl } = req.body;
        const authClient = getAuthenticatedClient(req.headers.authorization?.split(' ')[1]);

        // Only allow updating safe fields
        const updates = {};
        if (typeof displayName !== 'undefined') updates.display_name = displayName;
        if (typeof bio !== 'undefined') updates.bio = bio;
        if (typeof avatarUrl !== 'undefined') updates.avatar_url = avatarUrl;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await authClient
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            id: data.id,
            userId: data.user_id,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            updatedAt: data.updated_at
        });
    } catch (error) {
        console.error('[Profile] Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

// GET /api/profile/:userId - Get a public user profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select(`
                id,
                user_id,
                display_name,
                avatar_url,
                role,
                plan,
                bio,
                is_verified,
                created_at
            `)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Profile not found' });
            }
            throw error;
        }

        // Return limited public info
        res.json({
            id: profile.id,
            userId: profile.user_id,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
            plan: profile.plan,
            bio: profile.bio,
            isVerified: profile.is_verified,
            createdAt: profile.created_at
        });
    } catch (error) {
        console.error('[Profile] Error fetching public profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
    }
});

export default router;

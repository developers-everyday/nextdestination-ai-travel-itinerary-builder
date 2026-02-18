import { supabase } from '../db/supabase.js';

// ── Profile Cache ───────────────────────────────────────────────────────────
// user_profiles is queried on every single quota-checked request
// (checkGenerationQuota, checkSaveQuota, requireRole, requirePlan).
// Caching per-user for 30 seconds removes that DB round-trip for the
// overwhelming majority of requests.
//
// TTL is intentionally short: quota counters increment after each generation/
// save, and we call invalidateProfileCache() at that point so the next
// request always reads the fresh count. 30s only matters for concurrent
// burst requests from the same user, where a stale-by-one read is acceptable.
const PROFILE_CACHE_TTL = 30 * 1000; // 30 seconds
const profileCache = new Map();       // userId → { data, expiresAt }

const getCachedProfile = (userId) => {
    const entry = profileCache.get(userId);
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    profileCache.delete(userId); // expired
    return null;
};

const setCachedProfile = (userId, data) => {
    profileCache.set(userId, { data, expiresAt: Date.now() + PROFILE_CACHE_TTL });
};

// Called after incrementGenerations / incrementSaves so the next quota check
// reads the real counter from the DB instead of the stale cached value.
export const invalidateProfileCache = (userId) => {
    profileCache.delete(userId);
};

// Prune expired entries every 2 minutes to keep memory bounded
setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of profileCache.entries()) {
        if (now > entry.expiresAt) profileCache.delete(id);
    }
}, 2 * 60 * 1000);

/**
 * Middleware: Require specific role(s)
 * Usage: router.get('/dashboard', verifyAuth, requireRole('agent', 'influencer'), handler)
 */
export const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
            }

            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', userId)
                .single();

            if (error || !profile) {
                return res.status(403).json({ error: 'Forbidden: Profile not found' });
            }

            if (!allowedRoles.includes(profile.role)) {
                return res.status(403).json({
                    error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`,
                    currentRole: profile.role
                });
            }

            req.userProfile = { ...req.userProfile, role: profile.role };
            next();
        } catch (err) {
            console.error('[RoleAuth] Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};

/**
 * Middleware: Require specific plan(s)
 * Usage: router.get('/premium', verifyAuth, requirePlan('explorer', 'custom'), handler)
 */
export const requirePlan = (...allowedPlans) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
            }

            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('plan')
                .eq('user_id', userId)
                .single();

            if (error || !profile) {
                return res.status(403).json({ error: 'Forbidden: Profile not found' });
            }

            if (!allowedPlans.includes(profile.plan)) {
                return res.status(403).json({
                    error: `Forbidden: Requires one of [${allowedPlans.join(', ')}] plan`,
                    currentPlan: profile.plan
                });
            }

            req.userProfile = { ...req.userProfile, plan: profile.plan };
            next();
        } catch (err) {
            console.error('[PlanAuth] Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};

/**
 * Middleware: Check generation quota before allowing trip generation
 * Usage: router.post('/generate', verifyAuth, checkGenerationQuota, handler)
 */
export const checkGenerationQuota = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Use cached profile if available — avoids a DB round-trip on every request
        let profile = getCachedProfile(userId);

        if (!profile) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    generations_used,
                    saves_used,
                    plan,
                    plan_config (max_generations, max_saves)
                `)
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return res.status(403).json({ error: 'Profile not found. Please log in again.' });
            }

            profile = data;
            setCachedProfile(userId, profile);
        }

        const maxGenerations = profile.plan_config?.max_generations || 5;

        if (profile.generations_used >= maxGenerations) {
            return res.status(429).json({
                error: 'Generation limit reached',
                message: `You've used all ${maxGenerations} generations on your ${profile.plan} plan. Upgrade to get more!`,
                currentUsage: profile.generations_used,
                limit: maxGenerations,
                plan: profile.plan
            });
        }

        // Attach quota info for downstream use
        req.userQuota = {
            generationsUsed: profile.generations_used,
            maxGenerations,
            plan: profile.plan
        };
        next();
    } catch (err) {
        console.error('[QuotaCheck] Generation quota error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Middleware: Check save quota before allowing trip save
 * Usage: router.post('/save', verifyAuth, checkSaveQuota, handler)
 */
export const checkSaveQuota = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            // If not authenticated, allow save (anonymous trips are public)
            return next();
        }

        // Use cached profile if available — avoids a DB round-trip on every request
        let profile = getCachedProfile(userId);

        if (!profile) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    generations_used,
                    saves_used,
                    plan,
                    plan_config (max_generations, max_saves)
                `)
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                // If profile not found, allow save (graceful degradation)
                console.warn('[QuotaCheck] Profile not found for save quota, allowing save.');
                return next();
            }

            profile = data;
            setCachedProfile(userId, profile);
        }

        const maxSaves = profile.plan_config?.max_saves || 1;

        if (profile.saves_used >= maxSaves) {
            return res.status(429).json({
                error: 'Save limit reached',
                message: `You've saved ${maxSaves} trip(s) on your ${profile.plan} plan. Upgrade to save more!`,
                currentUsage: profile.saves_used,
                limit: maxSaves,
                plan: profile.plan
            });
        }

        req.userQuota = {
            ...req.userQuota,
            savesUsed: profile.saves_used,
            maxSaves,
            plan: profile.plan
        };
        next();
    } catch (err) {
        console.error('[QuotaCheck] Save quota error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Helper: Increment generations_used for a user (call after successful generation)
 */
export const incrementGenerations = async (userId) => {
    // Invalidate cached profile so the next quota check reads the real counter
    invalidateProfileCache(userId);

    try {
        const { error } = await supabase.rpc('increment_field', {
            table_name: 'user_profiles',
            field_name: 'generations_used',
            row_user_id: userId
        });

        // Fallback if RPC doesn't exist: use raw update
        if (error) {
            const { data, error: fetchError } = await supabase
                .from('user_profiles')
                .select('generations_used')
                .eq('user_id', userId)
                .single();

            if (!fetchError && data) {
                await supabase
                    .from('user_profiles')
                    .update({ generations_used: data.generations_used + 1 })
                    .eq('user_id', userId);
            }
        }
    } catch (err) {
        console.error('[Quota] Failed to increment generations:', err);
    }
};

/**
 * Helper: Increment saves_used for a user (call after successful save)
 */
export const incrementSaves = async (userId) => {
    // Invalidate cached profile so the next quota check reads the real counter
    invalidateProfileCache(userId);

    try {
        const { error } = await supabase.rpc('increment_field', {
            table_name: 'user_profiles',
            field_name: 'saves_used',
            row_user_id: userId
        });

        // Fallback if RPC doesn't exist
        if (error) {
            const { data, error: fetchError } = await supabase
                .from('user_profiles')
                .select('saves_used')
                .eq('user_id', userId)
                .single();

            if (!fetchError && data) {
                await supabase
                    .from('user_profiles')
                    .update({ saves_used: data.saves_used + 1 })
                    .eq('user_id', userId);
            }
        }
    } catch (err) {
        console.error('[Quota] Failed to increment saves:', err);
    }
};

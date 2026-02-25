import express from 'express';
import { supabase } from '../db/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/follows/toggle - Toggle follow/unfollow
router.post('/toggle', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId is required' });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(targetUserId)) {
            return res.status(400).json({ error: 'Invalid targetUserId format' });
        }

        if (userId === targetUserId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const { data: existing, error: fetchError } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', targetUserId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        let isFollowing = false;

        if (existing) {
            // Unfollow
            const { error: deleteError } = await supabase
                .from('follows')
                .delete()
                .eq('id', existing.id);

            if (deleteError) throw deleteError;
            isFollowing = false;

            // Decrement counts
            await supabase.rpc('decrement_follow_counts', {
                p_follower_id: userId,
                p_following_id: targetUserId
            }).catch(() => {
                // Fallback: manual update if RPC doesn't exist
                return Promise.all([
                    supabase
                        .from('user_profiles')
                        .update({ following_count: supabase.raw('GREATEST(following_count - 1, 0)') })
                        .eq('user_id', userId),
                    supabase
                        .from('user_profiles')
                        .update({ follower_count: supabase.raw('GREATEST(follower_count - 1, 0)') })
                        .eq('user_id', targetUserId)
                ]);
            });
        } else {
            // Follow
            const { error: insertError } = await supabase
                .from('follows')
                .insert({ follower_id: userId, following_id: targetUserId });

            if (insertError) throw insertError;
            isFollowing = true;

            // Increment counts
            await supabase.rpc('increment_follow_counts', {
                p_follower_id: userId,
                p_following_id: targetUserId
            }).catch(() => {
                // Fallback: manual update if RPC doesn't exist
                return Promise.all([
                    supabase
                        .from('user_profiles')
                        .update({ following_count: supabase.raw('following_count + 1') })
                        .eq('user_id', userId),
                    supabase
                        .from('user_profiles')
                        .update({ follower_count: supabase.raw('follower_count + 1') })
                        .eq('user_id', targetUserId)
                ]);
            });
        }

        // Fetch updated counts for the target user
        const { data: targetProfile } = await supabase
            .from('user_profiles')
            .select('follower_count')
            .eq('user_id', targetUserId)
            .single();

        res.json({
            isFollowing,
            followerCount: targetProfile?.follower_count || 0
        });

    } catch (error) {
        console.error('Error toggling follow:', error);

        if (error.code === '23503') {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/follows/check/:userId - Check if current user follows given user
router.get('/check/:userId', verifyAuth, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({ isFollowing: !!data });

    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/follows/following - List users current user follows
router.get('/following', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: followRows, error } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (error) throw error;

        if (!followRows || followRows.length === 0) {
            return res.json([]);
        }

        const followingIds = followRows.map(r => r.following_id);

        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, avatar_url, role, bio, is_verified, follower_count, interests, social_links')
            .in('user_id', followingIds);

        if (profileError) throw profileError;

        // Get trip counts
        const { data: tripCounts, error: tripError } = await supabase
            .from('itineraries')
            .select('user_id')
            .in('user_id', followingIds)
            .eq('is_public', true);

        const tripCountMap = {};
        if (!tripError && tripCounts) {
            tripCounts.forEach(t => {
                tripCountMap[t.user_id] = (tripCountMap[t.user_id] || 0) + 1;
            });
        }

        const creators = (profiles || []).map(p => ({
            userId: p.user_id,
            displayName: p.display_name || 'User',
            avatarUrl: p.avatar_url,
            role: p.role,
            bio: p.bio,
            isVerified: p.is_verified,
            followerCount: p.follower_count || 0,
            tripCount: tripCountMap[p.user_id] || 0,
            interests: p.interests || [],
            socialLinks: p.social_links || null,
            isFollowing: true
        }));

        res.json(creators);

    } catch (error) {
        console.error('Error fetching following list:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

export default router;

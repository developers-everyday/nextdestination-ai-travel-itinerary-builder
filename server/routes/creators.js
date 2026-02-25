import express from 'express';
import { supabase } from '../db/supabase.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const VALID_INTERESTS = ['History', 'Art', 'Food', 'Nature', 'Adventure', 'Relaxation', 'Nightlife', 'Shopping'];
const PAGE_SIZE = 12;

// GET /api/creators/featured - Top creators by follower_count
router.get('/featured', async (req, res) => {
    try {
        const { data: profiles, error } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, avatar_url, role, bio, is_verified, follower_count, interests, social_links')
            .order('follower_count', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (!profiles || profiles.length === 0) {
            return res.json([]);
        }

        const userIds = profiles.map(p => p.user_id);

        // Get trip counts for these users
        const { data: tripRows } = await supabase
            .from('itineraries')
            .select('user_id')
            .in('user_id', userIds)
            .eq('is_public', true);

        const tripCountMap = {};
        if (tripRows) {
            tripRows.forEach(t => {
                tripCountMap[t.user_id] = (tripCountMap[t.user_id] || 0) + 1;
            });
        }

        const creators = profiles.map(p => ({
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
        }));

        res.json(creators);

    } catch (error) {
        console.error('Error fetching featured creators:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/creators - List creators with filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { interest, search, page = '1' } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const offset = (pageNum - 1) * PAGE_SIZE;

        let query = supabase
            .from('user_profiles')
            .select('user_id, display_name, avatar_url, role, bio, is_verified, follower_count, interests, social_links', { count: 'exact' });

        // Filter by interest
        if (interest && VALID_INTERESTS.includes(interest)) {
            query = query.contains('interests', [interest]);
        }

        // Search by name
        if (search && typeof search === 'string' && search.trim()) {
            query = query.ilike('display_name', `%${search.trim()}%`);
        }

        query = query
            .order('follower_count', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        const { data: profiles, error, count } = await query;

        if (error) throw error;

        if (!profiles || profiles.length === 0) {
            return res.json({ creators: [], total: 0 });
        }

        const userIds = profiles.map(p => p.user_id);

        // Get trip counts
        const { data: tripRows } = await supabase
            .from('itineraries')
            .select('user_id')
            .in('user_id', userIds)
            .eq('is_public', true);

        const tripCountMap = {};
        if (tripRows) {
            tripRows.forEach(t => {
                tripCountMap[t.user_id] = (tripCountMap[t.user_id] || 0) + 1;
            });
        }

        // Check follow status if authenticated
        let followSet = new Set();
        if (req.user) {
            const { data: followRows } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', req.user.id)
                .in('following_id', userIds);

            if (followRows) {
                followRows.forEach(f => followSet.add(f.following_id));
            }
        }

        const creators = profiles.map(p => ({
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
            isFollowing: followSet.has(p.user_id),
        }));

        res.json({ creators, total: count || 0 });

    } catch (error) {
        console.error('Error fetching creators:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

export default router;

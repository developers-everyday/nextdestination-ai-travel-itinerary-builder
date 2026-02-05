import express from 'express';
import { supabase } from '../db/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// TOGGLE Wishlist: POST /api/wishlist/toggle
// Expects: { itineraryId: string }
router.post('/toggle', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { itineraryId } = req.body;

        if (!itineraryId) {
            return res.status(400).json({ error: 'Itinerary ID is required' });
        }

        // 1. Check if already wishlisted
        const { data: existing, error: fetchError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('itinerary_id', itineraryId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw fetchError;
        }

        let isWishlisted = false;

        if (existing) {
            // Remove from wishlist
            const { error: deleteError } = await supabase
                .from('wishlists')
                .delete()
                .eq('id', existing.id);

            if (deleteError) throw deleteError;
            isWishlisted = false;
        } else {
            // Add to wishlist
            const { error: insertError } = await supabase
                .from('wishlists')
                .insert({ user_id: userId, itinerary_id: itineraryId });

            if (insertError) throw insertError;
            isWishlisted = true;
        }

        // 2. Update saveCount in metadata (Best Effort)
        // We first fetch the current metadata
        const { data: itinerary, error: itinError } = await supabase
            .from('itineraries')
            .select('metadata')
            .eq('id', itineraryId)
            .single();

        if (!itinError && itinerary && itinerary.metadata) {
            let currentCount = itinerary.metadata.saveCount || 0;
            if (isWishlisted) {
                currentCount += 1;
            } else {
                currentCount = Math.max(0, currentCount - 1);
            }

            const newMetadata = { ...itinerary.metadata, saveCount: currentCount };

            await supabase
                .from('itineraries')
                .update({ metadata: newMetadata })
                .eq('id', itineraryId);
        }

        res.json({ isWishlisted });

    } catch (error) {
        console.error('Error toggling wishlist:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/wishlist - Get all wishlisted itineraries for user
router.get('/', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('wishlists')
            .select(`
                itinerary_id,
                itineraries (
                    id,
                    metadata
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;

        // Transform to cleaner format
        const wishlists = data
            .map(item => {
                if (!item.itineraries) return null;
                return {
                    id: item.itineraries.id,
                    ...item.itineraries.metadata,
                    wishlistedAt: item.created_at
                };
            })
            .filter(Boolean); // Remove nulls if any join failed

        res.json(wishlists);

    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/wishlist/check/:id - Check if specific itinerary is wishlisted
router.get('/check/:id', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('itinerary_id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({ isWishlisted: !!data });

    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

export default router;

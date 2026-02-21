import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/destinations/:name
 *
 * Returns destination data (general info, attractions) and related community
 * itineraries for the programmatic SEO destination pages.
 *
 * Public — no auth required. Cached destination data only (no AI fallback).
 */
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const decodedName = decodeURIComponent(name).replace(/-/g, ' ');

        console.log(`[Destinations] Fetching page data for: ${decodedName}`);

        // 1. Fetch destination info (general_info + attractions)
        const { data: destination, error: destError } = await supabase
            .from('destinations')
            .select('name, general_info, attractions, updated_at')
            .ilike('name', decodedName)
            .single();

        if (destError || !destination) {
            console.log(`[Destinations] Not found: ${decodedName}`);
            return res.status(404).json({ error: 'Destination not found' });
        }

        // 2. Fetch community itineraries for this destination (top 6 public ones)
        const { data: itineraries, error: itinError } = await supabase
            .from('itineraries')
            .select('id, metadata, created_at, image_url')
            .eq('is_public', true)
            .ilike('metadata->>destination', decodedName)
            .order('created_at', { ascending: false })
            .limit(6);

        if (itinError) {
            console.error('[Destinations] Error fetching itineraries:', itinError);
        }

        // 3. Format community itineraries
        const communityTrips = (itineraries || []).map(item => ({
            id: item.id,
            destination: item.metadata?.destination || decodedName,
            days: item.metadata?.days?.length || 0,
            category: item.metadata?.category || 'General',
            tags: item.metadata?.tags || [],
            imageUrl: item.image_url || null,
            createdAt: item.created_at,
        }));

        // 4. Cache response for 5 minutes (destination data rarely changes)
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

        res.json({
            name: destination.name,
            generalInfo: destination.general_info,
            attractions: destination.attractions || [],
            communityTrips,
            updatedAt: destination.updated_at,
        });

    } catch (error) {
        console.error('[Destinations] Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/destinations
 *
 * Returns a list of all cached destinations (name only).
 * Useful for sitemap generation and discovery pages.
 */
router.get('/', async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('destinations')
            .select('name, updated_at')
            .not('general_info', 'is', null)
            .order('name');

        if (error) throw error;

        res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
        res.json(data || []);
    } catch (error) {
        console.error('[Destinations] Error listing destinations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

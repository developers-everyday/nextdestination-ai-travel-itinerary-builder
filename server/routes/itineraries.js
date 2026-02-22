import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../services/gemini.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';
import { checkSaveQuota, incrementSaves } from '../middleware/roleAuth.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars if not already loaded (though server index likely does)
dotenv.config();

const router = express.Router();

// Initialize Supabase configuration
// Support standard and Vite prefixes
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials in environment');
}

// Singleton anon client for public reads
const anonClient = createClient(supabaseUrl, supabaseKey);

// ── Authenticated Client Cache ──────────────────────────────────────────────
// createClient() allocates a new HTTP client on every call. Cache by token so
// repeated requests from the same user reuse one instance (5-minute TTL).
const CLIENT_CACHE_TTL = 5 * 60 * 1000;
const clientCache = new Map(); // token → { client, expiresAt }

setInterval(() => {
    const now = Date.now();
    for (const [key, val] of clientCache.entries()) {
        if (now > val.expiresAt) clientCache.delete(key);
    }
}, 60 * 1000);

// Helper to get an authenticated Supabase client if token is present
const getSupabase = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return anonClient;

    const cached = clientCache.get(token);
    if (cached && Date.now() < cached.expiresAt) return cached.client;

    const client = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    if (clientCache.size >= 1000) clientCache.delete(clientCache.keys().next().value);
    clientCache.set(token, { client, expiresAt: Date.now() + CLIENT_CACHE_TTL });
    return client;
};

// Start async embedding generation without blocking response
const generateAndSaveEmbedding = async (id, textContent, client) => {
    // We strictly use the ANON client for background updates unless we have SERVICE_ROLE_KEY
    // Exception: If the user just created it, they can update it. 
    // If the client passed here is authed as the user, it works.
    try {
        console.log(`[Async] Generating embedding for itinerary ${id}...`);
        const embedding = await generateEmbedding(textContent);

        if (embedding) {
            // Update the row with embedding
            const { error } = await client
                .from('itineraries')
                .update({ embedding })
                .eq('id', id);

            if (error) {
                console.error(`[Async] Failed to save embedding for ${id}:`, error);
            } else {
                console.log(`[Async] Embedding saved for ${id}`);
            }
        }
    } catch (e) {
        console.error(`[Async] Embedding generation failed for ${id}:`, e);
    }
};

// Helper to generate text representation
const generateItineraryText = (itinerary) => {
    const parts = [];
    if (itinerary.destination) parts.push(`Trip to ${itinerary.destination}`);
    if (itinerary.days) {
        itinerary.days.forEach(day => {
            parts.push(`Day ${day.day}: ${day.theme}`);
            if (day.activities) {
                day.activities.forEach(act => {
                    parts.push(`${act.time}: ${act.activity} at ${act.location}. ${act.description}`);
                });
            }
        });
    }
    return parts.join('\n');
};

// POST /api/itineraries/search - Search for similar itineraries
// Expects: { query: string } or { destination: string, interests: string[], category: string }
router.post('/search', async (req, res) => {
    try {
        const { query, destination, interests, category } = req.body;
        console.log('Search request received:', { query, destination, interests, category });

        let searchText = query;
        if (!searchText && destination) {
            searchText = `Trip to ${destination}`;
            if (interests && interests.length > 0) {
                searchText += ` with interests: ${interests.join(', ')}`;
            }
        }

        if (!searchText) {
            return res.status(400).json({ error: 'Search query or destination required' });
        }

        console.log('Generating embedding for:', searchText);
        const embedding = await generateEmbedding(searchText);

        // Import dynamically to avoid circular dependencies if any, though here it's fine
        const { searchSimilarItineraries } = await import('../services/vectorService.js');

        console.log('Searching vector store...');
        // Increased limit to allow for post-filtering
        const results = await searchSimilarItineraries(embedding, 0.5, 50);

        console.log(`Found ${results?.length || 0} matches`);

        let finalResults = results || [];

        // Apply category filter if provided
        if (category && category !== 'All') {
            finalResults = finalResults.filter(item =>
                item.metadata?.category?.toLowerCase() === category.toLowerCase()
            );
        }

        res.json(finalResults);
    } catch (error) {
        console.error('Error searching itineraries:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/itineraries/trending - Get trending/recent itineraries
router.get('/trending', async (req, res) => {
    try {
        const { destination, category } = req.query;
        const supabaseClient = getSupabase(req); // Keep using getSupabase for consistency

        let query = supabaseClient
            .from('itineraries')
            .select('id, metadata, user_id')
            .eq('is_public', true) // Explicitly only public
            .order('id', { ascending: false }) // 'created_at' if exists, else 'id' uuid not sortable by time usually. 
            // Better to sort by auto-generated timestamp if available, but for now ID is likely v4 random.
            // If created_at exists (it usually does as default), assume it's there.
            .limit(50); // Increased limit

        // If destination is provided, filter by it
        if (destination) {
            console.log(`Fetching trending itineraries for destination: ${destination}`);
            query = query.eq('metadata->>destination', destination);
        }

        // If category is provided, filter by it
        if (category && category !== 'All') {
            console.log(`Fetching trending itineraries for category: ${category}`);
            query = query.eq('metadata->>category', category);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Deduplicate by ID to prevent duplicate key issues in frontend
        const uniqueMap = new Map();
        data.forEach(item => {
            if (!uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, {
                    id: item.id,
                    ...item.metadata,
                    userId: item.user_id,
                    metadata: item.metadata
                });
            }
        });
        const results = Array.from(uniqueMap.values());

        // Trending content changes slowly — cache at the browser/CDN edge for 60s.
        // This alone can cut repeated DB hits by ~90% for the community browse view.
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
        res.json(results);
    } catch (error) {
        console.error('Error fetching trending itineraries:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/itineraries/my-trips - Get current user's trips
// verifyAuth populates req.user — no second auth.getUser() call needed
router.get('/my-trips', verifyAuth, async (req, res) => {
    const supabaseClient = getSupabase(req);

    try {
        const { data, error } = await supabaseClient
            .from('itineraries')
            .select('id, metadata, is_public, user_id')
            // RLS policy "auth.uid() = user_id" filters automatically
            .order('id', { ascending: false });

        if (error) throw error;

        const results = data.map(item => ({
            ...item.metadata,
            id: item.id,        // DB primary key must win over any id stored in metadata
            isPublic: item.is_public,
            userId: item.user_id
        }));

        res.json(results);

    } catch (error) {
        console.error('Error fetching my trips:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


// ... (previous imports)
import { generateAndSaveItineraryImage } from '../services/imageGenerationService.js';

// ... (previous code)

// POST /api/itineraries - Save itinerary (with save quota check)
// optionalAuth sets req.user for authenticated users; anonymous saves still allowed
router.post('/', optionalAuth, checkSaveQuota, async (req, res) => {
    const itineraryData = req.body;
    let isPublic = req.body.isPublic; // can be undefined
    const idToUse = itineraryData.id || crypto.randomUUID();

    if (!itineraryData) {
        return res.status(400).json({ error: 'Itinerary data is required' });
    }

    const supabaseClient = getSupabase(req);
    // req.user is set by verifyAuth if the route uses it, or we extract from the
    // cached client. For this optional-auth route, derive userId from the token
    // without a network call — checkSaveQuota already validated it upstream.
    const userId = req.user?.id ?? null;

    // Default Privacy Logic
    if (typeof isPublic === 'undefined') {
        // If user logged in -> default Private (false)
        // If anonymous -> must be Public (true) to be shareable
        isPublic = userId ? false : true;
    }

    const textContent = generateItineraryText(itineraryData);

    // Strip transient fields from metadata before persisting
    const metadataToSave = { ...itineraryData };
    delete metadataToSave.sourceImage; // transient hint, not persistent data
    delete metadataToSave.isPublic;    // stored as a separate column

    try {
        // Upsert allows update if ID matches and RLS permits
        const { data, error } = await supabaseClient
            .from('itineraries')
            .upsert({
                id: idToUse,
                content: textContent,
                metadata: metadataToSave,
                user_id: userId,
                // Do not overwrite is_public if it's already there and we aren't explicitly changing it
                ...(typeof isPublic !== 'undefined' ? { is_public: isPublic } : {}),
                // embedding will be done async
            })
            .select()
            .single();

        if (error) throw error;

        // Respond immediately
        res.json({ id: idToUse, message: 'Itinerary saved successfully. AI indexing and image generation in progress.' });

        // Increment save quota for authenticated users
        if (userId) {
            incrementSaves(userId).catch(err => console.error('[Quota] Save increment failed:', err));
        }

        // Trigger Async Embedding
        generateAndSaveEmbedding(idToUse, textContent, supabaseClient);

        // Trigger Async Image Generation (New Feature)
        // Extract key info for prompt
        const destination = itineraryData.destination || 'Unknown Destination';
        // Try to infer theme from tags or use a default
        const theme = (itineraryData.tags && itineraryData.tags.length > 0) ? itineraryData.tags[0] : 'Travel';

        // Build a summary of activities for the infographic
        let detailedActivities = '';
        const totalDaysCount = itineraryData.days?.length || 0;

        if (itineraryData.days && itineraryData.days.length > 0) {
            detailedActivities = itineraryData.days.map(day => {
                const activities = day.activities?.slice(0, 2).map(a => a.activity).join(', ') || 'Exploring';
                return `Day ${day.day}: ${day.theme || 'Discovery'} (${activities})`;
            }).join(' | ');
        }

        const keyActivity = detailedActivities || 'Sightseeing';

        // --- Image Generation with Source Image Reuse ---
        const sourceImage = itineraryData.sourceImage;
        let shouldGenerateImage = true;

        if (itineraryData.image) {
            // Already has an image (e.g., owner re-saving their own trip)
            shouldGenerateImage = false;
            console.log(`[ItineraryRoute] Skipping image generation — itinerary already has image.`);
        } else if (sourceImage) {
            // Remix scenario — reuse the source image instead of regenerating
            shouldGenerateImage = false;
            console.log(`[ItineraryRoute] Reusing source image for remix: ${sourceImage}`);

            // Update metadata with the reused image (fire-and-forget)
            const metadataWithImage = { ...itineraryData, image: sourceImage };
            // Clean up transient field from persisted metadata
            delete metadataWithImage.sourceImage;

            supabaseClient
                .from('itineraries')
                .update({ metadata: metadataWithImage })
                .eq('id', idToUse)
                .then(({ error: imgErr }) => {
                    if (imgErr) console.error(`[ItineraryRoute] Failed to save reused image:`, imgErr);
                    else console.log(`[ItineraryRoute] Source image saved to metadata successfully.`);
                });
        }

        if (shouldGenerateImage) {
            generateAndSaveItineraryImage(idToUse, destination, theme, keyActivity, totalDaysCount)
                .then(url => {
                    if (url) console.log(`[ItineraryRoute] Image generation succeeded: ${url}`);
                })
                .catch(err => console.error(`[ItineraryRoute] Image generation failed:`, err));
        }

    } catch (error) {
        console.error('Error saving itinerary:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/itineraries/:id - Get itinerary
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const supabaseClient = getSupabase(req);

    try {
        // RLS Policies will filter automatically based on client auth
        // If public -> access allowed
        // If private & owner -> access allowed
        // Else -> empty result (PGRST116) or 406

        const { data, error } = await supabaseClient
            .from('itineraries')
            .select('metadata, is_public, user_id')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Itinerary not found or private' });
            }
            throw error;
        }

        // Public itineraries can be edge-cached; private ones must not leak across users
        if (data.is_public) {
            res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
        } else {
            res.set('Cache-Control', 'private, no-store');
        }
        res.json({ ...data.metadata, isPublic: data.is_public, userId: data.user_id });
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// PATCH /api/itineraries/:id/privacy - Toggle privacy
// verifyAuth sets req.user — no second auth.getUser() call needed
router.patch('/:id/privacy', verifyAuth, async (req, res) => {
    const { id } = req.params;
    const { isPublic } = req.body;
    const supabaseClient = getSupabase(req);

    if (typeof isPublic === 'undefined') {
        return res.status(400).json({ error: 'isPublic field is required' });
    }

    try {
        // RLS ensures only the owner can update
        const { data, error } = await supabaseClient
            .from('itineraries')
            .update({ is_public: isPublic })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database error updating privacy:', error);
            return res.status(500).json({ error: 'Failed to update privacy status', details: error.message });
        }

        res.json({ success: true, isPublic: data.is_public });
    } catch (error) {
        console.error('Error in privacy toggle:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, extractItineraryFromTranscript } from '../services/gemini.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';
import { checkSaveQuota, incrementSaves } from '../middleware/roleAuth.js';
import dotenv from 'dotenv';
import path from 'path';
import { generateAndSaveItineraryImage } from '../services/imageGenerationService.js';

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
        const supabaseClient = getSupabase(req);

        let query = supabaseClient
            .from('itineraries')
            .select('id, metadata, user_id')
            .eq('is_public', true)
            .order('id', { ascending: false })
            .limit(50);

        if (destination) {
            console.log(`Fetching trending itineraries for destination: ${destination}`);
            query = query.eq('metadata->>destination', destination);
        }

        if (category && category !== 'All') {
            console.log(`Fetching trending itineraries for category: ${category}`);
            query = query.eq('metadata->>category', category);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Collect unique user IDs to batch-fetch profiles
        const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))];

        // Batch-fetch user profiles for all creators
        let profileMap = new Map();
        if (userIds.length > 0) {
            const { data: profiles } = await anonClient
                .from('user_profiles')
                .select('user_id, display_name, avatar_url, is_verified')
                .in('user_id', userIds);
            if (profiles) {
                profiles.forEach(p => profileMap.set(p.user_id, p));
            }
        }

        // Deduplicate and enrich with creator info
        const uniqueMap = new Map();
        data.forEach(item => {
            if (!uniqueMap.has(item.id)) {
                const profile = profileMap.get(item.user_id);
                uniqueMap.set(item.id, {
                    ...item.metadata,
                    id: item.id,
                    userId: item.user_id,
                    creator: profile ? {
                        id: item.user_id,
                        name: profile.display_name || 'Community Traveler',
                        avatar: profile.avatar_url || null,
                        verified: profile.is_verified || false,
                    } : null,
                    metadata: item.metadata
                });
            }
        });
        const results = Array.from(uniqueMap.values());

        // Trending content changes slowly — cache at the browser/CDN edge for 60s.
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


// ============================================================
// POST /api/itineraries/async-from-transcript
// Instant share URL + background itinerary generation from transcript
// ============================================================
router.post('/async-from-transcript', verifyAuth, async (req, res) => {
    try {
        const { transcript } = req.body;
        const userId = req.user.id;
        const token = req.headers.authorization?.split(' ')[1];

        if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
            return res.status(400).json({ error: 'Transcript text is required (minimum 50 characters)' });
        }

        // Generate ID immediately
        const idToUse = crypto.randomUUID();
        const supabaseClient = getSupabase(req);

        // Insert a pending row so the share URL works immediately
        const { error: insertError } = await supabaseClient
            .from('itineraries')
            .insert({
                id: idToUse,
                content: 'Generating from transcript...',
                metadata: { destination: 'Building...', days: [], status: 'pending' },
                user_id: userId,
                is_public: true,
                status: 'pending'
            });

        if (insertError) {
            console.error('[Transcript] Failed to insert pending row:', insertError);
            return res.status(500).json({ error: 'Failed to create itinerary placeholder' });
        }

        // Respond instantly with share URL
        res.json({
            id: idToUse,
            shareUrl: `/share/${idToUse}`,
            status: 'pending',
            message: 'Itinerary is being generated from your transcript. Share the link now!'
        });

        // ── Background: generate itinerary from transcript ──────────────
        (async () => {
            try {
                console.log(`[Transcript] Starting background generation for ${idToUse}...`);
                const itinerary = await extractItineraryFromTranscript(transcript);

                const textContent = generateItineraryText(itinerary);

                // Update the pending row with the full itinerary
                const authClient = getSupabase({ headers: { authorization: `Bearer ${token}` } });
                const { error: updateError } = await authClient
                    .from('itineraries')
                    .update({
                        content: textContent,
                        metadata: itinerary,
                        status: 'ready'
                    })
                    .eq('id', idToUse);

                if (updateError) {
                    console.error(`[Transcript] Failed to update itinerary ${idToUse}:`, updateError);
                    // Try to mark as error
                    await authClient.from('itineraries')
                        .update({ status: 'error' })
                        .eq('id', idToUse);
                } else {
                    console.log(`[Transcript] Itinerary ${idToUse} generated successfully.`);
                    // Start async embedding
                    generateAndSaveEmbedding(idToUse, textContent, authClient);
                }
            } catch (err) {
                console.error(`[Transcript] Background generation failed for ${idToUse}:`, err);
                try {
                    const authClient = getSupabase({ headers: { authorization: `Bearer ${token}` } });
                    await authClient.from('itineraries')
                        .update({ status: 'error' })
                        .eq('id', idToUse);
                } catch (_) { /* best effort */ }
            }
        })();

    } catch (error) {
        console.error('Error in async-from-transcript route:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// ============================================================
// GET /api/itineraries/status/:id — Poll itinerary build status
// Used by the share page to poll pending itineraries
// ============================================================
router.get('/status/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await anonClient
            .from('itineraries')
            .select('status, metadata')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ status: 'not_found' });
            }
            throw error;
        }

        res.json({
            status: data.status,
            itinerary: data.status === 'ready' ? data.metadata : null
        });
    } catch (error) {
        console.error('Error polling itinerary status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ============================================================
// GET /api/itineraries/by-user/:userId — Creator's public itineraries
// Used by the creator profile page
// ============================================================
router.get('/by-user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await anonClient
            .from('itineraries')
            .select('id, metadata, view_count, remix_count')
            .eq('user_id', userId)
            .eq('is_public', true)
            .eq('status', 'ready')
            .order('id', { ascending: false })
            .limit(50);

        if (error) throw error;

        const results = (data || []).map(item => ({
            ...item.metadata,
            id: item.id,
            viewCount: item.view_count || 0,
            remixCount: item.remix_count || 0
        }));

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
        res.json(results);
    } catch (error) {
        console.error('Error fetching creator itineraries:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

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

        // Increment remix_count on source itinerary if this is a remix
        if (itineraryData.sourceItineraryId) {
            anonClient
                .rpc('increment_counter', { row_id: itineraryData.sourceItineraryId, counter_name: 'remix_count' })
                .then(() => console.log(`[Remix] Incremented remix_count for ${itineraryData.sourceItineraryId}`))
                .catch(() => {
                    // Fallback: direct update if RPC not available
                    anonClient
                        .from('itineraries')
                        .select('remix_count')
                        .eq('id', itineraryData.sourceItineraryId)
                        .single()
                        .then(({ data: src }) => {
                            if (src) {
                                anonClient.from('itineraries')
                                    .update({ remix_count: (src.remix_count || 0) + 1 })
                                    .eq('id', itineraryData.sourceItineraryId)
                                    .then(() => console.log(`[Remix] Incremented remix_count via fallback`));
                            }
                        });
                });
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
        const { data, error } = await supabaseClient
            .from('itineraries')
            .select('metadata, is_public, user_id, status, view_count, remix_count')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Itinerary not found or private' });
            }
            throw error;
        }

        // Increment view_count in background (fire-and-forget)
        (async () => {
            try {
                await anonClient
                    .from('itineraries')
                    .update({ view_count: (data.view_count || 0) + 1 })
                    .eq('id', id);
            } catch (err) {
                console.error('[Views] Failed to increment:', err);
            }
        })();

        // Public itineraries can be edge-cached; private ones must not leak across users
        if (data.is_public) {
            res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
        } else {
            res.set('Cache-Control', 'private, no-store');
        }
        res.json({
            ...data.metadata,
            isPublic: data.is_public,
            userId: data.user_id,
            status: data.status || 'ready',
            viewCount: data.view_count || 0,
            remixCount: data.remix_count || 0
        });
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

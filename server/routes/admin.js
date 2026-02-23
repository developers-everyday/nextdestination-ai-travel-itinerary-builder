import express from 'express';
import { supabase } from '../db/supabase.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleAuth.js';
import { generateGeneralInfo, generateAttractions, generateEmbedding, generateQuickItinerary } from '../services/gemini.js';
import { generateAndSaveItineraryImage } from '../services/imageGenerationService.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyAuth, requireRole('admin'));

// ─── Helper ────────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const generateItineraryText = (metadata) => {
    const parts = [];
    if (metadata.destination) parts.push(`Trip to ${metadata.destination}`);
    if (metadata.days) {
        metadata.days.forEach(day => {
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/admin/stats — Dashboard overview stats
router.get('/stats', async (req, res) => {
    try {
        // Destinations stats
        const { data: destinations, error: destErr } = await supabase
            .from('destinations')
            .select('id, name, general_info, attractions');

        if (destErr) throw destErr;

        const totalDestinations = destinations?.length || 0;
        const enrichedDestinations = destinations?.filter(d => d.general_info)?.length || 0;
        const missingInfo = totalDestinations - enrichedDestinations;
        const missingAttractions = destinations?.filter(d => !d.attractions)?.length || 0;

        // Itineraries stats
        const { data: itineraries, error: itinErr } = await supabase
            .from('itineraries')
            .select('id, is_public, embedding, metadata');

        if (itinErr) throw itinErr;

        const totalItineraries = itineraries?.length || 0;
        const publicItineraries = itineraries?.filter(i => i.is_public)?.length || 0;
        const privateItineraries = totalItineraries - publicItineraries;
        const withEmbeddings = itineraries?.filter(i => i.embedding)?.length || 0;
        const missingEmbeddings = totalItineraries - withEmbeddings;
        const withImages = itineraries?.filter(i => i.metadata?.image)?.length || 0;
        const missingImages = totalItineraries - withImages;

        res.json({
            destinations: {
                total: totalDestinations,
                enriched: enrichedDestinations,
                missingInfo,
                missingAttractions,
            },
            itineraries: {
                total: totalItineraries,
                public: publicItineraries,
                private: privateItineraries,
                withEmbeddings,
                missingEmbeddings,
                withImages,
                missingImages,
            },
        });
    } catch (error) {
        console.error('[Admin] Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DESTINATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/admin/destinations — List all destinations with enrichment status
router.get('/destinations', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('destinations')
            .select('id, name, general_info, attractions, updated_at')
            .order('name');

        if (error) throw error;

        const destinations = (data || []).map(d => ({
            id: d.id,
            name: d.name,
            hasGeneralInfo: !!d.general_info,
            hasAttractions: !!d.attractions,
            generalInfo: d.general_info,
            attractions: d.attractions,
            updatedAt: d.updated_at,
        }));

        res.json(destinations);
    } catch (error) {
        console.error('[Admin] List destinations error:', error);
        res.status(500).json({ error: 'Failed to fetch destinations' });
    }
});

// POST /api/admin/destinations/add — Add new destinations (names only, no enrichment)
router.post('/destinations/add', async (req, res) => {
    try {
        const { names } = req.body;
        if (!names || !Array.isArray(names) || names.length === 0) {
            return res.status(400).json({ error: 'names array is required' });
        }

        const results = [];
        for (const name of names) {
            const trimmed = name.trim();
            if (!trimmed) continue;

            const { error } = await supabase
                .from('destinations')
                .upsert({ name: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'name' });

            results.push({ name: trimmed, status: error ? 'failed' : 'added', error: error?.message });
        }

        res.json({ results });
    } catch (error) {
        console.error('[Admin] Add destinations error:', error);
        res.status(500).json({ error: 'Failed to add destinations' });
    }
});

// POST /api/admin/destinations/enrich — Enrich a single destination
router.post('/destinations/enrich', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const generalInfo = await generateGeneralInfo(name);
        await delay(2000);
        const attractions = await generateAttractions(name);

        const { error } = await supabase
            .from('destinations')
            .upsert({
                name,
                general_info: generalInfo,
                attractions,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'name' });

        if (error) throw error;

        res.json({ success: true, name, generalInfo, attractions });
    } catch (error) {
        console.error('[Admin] Enrich destination error:', error);
        res.status(500).json({ error: `Failed to enrich ${req.body.name}: ${error.message}` });
    }
});

// POST /api/admin/destinations/enrich-bulk — Enrich array of destinations (SSE)
router.post('/destinations/enrich-bulk', async (req, res) => {
    const { names } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: 'names array is required' });
    }

    // Set up SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const total = names.length;
    let seeded = 0, skipped = 0, failed = 0;

    for (let i = 0; i < total; i++) {
        const name = names[i].trim();
        if (!name) { skipped++; continue; }

        try {
            // Check if already enriched
            const { data: existing } = await supabase
                .from('destinations')
                .select('general_info')
                .ilike('name', name)
                .single();

            if (existing?.general_info) {
                skipped++;
                sendEvent({ current: i + 1, total, name, status: 'skipped' });
                continue;
            }

            const generalInfo = await generateGeneralInfo(name);
            await delay(2000);
            const attractions = await generateAttractions(name);
            await delay(2000);

            const { error } = await supabase
                .from('destinations')
                .upsert({
                    name,
                    general_info: generalInfo,
                    attractions,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'name' });

            if (error) throw error;

            seeded++;
            sendEvent({ current: i + 1, total, name, status: 'seeded' });
        } catch (err) {
            failed++;
            sendEvent({ current: i + 1, total, name, status: 'failed', error: err.message });
            await delay(5000);
        }
    }

    sendEvent({ done: true, seeded, skipped, failed });
    res.end();
});

// DELETE /api/admin/destinations/:id — Delete a destination
router.delete('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('destinations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('[Admin] Delete destination error:', error);
        res.status(500).json({ error: 'Failed to delete destination' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ITINERARIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/admin/itineraries — List all itineraries with enrichment status
router.get('/itineraries', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('id, content, metadata, embedding, is_public, user_id, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const itineraries = (data || []).map(i => ({
            id: i.id,
            destination: i.metadata?.destination || 'Unknown',
            duration: i.metadata?.days?.length || 0,
            category: i.metadata?.category || i.metadata?.tags?.[0] || 'General',
            creator: i.user_id || 'anonymous',
            hasEmbedding: !!i.embedding,
            hasImage: !!i.metadata?.image,
            isPublic: i.is_public,
            createdAt: i.created_at,
        }));

        res.json(itineraries);
    } catch (error) {
        console.error('[Admin] List itineraries error:', error);
        res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
});

// GET /api/admin/itineraries/:id — Get full itinerary details
router.get('/itineraries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json({
            id: data.id,
            content: data.content,
            metadata: data.metadata,
            hasEmbedding: !!data.embedding,
            isPublic: data.is_public,
            userId: data.user_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        });
    } catch (error) {
        console.error('[Admin] Get itinerary error:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});

// PATCH /api/admin/itineraries/:id — Update itinerary metadata (manual edit)
router.patch('/itineraries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { metadata } = req.body;

        if (!metadata) return res.status(400).json({ error: 'metadata is required' });

        // Regenerate text content from updated metadata
        const textContent = generateItineraryText(metadata);

        const { data, error } = await supabase
            .from('itineraries')
            .update({ metadata, content: textContent, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('[Admin] Update itinerary error:', error);
        res.status(500).json({ error: 'Failed to update itinerary' });
    }
});

// POST /api/admin/itineraries/:id/regenerate — AI-regenerate descriptions/themes
router.post('/itineraries/:id/regenerate', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch current itinerary
        const { data: current, error: fetchErr } = await supabase
            .from('itineraries')
            .select('metadata')
            .eq('id', id)
            .single();

        if (fetchErr) throw fetchErr;

        const meta = current.metadata;
        const destination = meta.destination || 'Unknown';
        const days = meta.days?.length || 3;
        const interests = meta.tags || [];

        // Generate new itinerary content
        const newItinerary = await generateQuickItinerary(destination, days, interests);

        // Merge: keep existing structure, update themes and descriptions
        const mergedDays = (meta.days || []).map((existingDay, idx) => {
            const newDay = newItinerary.days?.[idx];
            if (!newDay) return existingDay;
            return {
                ...existingDay,
                theme: newDay.theme || existingDay.theme,
                activities: existingDay.activities.map((act, actIdx) => {
                    const newAct = newDay.activities?.[actIdx];
                    if (!newAct) return act;
                    return {
                        ...act,
                        description: newAct.description || act.description,
                    };
                }),
            };
        });

        const updatedMetadata = { ...meta, days: mergedDays };
        const textContent = generateItineraryText(updatedMetadata);

        const { error: updateErr } = await supabase
            .from('itineraries')
            .update({ metadata: updatedMetadata, content: textContent, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateErr) throw updateErr;
        res.json({ success: true, metadata: updatedMetadata });
    } catch (error) {
        console.error('[Admin] Regenerate itinerary error:', error);
        res.status(500).json({ error: `Failed to regenerate: ${error.message}` });
    }
});

// POST /api/admin/itineraries/:id/embedding — Generate/regenerate embedding
router.post('/itineraries/:id/embedding', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: current, error: fetchErr } = await supabase
            .from('itineraries')
            .select('metadata, content')
            .eq('id', id)
            .single();

        if (fetchErr) throw fetchErr;

        const textContent = current.content || generateItineraryText(current.metadata);
        const embedding = await generateEmbedding(textContent);

        const { error: updateErr } = await supabase
            .from('itineraries')
            .update({ embedding })
            .eq('id', id);

        if (updateErr) throw updateErr;
        res.json({ success: true });
    } catch (error) {
        console.error('[Admin] Generate embedding error:', error);
        res.status(500).json({ error: `Failed to generate embedding: ${error.message}` });
    }
});

// POST /api/admin/itineraries/:id/image — Generate/regenerate image
router.post('/itineraries/:id/image', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: current, error: fetchErr } = await supabase
            .from('itineraries')
            .select('metadata')
            .eq('id', id)
            .single();

        if (fetchErr) throw fetchErr;

        const meta = current.metadata;
        const destination = meta.destination || 'Unknown';
        const theme = meta.tags?.[0] || 'Travel';
        const totalDays = meta.days?.length || 0;

        let keyActivity = 'Sightseeing';
        if (meta.days?.length > 0) {
            keyActivity = meta.days.map(day => {
                const activities = day.activities?.slice(0, 2).map(a => a.activity).join(', ') || 'Exploring';
                return `Day ${day.day}: ${day.theme || 'Discovery'} (${activities})`;
            }).join(' | ');
        }

        const imageUrl = await generateAndSaveItineraryImage(id, destination, theme, keyActivity, totalDays);

        if (!imageUrl) {
            return res.status(500).json({ error: 'Image generation returned null' });
        }

        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('[Admin] Generate image error:', error);
        res.status(500).json({ error: `Failed to generate image: ${error.message}` });
    }
});

// PATCH /api/admin/itineraries/:id/privacy — Toggle public/private
router.patch('/itineraries/:id/privacy', async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublic } = req.body;

        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ error: 'isPublic boolean is required' });
        }

        const { error } = await supabase
            .from('itineraries')
            .update({ is_public: isPublic })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, isPublic });
    } catch (error) {
        console.error('[Admin] Toggle privacy error:', error);
        res.status(500).json({ error: 'Failed to toggle privacy' });
    }
});

// DELETE /api/admin/itineraries/:id — Delete itinerary
router.delete('/itineraries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('itineraries')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('[Admin] Delete itinerary error:', error);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
});

// POST /api/admin/itineraries/bulk-embeddings — Batch generate missing embeddings (SSE)
router.post('/itineraries/bulk-embeddings', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // Fetch itineraries missing embeddings
        const { data: itineraries, error } = await supabase
            .from('itineraries')
            .select('id, content, metadata')
            .is('embedding', null);

        if (error) throw error;

        const total = itineraries?.length || 0;
        let completed = 0, failed = 0;

        for (let i = 0; i < total; i++) {
            const itin = itineraries[i];
            try {
                const textContent = itin.content || generateItineraryText(itin.metadata);
                const embedding = await generateEmbedding(textContent);

                await supabase
                    .from('itineraries')
                    .update({ embedding })
                    .eq('id', itin.id);

                completed++;
                sendEvent({
                    current: i + 1,
                    total,
                    id: itin.id,
                    destination: itin.metadata?.destination || 'Unknown',
                    status: 'completed',
                });
            } catch (err) {
                failed++;
                sendEvent({
                    current: i + 1,
                    total,
                    id: itin.id,
                    destination: itin.metadata?.destination || 'Unknown',
                    status: 'failed',
                    error: err.message,
                });
            }
            await delay(1000);
        }

        sendEvent({ done: true, completed, failed, total });
    } catch (error) {
        sendEvent({ done: true, error: error.message });
    }

    res.end();
});

// POST /api/admin/itineraries/bulk-images — Batch generate missing images (SSE)
router.post('/itineraries/bulk-images', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // Fetch all itineraries, then filter for missing images client-side
        // (metadata->image is inside JSONB, harder to filter in SQL)
        const { data: allItineraries, error } = await supabase
            .from('itineraries')
            .select('id, metadata');

        if (error) throw error;

        const itineraries = (allItineraries || []).filter(i => !i.metadata?.image);
        const total = itineraries.length;
        let completed = 0, failed = 0;

        for (let i = 0; i < total; i++) {
            const itin = itineraries[i];
            const meta = itin.metadata;
            try {
                const destination = meta?.destination || 'Unknown';
                const theme = meta?.tags?.[0] || 'Travel';
                const totalDays = meta?.days?.length || 0;

                let keyActivity = 'Sightseeing';
                if (meta?.days?.length > 0) {
                    keyActivity = meta.days.map(day => {
                        const activities = day.activities?.slice(0, 2).map(a => a.activity).join(', ') || 'Exploring';
                        return `Day ${day.day}: ${day.theme || 'Discovery'} (${activities})`;
                    }).join(' | ');
                }

                const imageUrl = await generateAndSaveItineraryImage(itin.id, destination, theme, keyActivity, totalDays);

                if (imageUrl) {
                    completed++;
                    sendEvent({
                        current: i + 1,
                        total,
                        id: itin.id,
                        destination,
                        status: 'completed',
                        imageUrl,
                    });
                } else {
                    failed++;
                    sendEvent({ current: i + 1, total, id: itin.id, destination, status: 'failed' });
                }
            } catch (err) {
                failed++;
                sendEvent({
                    current: i + 1,
                    total,
                    id: itin.id,
                    destination: meta?.destination || 'Unknown',
                    status: 'failed',
                    error: err.message,
                });
            }
            await delay(2000);
        }

        sendEvent({ done: true, completed, failed, total });
    } catch (error) {
        sendEvent({ done: true, error: error.message });
    }

    res.end();
});

export default router;

import express from 'express';
import crypto from 'crypto';
import { generateEmbedding, generateQuickItinerary } from '../services/gemini.js';
import { searchSimilarItineraries, storeItinerary } from '../services/vectorService.js';
import { verifyAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../db/supabase.js';
import {
    lookupTemplate,
    populateTemplateCache,
    createJob,
    completeJob,
    failJob,
    getJobStatus
} from '../services/templateService.js';

const router = express.Router();

// ============================================================
// POST /api/suggestions — Cache-first synchronous generation
// Priority: 1) Template cache  2) Vector search  3) Gemini AI
// ============================================================
router.post('/', verifyAuth, async (req, res) => {
    try {
        const { destination, days = 3, interests = [], tripType = 'general' } = req.body;
        const userId = req.user.id;
        const token = req.headers.authorization?.split(' ')[1];

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        // ── Step 1: Fast Template Cache Lookup (<50ms) ──
        const cachedTemplate = await lookupTemplate(destination, days, tripType);
        if (cachedTemplate) {
            console.log(`[Suggestions] Template cache HIT for "${destination}" ${days}d`);
            return res.json({
                source: 'template-cache',
                data: cachedTemplate.itinerary_data
            });
        }

        // ── Step 2: Vector Search (Semantic Similarity) ──
        const queryText = `Trip to ${destination} with interests: ${interests.join(', ')}`;
        const queryEmbedding = await generateEmbedding(queryText);

        const similarItineraries = await searchSimilarItineraries(queryEmbedding, 0.75, 1);

        if (similarItineraries && similarItineraries.length > 0) {
            const bestMatch = similarItineraries[0];
            console.log(`[Suggestions] Vector cache HIT: ${bestMatch.id} (similarity: ${bestMatch.similarity})`);

            // Populate template cache from vector hit for faster future lookups
            populateTemplateCache(destination, days, bestMatch.metadata, tripType)
                .catch(err => console.error('[Suggestions] Template cache populate failed:', err));

            return res.json({
                source: 'vector-cache',
                data: bestMatch.metadata
            });
        }

        // ── Step 3: Fallback to Gemini AI ──
        console.log('[Suggestions] No cache found, generating with Gemini...');
        const generatedItinerary = await generateQuickItinerary(destination, days, interests);

        // ── Step 4: Background Tasks (non-blocking) ──
        // Store in vector DB
        const authClient = getAuthenticatedClient(token);
        const itineraryEmbedding = await generateEmbedding(JSON.stringify(generatedItinerary));
        storeItinerary(generatedItinerary, itineraryEmbedding, authClient, userId)
            .catch(err => console.error('[Suggestions] Vector store failed:', err));

        // Populate template cache for future fast lookups
        populateTemplateCache(destination, days, generatedItinerary, tripType)
            .catch(err => console.error('[Suggestions] Template cache populate failed:', err));

        res.json({
            source: 'gemini',
            data: generatedItinerary
        });

    } catch (error) {
        console.error('Error in suggestions route:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


// ============================================================
// POST /api/suggestions/async — Non-blocking async generation
// Returns immediately with a jobId for polling
// ============================================================
router.post('/async', verifyAuth, async (req, res) => {
    try {
        const { destination, days = 3, interests = [], tripType = 'general' } = req.body;
        const userId = req.user.id;
        const token = req.headers.authorization?.split(' ')[1];

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const jobId = crypto.randomUUID();
        createJob(jobId, days);

        // Respond immediately
        res.json({
            jobId,
            status: 'processing',
            totalDays: days
        });

        // ── Background Generation ──
        (async () => {
            try {
                // Try template cache first
                const cachedTemplate = await lookupTemplate(destination, days, tripType);
                if (cachedTemplate) {
                    console.log(`[AsyncGen] Template cache HIT for job ${jobId}`);
                    completeJob(jobId, cachedTemplate.itinerary_data);
                    return;
                }

                // Try vector search
                const queryText = `Trip to ${destination} with interests: ${interests.join(', ')}`;
                const queryEmbedding = await generateEmbedding(queryText);
                const similar = await searchSimilarItineraries(queryEmbedding, 0.75, 1);

                if (similar && similar.length > 0) {
                    console.log(`[AsyncGen] Vector cache HIT for job ${jobId}`);
                    const itinerary = similar[0].metadata;
                    completeJob(jobId, itinerary);

                    // Populate template cache
                    populateTemplateCache(destination, days, itinerary, tripType)
                        .catch(err => console.error('[AsyncGen] Template populate failed:', err));
                    return;
                }

                // Fallback to Gemini
                console.log(`[AsyncGen] Generating with Gemini for job ${jobId}...`);
                const generatedItinerary = await generateQuickItinerary(destination, days, interests);
                completeJob(jobId, generatedItinerary);

                // Background: store in vector DB + template cache
                const authClient = getAuthenticatedClient(token);
                const embedding = await generateEmbedding(JSON.stringify(generatedItinerary));
                storeItinerary(generatedItinerary, embedding, authClient, userId)
                    .catch(err => console.error('[AsyncGen] Vector store failed:', err));
                populateTemplateCache(destination, days, generatedItinerary, tripType)
                    .catch(err => console.error('[AsyncGen] Template populate failed:', err));

            } catch (err) {
                console.error(`[AsyncGen] Job ${jobId} failed:`, err);
                failJob(jobId, err.message || 'Generation failed');
            }
        })();

    } catch (error) {
        console.error('Error in async suggestions route:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


// ============================================================
// GET /api/suggestions/status/:jobId — Poll generation status
// Returns: { status, totalDays, completedDays, itinerary, error }
// ============================================================
router.get('/status/:jobId', verifyAuth, async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await getJobStatus(jobId);
        res.json(status);
    } catch (error) {
        console.error('Error checking job status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

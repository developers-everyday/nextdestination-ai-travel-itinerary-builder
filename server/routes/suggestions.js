import express from 'express';
import { generateEmbedding, generateQuickItinerary } from '../services/gemini.js';
import { searchSimilarItineraries, storeItinerary } from '../services/vectorService.js';
import { verifyAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../db/supabase.js';

const router = express.Router();

router.post('/', verifyAuth, async (req, res) => {
    try {
        const { destination, days = 3, interests = [] } = req.body;
        const userId = req.user.id;
        const token = req.headers.authorization?.split(' ')[1];

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        // 1. Generate Query Embedding
        const queryText = `Trip to ${destination} with interests: ${interests.join(', ')}`;
        const queryEmbedding = await generateEmbedding(queryText);

        // 2. Vector Search (Use authenticated client if needed, or default/anon for search)
        // Search usually can be public or anon, but if we want to search ONLY user's stuff we'd need auth client.
        // For general "similar itineraries", anon/public is usually fine or we use the auth client.
        // Let's use the default (public) search for now unless we want to restrict search.
        const similarItineraries = await searchSimilarItineraries(queryEmbedding, 0.8, 1);

        if (similarItineraries && similarItineraries.length > 0) {
            const bestMatch = similarItineraries[0];
            console.log(`Found cached itinerary: ${bestMatch.id}`);
            return res.json({
                source: 'cache',
                data: bestMatch.metadata
            });
        }

        // 3. Fallback to Gemini
        console.log('No cache found, generating with Gemini...');
        const generatedItinerary = await generateQuickItinerary(destination, days, interests);

        // 4. Store in Vector DB
        // Use Authenticated Client to pass RLS
        const authClient = getAuthenticatedClient(token);

        const itineraryEmbedding = await generateEmbedding(JSON.stringify(generatedItinerary));

        // Pass authClient and userId
        await storeItinerary(generatedItinerary, itineraryEmbedding, authClient, userId);

        res.json({
            source: 'gemini',
            data: generatedItinerary
        });

    } catch (error) {
        console.error('Error in suggestions route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

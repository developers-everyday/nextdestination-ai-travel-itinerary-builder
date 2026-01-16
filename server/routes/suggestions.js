import express from 'express';
import { generateEmbedding, generateQuickItinerary } from '../services/gemini.js';
import { searchSimilarItineraries, storeItinerary } from '../services/vectorService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { destination, days = 3, interests = [] } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        // 1. Generate Query Embedding
        const queryText = `Trip to ${destination} with interests: ${interests.join(', ')}`;
        const queryEmbedding = await generateEmbedding(queryText);

        // 2. Vector Search
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

        // 4. Store in Vector DB (Async - don't block response too long, or await if critical)
        // We await it here to ensure it's saved, but could be backgrounded.
        const itineraryEmbedding = await generateEmbedding(JSON.stringify(generatedItinerary));
        await storeItinerary(generatedItinerary, itineraryEmbedding);

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

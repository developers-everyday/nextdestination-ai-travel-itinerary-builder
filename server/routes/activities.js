import express from 'express';
import { supabase } from '../db/supabase.js';
import { generateEmbedding, searchActivitiesWithGemini } from '../services/gemini.js';
import { getPlaceCoordinates } from '../services/googleMaps.js';

const router = express.Router();

// GET /api/activities/popular?destination=Paris
router.get('/popular', async (req, res) => {
    try {
        const { destination } = req.query;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const { data: activities, error } = await supabase
            .from('activities')
            .select('*')
            .eq('destination', destination)
            .limit(20);

        if (error) {
            console.error('Error fetching popular activities:', error);
            throw error;
        }

        res.json({
            source: 'database',
            results: activities
        });

    } catch (error) {
        console.error('Error in popular activities route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const searchActivitiesInDb = async (embedding, destination, threshold = 0.7, limit = 5) => {
    const { data: activities, error } = await supabase.rpc('match_activities', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
        filter_destination: destination || null,
    });

    if (error) {
        console.error('Error searching activities in DB:', error);
        throw error;
    }

    return activities;
};

router.post('/search', async (req, res) => {
    try {
        const { query, destination } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`Searching for "${query}" in "${destination}"`);

        // 1. Generate Embedding for the query
        // If we have a destination filter, searching just for the "thing" gives better semantic separation
        // preventing the destination name from dominating the similarity score.
        const embeddingPrompt = destination ? query : `${query} in ${destination || ''}`;
        const queryEmbedding = await generateEmbedding(embeddingPrompt);

        // 2. Search in Supabase (Vector Search)
        // Increased threshold to 0.78 to ensure high relevance and trigger fallback if not found.
        let results = await searchActivitiesInDb(queryEmbedding, destination, 0.78, 5);

        console.log(`DB Search Results: ${results?.length || 0}`);

        if (results && results.length > 0) {
            return res.json({
                source: 'database',
                results: results
            });
        }

        // 3. Fallback to Gemini (LLM) if no/few results found
        console.log('Insufficient DB results, falling back to Gemini...');
        const geminiSuggestions = await searchActivitiesWithGemini(query, destination);

        // Deduplication Step: Check which of these already exist in DB by name
        const geminiNames = geminiSuggestions.map(g => g.name);
        const { data: existingActivities, error: checkError } = await supabase
            .from('activities')
            .select('*')
            .eq('destination', destination || 'Global')
            .in('name', geminiNames);

        const existingMap = new Map();
        if (existingActivities) {
            existingActivities.forEach(act => existingMap.set(act.name.toLowerCase(), act));
        }

        const newActivitiesToProcess = geminiSuggestions.filter(g => !existingMap.has(g.name.toLowerCase()));

        // 4. Enrich & Store ONLY new findings
        const newProcessedResults = await Promise.all(newActivitiesToProcess.map(async (item) => {
            // ... same enrichment logic ...
            // Fetch real coordinates from Google Places
            let realCoords = null;
            try {
                const coords = await getPlaceCoordinates(item.name, destination);
                if (coords) {
                    realCoords = coords; //{ lat, lng }
                }
            } catch (err) {
                console.warn(`Failed to fetch coords for ${item.name}`, err);
            }

            const finalCoords = realCoords || (item.coordinates ? { lat: item.coordinates[1], lng: item.coordinates[0] } : null);

            // Prepare record for DB
            const newRecord = {
                destination: destination || 'Global',
                name: item.name,
                description: item.description,
                location: item.location,
                coordinates: finalCoords,
                metadata: {
                    price: item.price,
                    rating: item.rating,
                    image: item.image,
                    type: item.type
                },
            };

            // Generate embedding for the item to be stored
            const contentText = `${item.name} ${item.description} ${item.location} ${item.type}`;
            const embedding = await generateEmbedding(contentText);

            return { ...newRecord, embedding };
        }));

        let finalResults = [];

        // Insert new ones if any
        if (newProcessedResults.length > 0) {
            const { data: insertedData, error: insertError } = await supabase
                .from('activities')
                .insert(newProcessedResults)
                .select();

            if (insertError) {
                console.error('Error saving new activities to DB:', insertError);
            } else {
                finalResults = [...(insertedData || [])];
            }
        }

        // Combine with existing text-matched activities that we found
        const existingList = Array.from(existingMap.values());
        finalResults = [...finalResults, ...existingList];

        res.json({
            source: 'gemini', // mixed, but triggered by gemini fallback flow
            results: finalResults
        });

    } catch (error) {
        console.error('Error in activity search route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

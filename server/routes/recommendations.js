import express from 'express';
import { getSession } from '../db/neo4j.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/recommend
// Body: { destination: string, interests: string[] }
router.post('/', verifyAuth, async (req, res) => {
    const { destination, interests } = req.body;

    if (!destination) {
        return res.status(400).json({ error: 'Destination is required' });
    }

    const session = getSession();

    try {
        // Simple Content-Based Filtering:
        // Find places in the destination that have tags matching the user's interests.
        // Return places ordered by how many interests they match, then by rating.
        const query = `
      MATCH (d:Destination {name: $destination})<-[:LOCATED_IN]-(p:Place)
      OPTIONAL MATCH (p)-[:HAS_TAG]->(i:Interest)
      WHERE i.name IN $interests
      WITH p, count(i) as interestMatchCount, collect(i.name) as matchedInterests
      RETURN p.name as name, p.type as type, p.rating as rating, p.tags as tags, matchedInterests
      ORDER BY interestMatchCount DESC, p.rating DESC
      LIMIT 10
    `;

        const result = await session.run(query, { destination, interests: interests || [] });

        const recommendations = result.records.map(record => ({
            name: record.get('name'),
            type: record.get('type'),
            rating: record.get('rating'),
            matchedInterests: record.get('matchedInterests')
        }));

        res.json({ recommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await session.close();
    }
});

import { supabase } from '../db/supabase.js';
import { generateEmbedding } from '../services/gemini.js';

// POST /api/recommend/vector
// Body: { query: string }
router.post('/vector', verifyAuth, async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const queryEmbedding = await generateEmbedding(query);

        // Call Supabase RPC function match_itineraries
        const { data, error } = await supabase.rpc('match_itineraries', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Adjust threshold as needed
            match_count: 5
        });

        if (error) {
            console.error('Supabase Vector Search Error:', error);
            return res.status(500).json({ error: 'Vector search failed' });
        }

        res.json({ recommendations: data });

    } catch (error) {
        console.error('Error in vector recommendation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

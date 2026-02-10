import express from 'express';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();


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

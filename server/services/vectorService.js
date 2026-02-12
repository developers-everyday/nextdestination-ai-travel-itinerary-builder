import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

export const searchSimilarItineraries = async (embedding, threshold = 0.7, limit = 5) => {
    const { data: documents, error } = await supabase.rpc('match_itineraries', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
    });

    if (error) {
        console.error('Error searching vector store:', error);
        throw error;
    }

    return documents;
};

export const storeItinerary = async (itinerary, embedding, client = supabase, userId = null) => {
    // Generate a content string for search compatibility
    // combining destination, tags/themes, and activity names
    const content = `
        Destination: ${itinerary.destination}
        Days: ${itinerary.days?.length || 0}
        Theme: ${itinerary.days?.map(d => d.theme).join(', ') || ''}
        Activities: ${itinerary.days?.flatMap(d => d.activities?.map(a => a.activity)).join(', ') || ''}
    `.trim();

    const insertPayload = {
        id: itinerary.id || crypto.randomUUID(),
        content,
        metadata: itinerary,
        embedding
    };

    if (userId) {
        insertPayload.user_id = userId;
    }

    const { data, error } = await client
        .from('itineraries')
        .insert(insertPayload)
        .select()
        .single();

    if (error) {
        console.error('Error storing itinerary:', error);
        throw error;
    }

    return data;
};

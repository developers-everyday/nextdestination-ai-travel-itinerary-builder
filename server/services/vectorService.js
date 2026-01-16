import { supabase } from '../db/supabase.js';

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

export const storeItinerary = async (itinerary, embedding) => {
    // Generate a content string for search compatibility
    // combining destination, tags/themes, and activity names
    const content = `
        Destination: ${itinerary.destination}
        Days: ${itinerary.days?.length || 0}
        Theme: ${itinerary.days?.map(d => d.theme).join(', ') || ''}
        Activities: ${itinerary.days?.flatMap(d => d.activities?.map(a => a.activity)).join(', ') || ''}
    `.trim();

    const { data, error } = await supabase
        .from('itineraries')
        .insert({
            id: itinerary.id || crypto.randomUUID(),
            content,
            metadata: itinerary,
            embedding
        })
        .select()
        .single();

    if (error) {
        console.error('Error storing itinerary:', error);
        throw error;
    }

    return data;
};

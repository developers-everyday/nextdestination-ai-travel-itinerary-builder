import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) console.warn("GEMINI_API_KEY is missing for Image Generation.");

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Initialize Supabase Admin Client (Service Role for Storage Uploads)
// We need SERVICE_ROLE_KEY to bypass RLS policies if we are running in backend
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    } catch (e) {
        console.error("Failed to initialize Supabase Admin client:", e);
    }
} else {
    console.warn("Supabase Service Key missing. Image generation will work but saving will fail.");
}

/**
 * Generates an AI image for the itinerary and saves it to Supabase Storage.
 * @param {string} itineraryId - The ID of the itinerary (used for filename)
 * @param {string} destination - Destination name
 * @param {string} theme - Trip theme (e.g., "Romantic", "Adventure")
 * @param {string} keyActivity - Highlight activity to feature
 * @return {Promise<string|null>} - The public URL of the generated image or null
 */
export const generateAndSaveItineraryImage = async (itineraryId, destination, theme, keyActivity) => {
    if (!supabaseAdmin) {
        console.error("[ImageGen] Aborting: Supabase Admin Client not initialized (missing SERVICE_ROLE_KEY).");
        return null;
    }

    try {
        console.log(`[ImageGen] Starting generation for ${itineraryId} (${destination}) using Gemini 2.0 Flash...`);

        // Sanitize the prompt to avoid safety filters (e.g. "Luxury" or specific people-focused activities can trigger refusals)
        const safeActivity = keyActivity ? keyActivity.replace(/luxury|exclusive|private/yi, 'scenic') : 'local landmarks';
        const prompt = `Generate an image of a breathtaking, cinematic travel photography shot of ${destination}, capturing the essence of a ${theme || 'memorable'} trip. Focus on the beautiful scenery and atmosphere. High detail, photorealistic, wide angle, 4k quality. No text overlay.`;

        // 1. Generate Image using Gemini 2.5 Flash Image (generateContent)
        // Note: Gemini 2.5 Flash Image is specialized for image generation
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            config: {
                // responseMimeType: 'image/jpeg' 
            }
        });

        // 2. Extract Image Data
        // Gemini 2.0 Flash returns images as inlineData in parts within candidates
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            console.error("[ImageGen] No candidates returned.");
            return null;
        }

        const parts = candidates[0].content.parts;
        // Search for the part that contains inlineData (the image)
        const imagePart = parts?.find(part => part.inlineData);

        if (!imagePart) {
            console.error("[ImageGen] No image generated. Model might have returned text refusal:", parts?.[0]?.text);
            return null;
        }

        const base64Data = imagePart.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');

        // 3. Upload to Supabase Storage
        const fileName = `${itineraryId}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('itinerary-images')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error("[ImageGen] Storage upload failed:", uploadError);
            return null;
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('itinerary-images')
            .getPublicUrl(fileName);

        console.log(`[ImageGen] Image generated and saved: ${publicUrl}`);

        // 5. Update Itinerary Record with new Image URL
        const { data: currentRecord, error: fetchError } = await supabaseAdmin
            .from('itineraries')
            .select('metadata')
            .eq('id', itineraryId)
            .single();

        if (fetchError || !currentRecord) {
            console.error("[ImageGen] Could not fetch itinerary to update metadata:", fetchError);
            return publicUrl;
        }

        const newMetadata = {
            ...currentRecord.metadata,
            image: publicUrl
        };

        const { error: saveError } = await supabaseAdmin
            .from('itineraries')
            .update({ metadata: newMetadata })
            .eq('id', itineraryId);

        if (saveError) {
            console.error("[ImageGen] Failed to update itinerary metadata:", saveError);
        } else {
            console.log("[ImageGen] Itinerary metadata updated with new image.");
        }

        return publicUrl;

    } catch (error) {
        console.error("[ImageGen] Fatal error:", error);
        return null;
    }
};

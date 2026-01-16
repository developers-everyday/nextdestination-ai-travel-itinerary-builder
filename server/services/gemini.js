import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in server environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const MODEL_NAME = "text-embedding-004";

export const generateEmbedding = async (text) => {
    try {
        const response = await ai.models.embedContent({
            model: MODEL_NAME,
            contents: text,
        });
        // Adjust based on actual response structure, verifying usually response.embeddings[0].values or similar
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error; // Re-throw to handle it in the caller
    }
};

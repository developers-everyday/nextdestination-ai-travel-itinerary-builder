import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in server environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateEmbedding = async (text) => {
    try {
        const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: text,
        });
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

export const generateQuickItinerary = async (destination, days = 3, selectedInterests = []) => {
    try {
        const model = "gemini-2.0-flash-exp";
        const prompt = `
        Create a detailed ${days}-day luxury travel itinerary for ${destination}. 
        The user is interested in: ${selectedInterests.length > 0 ? selectedInterests.join(", ") : "general highlights"}.
        Ensure these specific interests/attractions are included in the itinerary where appropriate.
        Return the response in JSON format. 
        For each day, provide a theme and 3-4 key activities (Morning, Afternoon, Evening).
        For each activity, you MUST provide the [longitude, latitude] coordinates in the 'coordinates' field.
      `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        destination: { type: "STRING" },
                        days: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    day: { type: "INTEGER" },
                                    theme: { type: "STRING" },
                                    activities: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                time: { type: "STRING" },
                                                activity: { type: "STRING" },
                                                location: { type: "STRING" },
                                                description: { type: "STRING" },
                                                coordinates: {
                                                    type: "ARRAY",
                                                    items: { type: "NUMBER" }
                                                },
                                                type: { type: "STRING", enum: ["activity", "flight", "hotel"] }
                                            },
                                            required: ["time", "activity", "location", "description", "coordinates"]
                                        }
                                    }
                                },
                                required: ["day", "theme", "activities"]
                            }
                        }
                    },
                    required: ["destination", "days"]
                }
            }
        });


        console.log("Raw Gemini Response Keys:", Object.keys(response));
        let textResponse;
        if (typeof response.text === 'function') {
            textResponse = response.text();
        } else if (typeof response.text === 'string') {
            textResponse = response.text;
        } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            textResponse = response.candidates[0].content.parts[0].text;
        } else {
            console.log("Full Response Object:", JSON.stringify(response, null, 2));
            throw new Error("Could not extract text from Gemini response");
        }

        // Remove markdown code blocks if present
        const cleanedText = textResponse.replace(/```json\n|\n```/g, '').trim();
        const data = JSON.parse(cleanedText);


        // Inject IDs
        if (data.days) {
            data.days.forEach((day) => {
                if (day.activities) {
                    day.activities.forEach((activity) => {
                        activity.id = Math.random().toString(36).substr(2, 9);
                    });
                }
            });
        }

        console.log("Generated Itinerary Data (Sample):", JSON.stringify(data.days?.[0], null, 2));
        if (data.days?.[0]?.activities?.[0]?.coordinates) {
            console.log("First Activity Coords:", data.days[0].activities[0].coordinates);
        }

        return data;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};

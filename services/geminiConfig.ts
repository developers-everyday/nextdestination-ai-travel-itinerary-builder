import { Type, Schema } from "@google/genai";

export const GEMINI_CONFIG = {
    models: {
        standard: "gemini-3-flash-preview",
        embedding: "gemini-embedding-001",
    },
    endpoints: {
        generateItinerary: {
            model: "gemini-3-flash-preview",
            buildPrompt: (destination: string, days: number, selectedInterests: string[] = []) => `
        Create a detailed ${days}-day luxury travel itinerary for ${destination}. 
        The user is interested in: ${selectedInterests.length > 0 ? selectedInterests.join(", ") : "general highlights"}.
        Ensure these specific interests/attractions are included in the itinerary where appropriate.
        Return the response in JSON format. 
        For each day, provide a theme and 3-4 key activities (Morning, Afternoon, Evening).
        For each activity, you MUST provide the [longitude, latitude] coordinates in the 'coordinates' field.
      `,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        destination: { type: Type.STRING },
                        days: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.INTEGER },
                                    theme: { type: Type.STRING },
                                    activities: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                time: { type: Type.STRING },
                                                activity: { type: Type.STRING },
                                                location: { type: Type.STRING },
                                                description: { type: Type.STRING },
                                                coordinates: {
                                                    type: Type.ARRAY,
                                                    items: { type: Type.NUMBER }
                                                },
                                                type: { type: Type.STRING, enum: ["activity", "flight", "hotel"] }
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
                } as Schema
            }
        },
        getAttractions: {
            model: "gemini-3-flash-preview",
            buildPrompt: (destination: string) => `
        List 10 top specific tourist attractions, famous places, or must-do activities in ${destination}.
        Return ONLY a raw JSON array of strings. Do not include markdown formatting or backticks.
        Example: ["Eiffel Tower", "Louvre Museum", "Seine Cruise"]
      `,
        }
    }
};

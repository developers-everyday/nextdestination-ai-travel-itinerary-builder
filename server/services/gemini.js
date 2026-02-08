import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { getPlaceCoordinates } from './googleMaps.js';
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
            model: "gemini-embedding-001",
            contents: text,
            config: {
                outputDimensionality: 768
            }
        });
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

export const generateQuickItinerary = async (destination, days = 3, selectedInterests = []) => {
    try {
        const model = "gemini-3-flash-preview";
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

        // Enrich with real coordinates
        console.log("Fetching accurate coordinates from Google Places...");
        try {
            const coordinatePromises = [];
            const activitiesToUpdate = [];

            if (data.days) {
                data.days.forEach(day => {
                    if (day.activities) {
                        day.activities.forEach(activity => {
                            if (activity.activity && activity.location) {
                                activitiesToUpdate.push(activity);
                                coordinatePromises.push(
                                    getPlaceCoordinates(activity.activity, destination)
                                );
                            } else if (activity.activity) {
                                // Fallback: try using just the activity name + destination
                                activitiesToUpdate.push(activity);
                                coordinatePromises.push(
                                    getPlaceCoordinates(activity.activity, destination)
                                );
                            }
                        });
                    }
                });
            }

            const results = await Promise.all(coordinatePromises);

            results.forEach((coords, index) => {
                if (coords) {
                    // Update if we found real coordinates
                    // Google Maps returns {lat, lng}, Gemini format is [lng, lat] (GeoJSON like) or [lat, lng]?
                    // Looking at the prompt: "MUST provide the [longitude, latitude] coordinates"
                    // Wait, usually it is [lon, lat] for GeoJSON/Mapbox, but Google Maps uses {lat, lng}.
                    // Let's verify what the frontend expects.
                    // The prompt asked for [longitude, latitude].

                    // Let's stick to what the prompt asked for: [lng, lat]
                    activitiesToUpdate[index].coordinates = [coords.lng, coords.lat];
                }
            });
            console.log("Finished updating coordinates.");

        } catch (coordError) {
            console.error("Error fetching coordinates (proceeding with Gemini estimates):", coordError);
        }

        return data;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};

export const searchActivitiesWithGemini = async (query, destination) => {
    try {
        const model = "gemini-3-flash-preview";
        const prompt = `
        The user is searching for: "${query}" in "${destination || 'anywhere'}".
        Provide a list of 5-8 specific activities/places that match this search.
        Return the response in JSON format.
        Each item should have:
        - name (string)
        - description (string, short)
        - location (string)
        - coordinates (array [lng, lat], optional but preferred if known)
        - price (string, estimate)
        - rating (number, 1-5 estimate)
        - type (string: "activity", "meal", "landmark")
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            description: { type: "STRING" },
                            location: { type: "STRING" },
                            coordinates: { type: "ARRAY", items: { type: "NUMBER" } },
                            price: { type: "STRING" },
                            rating: { type: "NUMBER" },
                            type: { type: "STRING" }
                        },
                        required: ["name", "description", "location", "type"]
                    }
                }
            }
        });

        let textResponse;
        if (typeof response.text === 'function') {
            textResponse = response.text();
        } else if (typeof response.text === 'string') {
            textResponse = response.text;
        } else {
            textResponse = response.candidates[0].content.parts[0].text;
        }

        const cleanedText = textResponse.replace(/```json\n|\n```/g, '').trim();
        const data = JSON.parse(cleanedText);

        return data;

    } catch (error) {
        console.error("Gemini Search Error:", error);
        return [];
    }
};

export const generateTransportOptions = async (destination, dayActivities, userLocation) => {
    try {
        const model = "gemini-3-flash-preview";
        const prompt = `
        Provide a list of transport options for traveling to/around ${destination}.
        User location (optional context): ${userLocation || 'International Arrival'}.
        Activities planned: ${JSON.stringify(dayActivities)}.
        
        Return JSON with key 'options' containing an array of transport modes.
        Each mode should have:
        - mode (string, e.g., "Flight", "Train", "Bus", "Taxi", "Rental Car")
        - description (string, brief)
        - estimatedCost (string, e.g., "$50 - $100")
        - estimatedTime (string, e.g., "2h 30m")
        - bestFor (string, e.g., "Budget", "Speed", "Comfort")
        - pros (array of strings)
        - cons (array of strings)
        - bookingLink (string, optional URL or "Check Local")
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        options: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    mode: { type: "STRING" },
                                    description: { type: "STRING" },
                                    estimatedCost: { type: "STRING" },
                                    estimatedTime: { type: "STRING" },
                                    bestFor: { type: "STRING" },
                                    pros: { type: "ARRAY", items: { type: "STRING" } },
                                    cons: { type: "ARRAY", items: { type: "STRING" } },
                                    bookingLink: { type: "STRING" }
                                },
                                required: ["mode", "description", "estimatedCost", "estimatedTime", "pros", "cons"]
                            }
                        }
                    }
                }
            }
        });

        const textResponse = response.candidates[0].content.parts[0].text;
        return JSON.parse(textResponse);
    } catch (error) {
        console.error("Gemini Transport Options Error:", error);
        return { options: [] };
    }
};

export const generateGeneralInfo = async (destination) => {
    try {
        const model = "gemini-3-flash-preview";
        const prompt = `
        Provide general travel information for ${destination}.
        Include:
        - Weather (current/typical for now)
        - Currency (Symbol, Code, Cost Level)
        - Language (Official, English level)
        - Visa (Summary for general international tourists)
        - Scam Alert (Common scams to avoid)
        - Considerations (Cultural norms, safety, etc.)
        - Packing (Essentials to pack)
        
        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        weather: {
                            type: "OBJECT",
                            properties: {
                                tempRange: { type: "STRING" },
                                condition: { type: "STRING" }
                            }
                        },
                        currency: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING" },
                                symbol: { type: "STRING" },
                                costLevel: { type: "STRING" }
                            }
                        },
                        language: {
                            type: "OBJECT",
                            properties: {
                                official: { type: "STRING" },
                                englishPrevalence: { type: "STRING" }
                            }
                        },
                        visa: {
                            type: "OBJECT",
                            properties: {
                                summary: { type: "STRING" }
                            }
                        },
                        scams: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING" },
                                    description: { type: "STRING" }
                                }
                            }
                        },
                        considerations: { type: "ARRAY", items: { type: "STRING" } },
                        packing: { type: "ARRAY", items: { type: "STRING" } }
                    }
                }
            }
        });

        const textResponse = response.candidates[0].content.parts[0].text;
        return JSON.parse(textResponse);
    } catch (error) {
        console.error("Gemini General Info Error:", error);
        return {};
    }
};

export const estimateFlightDuration = async (from, to) => {
    try {
        const model = "gemini-3-flash-preview";
        const prompt = `Estimate the flight duration from ${from} to ${to}. Return ONLY the duration string (e.g., "2h 15m").`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });

        return response.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Gemini Flight Estimate Error:", error);
        return "N/A";
    }
};

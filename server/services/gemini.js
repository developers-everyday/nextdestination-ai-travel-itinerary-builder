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

// ── Circuit Breaker ─────────────────────────────────────────────────────────
// Tracks consecutive Gemini failures and opens the circuit after FAILURE_THRESHOLD.
// While OPEN, calls fail immediately with a user-friendly message instead of
// queueing up more hanging requests. After COOLDOWN_MS the circuit enters
// HALF_OPEN and allows one test request through; success closes it, failure
// reopens it.
//
// States: CLOSED (normal) → OPEN (failing fast) → HALF_OPEN (testing) → CLOSED
const circuit = {
    state: 'CLOSED',
    failures: 0,
    openedAt: null,
    FAILURE_THRESHOLD: 5,
    COOLDOWN_MS: 60_000,  // 60 seconds
};

const callWithCircuitBreaker = async (fn, label) => {
    if (circuit.state === 'OPEN') {
        const elapsed = Date.now() - circuit.openedAt;
        if (elapsed < circuit.COOLDOWN_MS) {
            const secsLeft = Math.ceil((circuit.COOLDOWN_MS - elapsed) / 1000);
            throw new Error(`AI service temporarily unavailable. Please try again in ${secsLeft}s.`);
        }
        // Cooldown passed — let one request through as a health check
        circuit.state = 'HALF_OPEN';
        console.log(`[Gemini] Circuit HALF_OPEN — testing recovery with "${label}".`);
    }

    try {
        const result = await fn();
        // Success: reset the circuit
        if (circuit.failures > 0 || circuit.state === 'HALF_OPEN') {
            console.log('[Gemini] Circuit CLOSED — service recovered.');
        }
        circuit.failures = 0;
        circuit.state = 'CLOSED';
        return result;
    } catch (err) {
        circuit.failures++;
        if (circuit.failures >= circuit.FAILURE_THRESHOLD && circuit.state !== 'OPEN') {
            circuit.state = 'OPEN';
            circuit.openedAt = Date.now();
            console.error(
                `[Gemini] Circuit OPENED after ${circuit.failures} consecutive failures. ` +
                `Cooling down for ${circuit.COOLDOWN_MS / 1000}s.`
            );
        }
        throw err;
    }
};

// ── Timeout Wrapper ─────────────────────────────────────────────────────────
// Races a promise against a deadline. If Gemini stalls (network hang, model
// overload) the caller gets a clear rejection instead of waiting forever.
const withTimeout = (promise, ms, label) => {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`[Gemini] ${label} timed out after ${ms}ms`)),
            ms
        );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export const generateEmbedding = async (text) => {
    try {
        const response = await withTimeout(
            ai.models.embedContent({
                model: "gemini-embedding-001",
                contents: text,
                config: { outputDimensionality: 768 }
            }),
            15_000, // embeddings are fast; 15s is generous
            'generateEmbedding'
        );
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

export const generateQuickItinerary = async (destination, days = 3, selectedInterests = []) => {
    return callWithCircuitBreaker(async () => {
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

        const response = await withTimeout(
          ai.models.generateContent({
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
          }),
          75_000, // itinerary generation can be slow; allow up to 75s
          'generateQuickItinerary'
        );

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
    }, 'generateQuickItinerary'); // circuit breaker
};

export const searchActivitiesWithGemini = async (query, destination) => {
    return callWithCircuitBreaker(async () => {
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

        const response = await withTimeout(
            ai.models.generateContent({
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
            }),
            30_000,
            'searchActivitiesWithGemini'
        );

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
    }, 'searchActivitiesWithGemini'); // circuit breaker
};

export const generateTransportOptions = async (destination, dayActivities, userLocation) => {
    return callWithCircuitBreaker(async () => {
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

        const response = await withTimeout(
            ai.models.generateContent({
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
            }),
            30_000,
            'generateTransportOptions'
        );

        const textResponse = response.candidates[0].content.parts[0].text;
        return JSON.parse(textResponse);
    } catch (error) {
        console.error("Gemini Transport Options Error:", error);
        return { options: [] };
    }
    }, 'generateTransportOptions'); // circuit breaker
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

export const generateAttractions = async (destination) => {
    try {
        const model = "gemini-3-flash-preview";
        const prompt = `List 10 top specific tourist attractions, famous places, or must-do activities in ${destination}.
Return ONLY a raw JSON array of strings. Do not include markdown formatting or backticks.
Example: ["Eiffel Tower", "Louvre Museum", "Seine Cruise"]`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });

        let textResponse;
        if (typeof response.text === 'string') {
            textResponse = response.text;
        } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
            textResponse = response.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Could not extract text from Gemini response");
        }

        const cleaned = textResponse.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Gemini Attractions Error:", error);
        return [
            `Explore ${destination} Center`,
            "Local Food Tour",
            "Historical Museums",
            "City Park Walk",
            "Shopping District",
            "Iconic Landmarks"
        ];
    }
};

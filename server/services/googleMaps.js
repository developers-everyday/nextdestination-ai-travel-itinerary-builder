import pLimit from 'p-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Fallback to server-specific env if needed, but .env.local is primary
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    console.warn("WARNING: VITE_GOOGLE_MAPS_API_KEY is missing. Coordinate fetching will fail.");
}

// Concurrency limit: 5 concurrent requests
const limit = pLimit(5);

// In-memory cache: "Place Name|Location Context" -> { lat, lng }
const placeCache = new Map();

/**
 * Fetches coordinates for a place using Google Places Text Search API.
 * Uses caching and concurrency limiting.
 * 
 * @param {string} placeName - Name of the activity/place (e.g., "Eiffel Tower")
 * @param {string} locationContext - General location (e.g., "Paris")
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const getPlaceCoordinates = async (placeName, locationContext) => {
    if (!placeName) return null;

    // normalizing key
    const query = `${placeName} in ${locationContext || ''}`.trim();
    const cacheKey = query.toLowerCase();

    // Check for existing promise or result
    if (placeCache.has(cacheKey)) {
        console.log(`[Cache Hit] ${query}`);
        return placeCache.get(cacheKey);
    }

    const promise = limit(async () => {
        try {
            console.log(`[API Fetch] ${query}`);
            const url = 'https://places.googleapis.com/v1/places:searchText';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'places.location'
                },
                body: JSON.stringify({
                    textQuery: query,
                    maxResultCount: 1
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Google Places API Error (${response.status}): ${errorText}`);
                return null;
            }

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                const location = data.places[0].location;
                const coords = { lat: location.latitude, lng: location.longitude };
                return coords;
            } else {
                console.log(`No results found for: ${query}`);
                return null;
            }

        } catch (error) {
            console.error(`Failed to fetch coordinates for ${query}:`, error);
            return null;
        }
    });

    placeCache.set(cacheKey, promise);
    return promise;
};

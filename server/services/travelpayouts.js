/**
 * Travelpayouts Affiliate Service
 * 
 * Provides flight search via the Travelpayouts/Aviasales API
 * and affiliate link generation for flights, hotels, and activities.
 * 
 * When TRAVELPAYOUTS_TOKEN is not set, all methods gracefully degrade
 * (return empty results or generate non-affiliate links).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config(); // fallback to server/.env or CWD/.env

const TRAVELPAYOUTS_BASE = 'https://api.travelpayouts.com';
const AVIASALES_SEARCH_BASE = 'https://api.travelpayouts.com/aviasales/v3';


// ── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => process.env.TRAVELPAYOUTS_TOKEN || '';
const getMarker = () => process.env.TRAVELPAYOUTS_MARKER || '';
const isConfigured = () => !!getToken();

/**
 * Extract HH:MM time from an ISO 8601 datetime string.
 * Works reliably regardless of server locale/timezone.
 */
function extractTime(isoString) {
    if (!isoString) return '--:--';
    try {
        const date = new Date(isoString);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '--:--';
    }
}

/**
 * Compute arrival time by adding durationMinutes to a departure ISO string.
 * Returns HH:MM format.
 */
function computeArrivalTime(departureIso, durationMinutes) {
    if (!departureIso || !durationMinutes) return '--:--';
    try {
        const dep = new Date(departureIso);
        const arrival = new Date(dep.getTime() + durationMinutes * 60 * 1000);
        const hours = arrival.getUTCHours().toString().padStart(2, '0');
        const minutes = arrival.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '--:--';
    }
}

/**
 * Format duration in minutes as "Xh Ym".
 */
function formatDuration(minutes) {
    if (!minutes) return 'N/A';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Search for flights using Travelpayouts Prices API
 * Uses the /prices/latest endpoint for lightweight, cached flight data.
 * 
 * @param {string} origin  — IATA code (e.g. "DEL")
 * @param {string} destination — IATA code (e.g. "DPS")
 * @param {string} departDate — YYYY-MM-DD
 * @param {string} [returnDate] — YYYY-MM-DD (optional for one-way)
 * @returns {Promise<{results: object[], affiliateSearchUrl: string}>}
 */
export async function searchFlights(origin, destination, departDate, returnDate) {
    if (!isConfigured()) {
        console.warn('[Travelpayouts] Not configured — returning empty results');
        return { results: [], affiliateSearchUrl: '', configured: false };
    }

    try {
        // Use the prices/latest endpoint — fast, cached, good for displaying options
        const params = new URLSearchParams({
            currency: 'INR',
            origin,
            destination,
            beginning_of_period: departDate,
            period_type: 'day',
            one_way: returnDate ? 'false' : 'true',
            sorting: 'price',
            limit: '10',
            token: getToken()
        });

        const response = await fetch(`${AVIASALES_SEARCH_BASE}/prices_for_dates?${params}`);

        if (!response.ok) {
            console.error(`[Travelpayouts] API error: ${response.status} ${response.statusText}`);
            return { results: [], affiliateSearchUrl: getFlightSearchUrl(origin, destination, departDate, returnDate), configured: true };
        }

        const data = await response.json();

        if (!data.success || !data.data) {
            console.warn('[Travelpayouts] No flight data returned');
            return { results: [], affiliateSearchUrl: getFlightSearchUrl(origin, destination, departDate, returnDate), configured: true };
        }

        // Debug: log first raw result to help diagnose field issues
        if (data.data.length > 0) {
            console.log('[Travelpayouts] Sample raw flight data:', JSON.stringify(data.data[0], null, 2));
        }

        // Transform to our standard format
        // Note: API fields:
        //   departure_at — ISO 8601 outbound departure datetime
        //   return_at   — ISO 8601 return trip departure datetime (NOT outbound arrival)
        //   duration_to — outbound flight duration in minutes (preferred)
        //   duration    — may be total/outbound duration in minutes (fallback)
        //   price       — numeric price in requested currency
        const results = data.data.map((flight, index) => {
            const outboundDuration = flight.duration_to || flight.duration;
            return {
                id: `tp-${index}`,
                airline: flight.airline || 'Unknown',
                flightNumber: flight.flight_number ? `${flight.airline}${flight.flight_number}` : `Flight ${index + 1}`,
                departure: extractTime(flight.departure_at),
                arrival: computeArrivalTime(flight.departure_at, outboundDuration),
                departureDate: flight.departure_at ? flight.departure_at.split('T')[0] : departDate,
                returnDate: flight.return_at ? flight.return_at.split('T')[0] : returnDate,
                duration: formatDuration(outboundDuration),
                durationMinutes: outboundDuration || null,
                price: flight.price ? `₹${flight.price.toLocaleString('en-IN')}` : 'Check Online',
                priceRaw: flight.price || null,
                transfers: flight.transfers ?? 0,
                origin: flight.origin || origin,
                destination: flight.destination || destination,
                type: 'flight',
                affiliateLink: getFlightDeepLink(origin, destination, departDate, returnDate),
                source: 'travelpayouts'
            };
        });

        return {
            results,
            affiliateSearchUrl: getFlightSearchUrl(origin, destination, departDate, returnDate),
            configured: true
        };
    } catch (error) {
        console.error('[Travelpayouts] Flight search error:', error);
        return { results: [], affiliateSearchUrl: getFlightSearchUrl(origin, destination, departDate, returnDate), configured: true };
    }
}

/**
 * Look up IATA codes for a city name using the Travelpayouts autocomplete API
 * @param {string} query — city or airport name
 * @returns {Promise<Array<{code: string, name: string, country: string}>>}
 */
export async function lookupIataCode(query) {
    if (!query || query.length < 2) return [];

    try {
        const params = new URLSearchParams({
            term: query,
            locale: 'en',
            types: 'city,airport'
        });

        const response = await fetch(`https://autocomplete.travelpayouts.com/places2?${params}`);
        if (!response.ok) return [];

        const data = await response.json();

        // Combine city and airport results, prioritize cities
        const cities = (data || [])
            .filter(item => item.code)
            .slice(0, 6)
            .map(item => ({
                code: item.code,
                name: item.name || query,
                country: item.country_name || '',
                type: item.type || 'city'
            }));

        return cities;
    } catch (error) {
        console.error('[Travelpayouts] IATA lookup error:', error);
        return [];
    }
}

// ── Affiliate Link Generators ────────────────────────────────────────────────

/**
 * Generate a deep link to Aviasales flight search
 */
function getFlightDeepLink(origin, destination, departDate, returnDate) {
    const marker = getMarker();
    const dateFormatted = departDate ? departDate.replace(/-/g, '') : '';
    const returnFormatted = returnDate ? returnDate.replace(/-/g, '') : '';

    // Aviasales deep link format
    const route = returnFormatted
        ? `${origin}${dateFormatted}${destination}${returnFormatted}1`
        : `${origin}${dateFormatted}${destination}1`;

    return `https://www.aviasales.com/search/${route}?marker=${marker}`;
}

/**
 * Generate Aviasales search results URL
 */
function getFlightSearchUrl(origin, destination, departDate, returnDate) {
    return getFlightDeepLink(origin, destination, departDate, returnDate);
}

/**
 * Generate a Booking.com affiliate search link for a hotel/destination
 * @param {string} destination — city name
 * @param {string} [checkIn] — YYYY-MM-DD
 * @param {string} [checkOut] — YYYY-MM-DD
 */
export function getHotelAffiliateLink(destination, checkIn, checkOut) {
    const marker = getMarker();
    const params = new URLSearchParams({
        ss: destination,
        ...(checkIn && { checkin: checkIn }),
        ...(checkOut && { checkout: checkOut }),
        ...(marker && { aid: marker })
    });

    return `https://www.booking.com/searchresults.html?${params}`;
}

/**
 * Generate a hotel-specific Booking.com affiliate link
 * @param {string} hotelName
 * @param {string} destination
 */
export function getHotelBookingLink(hotelName, destination) {
    const marker = getMarker();
    const params = new URLSearchParams({
        ss: `${hotelName}, ${destination}`,
        ...(marker && { aid: marker })
    });

    return `https://www.booking.com/searchresults.html?${params}`;
}

/**
 * Generate a GetYourGuide affiliate search link for activities
 * @param {string} activityName
 * @param {string} destination
 */
export function getActivityAffiliateLink(activityName, destination) {
    const marker = getMarker();
    const query = `${activityName} ${destination}`;
    const params = new URLSearchParams({
        q: query,
        ...(marker && { partner_id: marker })
    });

    return `https://www.getyourguide.com/s/?${params}`;
}

export default {
    searchFlights,
    lookupIataCode,
    getHotelAffiliateLink,
    getHotelBookingLink,
    getActivityAffiliateLink,
    isConfigured
};

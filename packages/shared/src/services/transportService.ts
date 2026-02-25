import { getApiUrl } from './apiConfig';

const API_HOST = getApiUrl();
const API_BASE_URL = `${API_HOST}/api/transport`;

export const getTransportOptions = async (destination: string, dayActivities: any[], userLocation?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination, dayActivities, userLocation })
        });
        if (!response.ok) throw new Error('Failed to fetch transport options');
        return await response.json();
    } catch (error) {
        console.error("Error fetching transport options:", error);
        throw error;
    }
};

export const getGeneralInfo = async (destination: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/general-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination })
        });
        if (!response.ok) throw new Error('Failed to fetch general info');
        return await response.json();
    } catch (error) {
        console.error("Error fetching general info:", error);
        throw error;
    }
};

export const getFlightEstimates = async (from: string, to: string, date: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/flight-estimates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, date })
        });
        if (!response.ok) throw new Error('Failed to fetch flight estimates');
        return await response.json();
    } catch (error) {
        console.error("Error fetching flight estimates:", error);
        throw error;
    }
};

// ── Travelpayouts-powered endpoints ─────────────────────────────────────────

export const searchFlightsTP = async (origin: string, destination: string, departDate?: string, returnDate?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/flights/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin, destination, departDate, returnDate })
        });
        if (!response.ok) throw new Error('Failed to search flights');
        return await response.json();
    } catch (error) {
        console.error("Error searching flights:", error);
        throw error;
    }
};

export const lookupIataCode = async (query: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/flights/iata-lookup?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to lookup IATA code');
        return await response.json();
    } catch (error) {
        console.error("Error looking up IATA code:", error);
        throw error;
    }
};

export const getAffiliateLinks = async (destination: string, options?: { hotelName?: string; activityName?: string; checkIn?: string; checkOut?: string }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/affiliate-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination, ...options })
        });
        if (!response.ok) throw new Error('Failed to get affiliate links');
        return await response.json();
    } catch (error) {
        console.error("Error getting affiliate links:", error);
        throw error;
    }
};


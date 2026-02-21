// All AI calls are proxied through the Express backend.
// The Gemini API key lives ONLY in server environment variables (GEMINI_API_KEY)
// and is never shipped to the browser.

import { supabase } from './supabaseClient';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

// ── analyzeTravelQuery ───────────────────────────────────────────────────────
// Parses a free-text user query into structured intent.
// Public — no auth required (used in home page chat widget before login).
export const analyzeTravelQuery = async (query: string) => {
    try {
        const response = await fetch(`${API_URL}/api/suggestions/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Analyze request failed: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('analyzeTravelQuery error:', error);
        return {
            destination: null,
            days: null,
            interests: [],
            intent: 'continue_chat',
            response: "I'm having trouble connecting to the travel servers. Please try again!"
        };
    }
};

// ── generateQuickItinerary ───────────────────────────────────────────────────
// Generates a full itinerary via the backend (cache-first → vector → Gemini AI).
// Auth required — retrieves the current Supabase session automatically.
export const generateQuickItinerary = async (
    destination: string,
    days: number = 3,
    selectedInterests: string[] = []
) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ destination, days, interests: selectedInterests }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Failed to generate itinerary' }));
        throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.data;
};

// ── getDestinationAttractions ────────────────────────────────────────────────
// Returns top attractions for a destination (DB-cached on the server, AI fallback).
// Public — no auth required.
export const getDestinationAttractions = async (destination: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_URL}/api/transport/attractions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination }),
        });

        if (!response.ok) {
            throw new Error(`Attractions request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.attractions || [];
    } catch (error) {
        console.error('getDestinationAttractions error:', error);
        return [
            `Explore ${destination} Center`,
            'Local Food Tour',
            'Historical Museums',
            'City Park Walk',
            'Shopping District',
            'Iconic Landmarks',
        ];
    }
};

// ── searchFlights ────────────────────────────────────────────────────────────
// Returns estimated flight slots between two cities.
// Public — no auth required.
export const searchFlights = async (origin: string, destination: string, date: string) => {
    try {
        const response = await fetch(`${API_URL}/api/transport/flight-estimates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: origin, to: destination, date }),
        });

        if (!response.ok) {
            throw new Error(`Flight estimates request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('searchFlights error:', error);
        return [];
    }
};

// ── getDemoItinerary ─────────────────────────────────────────────────────────
// Returns static demo data — no API call.
export const getDemoItinerary = () => {
    return {
        destination: "Paris, France",
        days: [
            {
                day: 1,
                theme: "Arrival & Romance",
                hasHotel: true,
                activities: [
                    { id: 'a1', time: "10:00 AM", activity: "Check-in at Ritz Paris", location: "Place Vendôme", description: "Settle into your suite overlooking the square.", type: "hotel" },
                    { id: 'a2', time: "02:00 PM", activity: "Eiffel Tower Ascent", location: "Champ de Mars", description: "Skip-the-line access to the summit for panoramic views.", type: "activity" },
                    { id: 'a3', time: "07:00 PM", activity: "Seine Dinner Cruise", location: "Port de la Bourdonnais", description: "3-course gourmet dinner while gliding past illuminated monuments.", type: "activity" }
                ]
            },
            {
                day: 2,
                theme: "Art & History",
                hasHotel: true,
                activities: [
                    { id: 'b1', time: "09:00 AM", activity: "Louvre Museum Private Tour", location: "Rue de Rivoli", description: "Expert-led tour focusing on the masterpieces.", type: "activity" },
                    { id: 'b2', time: "01:00 PM", activity: "Lunch at Le Train Bleu", location: "Gare de Lyon", description: "Iconic Belle Époque restaurant.", type: "activity" },
                    { id: 'b3', time: "03:00 PM", activity: "Montmartre Walking Tour", location: "Montmartre", description: "Explore the artistic history and Sacré-Cœur.", type: "activity" }
                ]
            },
            {
                day: 3,
                theme: "Fashion & Departure",
                hasHotel: true,
                activities: [
                    { id: 'c1', time: "10:00 AM", activity: "Shopping at Galeries Lafayette", location: "Haussmann", description: "Personal shopper experience.", type: "activity" },
                    { id: 'c2', time: "01:00 PM", activity: "Lunch at L'Avenue", location: "Avenue Montaigne", description: "Chic dining spot for fashion week spotting.", type: "activity" }
                ]
            }
        ],
        hasArrivalFlight: true,
        hasDepartureFlight: true
    };
};

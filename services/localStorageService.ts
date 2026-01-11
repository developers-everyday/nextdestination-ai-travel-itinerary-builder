import { Itinerary } from '../types';

export interface SavedItinerary extends Itinerary {
    id: string;
    name: string; // User-friendly name, defaults to "Trip to {destination}"
    createdAt: number;
    updatedAt: number;
    synced: boolean;
}

const STORAGE_KEY = 'saved_itineraries';

export const saveItinerary = (itinerary: Itinerary, name?: string): SavedItinerary => {
    const savedItineraries = getSavedItineraries();

    // Check if it already has an ID (update existing)
    // For now, our base Itinerary doesn't have an ID, so we might need to cast or check if we are passing a SavedItinerary
    let id = (itinerary as any).id;
    const now = Date.now();

    let newEntry: SavedItinerary;

    if (id) {
        const existingIndex = savedItineraries.findIndex(i => i.id === id);
        if (existingIndex >= 0) {
            newEntry = {
                ...savedItineraries[existingIndex],
                ...itinerary,
                name: name || savedItineraries[existingIndex].name,
                updatedAt: now,
                synced: false
            };
            savedItineraries[existingIndex] = newEntry;
        } else {
            // ID exists but not found locally (maybe from suggested?) - treat as new or recover
            // prioritizing treating as new save for now if we can't find it
            newEntry = {
                ...itinerary,
                id: id,
                name: name || `Trip to ${itinerary.destination}`,
                createdAt: now,
                updatedAt: now,
                synced: false
            };
            savedItineraries.push(newEntry);
        }
    } else {
        // New Save
        id = crypto.randomUUID();
        newEntry = {
            ...itinerary,
            id,
            name: name || `Trip to ${itinerary.destination}`,
            createdAt: now,
            updatedAt: now,
            synced: false
        };
        savedItineraries.push(newEntry);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItineraries));
    return newEntry;
};

export const getSavedItineraries = (): SavedItinerary[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse saved itineraries", e);
        return [];
    }
};

export const getSavedItinerary = (id: string): SavedItinerary | null => {
    const saved = getSavedItineraries();
    return saved.find(i => i.id === id) || null;
};

export const deleteSavedItinerary = (id: string): void => {
    const saved = getSavedItineraries();
    const filtered = saved.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

import { Itinerary } from '../types';
import { getStorageAdapter } from './storageAdapter';

export interface SavedItinerary extends Itinerary {
    id: string;
    name: string; // User-friendly name, defaults to "Trip to {destination}"
    createdAt: number;
    updatedAt: number;
    synced: boolean;
}

const STORAGE_KEY = 'saved_itineraries';

// Helper to generate UUID (works in both browser and mobile)
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const saveItinerary = async (itinerary: Itinerary, name?: string): Promise<SavedItinerary> => {
    const savedItineraries = await getSavedItineraries();

    // Check if it already has an ID (update existing)
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
        id = generateUUID();
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

    const adapter = getStorageAdapter();
    await adapter.setItem(STORAGE_KEY, JSON.stringify(savedItineraries));
    return newEntry;
};

export const getSavedItineraries = async (): Promise<SavedItinerary[]> => {
    const adapter = getStorageAdapter();
    const stored = await adapter.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse saved itineraries", e);
        return [];
    }
};

export const getSavedItinerary = async (id: string): Promise<SavedItinerary | null> => {
    const saved = await getSavedItineraries();
    return saved.find(i => i.id === id) || null;
};

export const deleteSavedItinerary = async (id: string): Promise<void> => {
    const saved = await getSavedItineraries();
    const filtered = saved.filter(i => i.id !== id);
    const adapter = getStorageAdapter();
    await adapter.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Synchronous versions for backward compatibility with web
// These use a cached version and are updated in the background
let cachedItineraries: SavedItinerary[] | null = null;

export const saveItinerarySync = (itinerary: Itinerary, name?: string): SavedItinerary => {
    const savedItineraries = getSavedItinerariesSync();

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
        id = generateUUID();
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

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItineraries));
    }
    cachedItineraries = savedItineraries;
    return newEntry;
};

export const getSavedItinerariesSync = (): SavedItinerary[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        cachedItineraries = JSON.parse(stored);
        return cachedItineraries!;
    } catch (e) {
        console.error("Failed to parse saved itineraries", e);
        return [];
    }
};

export const getSavedItinerarySync = (id: string): SavedItinerary | null => {
    const saved = getSavedItinerariesSync();
    return saved.find(i => i.id === id) || null;
};

export const deleteSavedItinerarySync = (id: string): void => {
    const saved = getSavedItinerariesSync();
    const filtered = saved.filter(i => i.id !== id);
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    cachedItineraries = filtered;
};

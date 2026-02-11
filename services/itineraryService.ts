import { Itinerary } from '../types';

const API_BASE_URL = '/api/itineraries';

export const saveItineraryToBackend = async (itinerary: Itinerary, token?: string, isPublic?: boolean): Promise<string> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Determine isPublic if provided, else user default
    // We send it in the body
    const body = {
        ...itinerary,
        isPublic: isPublic
    };

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to save itinerary');
        } catch (e) {
            throw new Error(`Failed to save itinerary: ${response.status} ${response.statusText} - ${errorText}`);
        }
    }

    const data = await response.json();
    return data.id;
};

export const fetchItineraryFromBackend = async (id: string, token?: string): Promise<Itinerary & { isPublic?: boolean }> => {
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/${id}`, {
        headers
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Itinerary not found or private');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch itinerary');
    }

    return response.json();
};

export const fetchUserItineraries = async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/my-trips`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user itineraries');
    }

    return response.json();
};

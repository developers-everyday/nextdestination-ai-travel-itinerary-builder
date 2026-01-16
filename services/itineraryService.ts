import { Itinerary } from '../types';

const API_BASE_URL = '/api/itineraries';

export const saveItineraryToBackend = async (itinerary: Itinerary): Promise<string> => {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(itinerary),
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

export const fetchItineraryFromBackend = async (id: string): Promise<Itinerary> => {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Itinerary not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch itinerary');
    }

    return response.json();
};

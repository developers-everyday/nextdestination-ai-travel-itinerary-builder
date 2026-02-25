import { Itinerary } from '../types';
import { getApiUrl } from './apiConfig';

const API_BASE_URL = `${getApiUrl()}/api/itineraries`;

export const saveItineraryToBackend = async (itinerary: Itinerary, token?: string, isPublic?: boolean): Promise<string> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Determine isPublic if provided
    const body: any = {
        ...itinerary
    };

    if (typeof isPublic !== 'undefined') {
        body.isPublic = isPublic;
    }

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let message = `Failed to save itinerary: ${response.status} ${response.statusText}`;
        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) message = errorData.error;
        } catch {
            if (errorText) message += ` - ${errorText}`;
        }
        throw new Error(message);
    }

    const data = await response.json();
    return data.id;
};

export const updateItineraryPrivacy = async (id: string, isPublic: boolean, token: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/${id}/privacy`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update privacy');
    }

    const data = await response.json();
    return data.isPublic;
};

export const fetchItineraryFromBackend = async (id: string, token?: string): Promise<Itinerary & { isPublic?: boolean, userId?: string }> => {
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

// ── Influencer Growth Features ──────────────────────────────────────────────

export const submitTranscript = async (transcript: string, token: string): Promise<{ id: string; shareUrl: string; status: string }> => {
    const response = await fetch(`${API_BASE_URL}/async-from-transcript`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit transcript');
    }

    return response.json();
};

export const pollItineraryStatus = async (id: string): Promise<{ status: string; itinerary?: Itinerary }> => {
    const response = await fetch(`${API_BASE_URL}/status/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            return { status: 'not_found' };
        }
        throw new Error('Failed to poll status');
    }

    return response.json();
};

export const fetchCreatorItineraries = async (userId: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/by-user/${userId}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch creator itineraries');
    }

    return response.json();
};

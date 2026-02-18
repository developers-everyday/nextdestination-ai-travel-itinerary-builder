import { UserProfile } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile`;

export const fetchMyProfile = async (token: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch profile: ${response.status}`);
    }

    return response.json();
};

export const updateMyProfile = async (
    token: string,
    updates: { displayName?: string; bio?: string; avatarUrl?: string }
): Promise<Partial<UserProfile>> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
    }

    return response.json();
};

export const fetchPublicProfile = async (userId: string): Promise<Partial<UserProfile>> => {
    const response = await fetch(`${API_BASE_URL}/${userId}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Profile not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch profile');
    }

    return response.json();
};

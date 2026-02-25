import { CreatorCardData, CreatorInterest } from '../types';
import { getApiUrl } from './apiConfig';

const API_BASE_URL = `${getApiUrl()}/api`;

export const fetchCreators = async (
    params?: { interest?: CreatorInterest; search?: string; page?: number },
    token?: string
): Promise<{ creators: CreatorCardData[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.interest) query.set('interest', params.interest);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/creators?${query}`, { headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch creators');
    }

    return response.json();
};

export const fetchFeaturedCreators = async (): Promise<CreatorCardData[]> => {
    const response = await fetch(`${API_BASE_URL}/creators/featured`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch featured creators');
    }

    return response.json();
};

export const toggleFollow = async (
    token: string,
    targetUserId: string
): Promise<{ isFollowing: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/follows/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to toggle follow');
    }

    return response.json();
};

export const checkFollowing = async (
    token: string,
    userId: string
): Promise<{ isFollowing: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/follows/check/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to check follow status');
    }

    return response.json();
};

export const fetchFollowing = async (
    token: string
): Promise<CreatorCardData[]> => {
    const response = await fetch(`${API_BASE_URL}/follows/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch following list');
    }

    return response.json();
};

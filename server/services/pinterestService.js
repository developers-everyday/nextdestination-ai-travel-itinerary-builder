/**
 * Pinterest API v5 Service
 * Handles authentication (token refresh) and pin/board management.
 */

const PINTEREST_API = 'https://api.pinterest.com/v5';

// ─── Token Management ──────────────────────────────────────────────────────────

let _accessToken = null;
let _tokenExpiresAt = 0; // Unix ms

function getEnvVars() {
    return {
        appId: process.env.PINTEREST_APP_ID,
        appSecret: process.env.PINTEREST_APP_SECRET,
        refreshToken: process.env.PINTEREST_REFRESH_TOKEN,
    };
}

export function isConfigured() {
    const { appId, appSecret, refreshToken } = getEnvVars();
    return !!(appId && appSecret && refreshToken);
}

async function ensureAccessToken() {
    // Refresh at 85% lifetime (~25.5 days for a 30-day token)
    const now = Date.now();
    if (_accessToken && now < _tokenExpiresAt * 0.85) {
        return _accessToken;
    }

    const { appId, appSecret, refreshToken } = getEnvVars();
    if (!appId || !appSecret || !refreshToken) {
        throw new Error('Pinterest API credentials not configured');
    }

    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');

    const res = await fetch(`${PINTEREST_API}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pinterest token refresh failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    _accessToken = data.access_token;
    // expires_in is in seconds
    _tokenExpiresAt = now + (data.expires_in || 2592000) * 1000;

    return _accessToken;
}

// ─── API Wrapper ────────────────────────────────────────────────────────────────

async function pinterestFetch(path, options = {}) {
    const token = await ensureAccessToken();
    const url = `${PINTEREST_API}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pinterest API ${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
    }

    // DELETE returns 204 No Content
    if (res.status === 204) return null;
    return res.json();
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * List all boards for the authenticated business account.
 * Returns: [{ id, name, description, pinCount, imageUrl }]
 */
export async function listBoards() {
    const data = await pinterestFetch('/boards?page_size=100');
    return (data.items || []).map(b => ({
        id: b.id,
        name: b.name,
        description: b.description || '',
        pinCount: b.pin_count || 0,
        imageUrl: b.media?.image_cover_url || null,
    }));
}

/**
 * Create a pin on a specific board.
 * @param {{ boardId: string, title: string, description: string, link: string, imageUrl: string }}
 * @returns {{ id: string, url: string }}
 */
export async function createPin({ boardId, title, description, link, imageUrl }) {
    const body = {
        board_id: boardId,
        title: title.slice(0, 100), // Pinterest title limit
        description: description.slice(0, 500), // Pinterest description limit
        link,
        media_source: {
            source_type: 'image_url',
            url: imageUrl,
        },
    };

    const data = await pinterestFetch('/pins', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return {
        id: data.id,
        url: `https://www.pinterest.com/pin/${data.id}/`,
    };
}

/**
 * Delete a pin from Pinterest.
 */
export async function deletePin(pinId) {
    await pinterestFetch(`/pins/${pinId}`, { method: 'DELETE' });
}

// ─── Frontend URL helper ────────────────────────────────────────────────────────

export function getFrontendUrl() {
    return process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';
}

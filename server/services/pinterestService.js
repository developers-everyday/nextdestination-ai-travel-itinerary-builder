/**
 * Pinterest API v5 Service
 * Handles authentication (OAuth 2.0 + token refresh), pin/board management,
 * and DB-backed token storage for write-access OAuth flow.
 */

import crypto from 'crypto';
import { supabase } from '../db/supabase.js';

const PINTEREST_API = process.env.PINTEREST_SANDBOX === 'true'
    ? 'https://api-sandbox.pinterest.com/v5'
    : 'https://api.pinterest.com/v5';

// ─── Token Management ──────────────────────────────────────────────────────────

let _accessToken = null;
let _tokenExpiresAt = 0; // Unix ms

function getEnvVars() {
    return {
        appId: process.env.PINTEREST_APP_ID,
        appSecret: process.env.PINTEREST_APP_SECRET,
        refreshToken: process.env.PINTEREST_REFRESH_TOKEN,
        accessToken: process.env.PINTEREST_ACCESS_TOKEN,
        serverUrl: process.env.SERVER_URL || 'http://localhost:3001',
    };
}

export function isConfigured() {
    const { appId, appSecret, refreshToken, accessToken } = getEnvVars();
    return !!(accessToken || (appId && appSecret && refreshToken));
}

// ─── DB Token Storage ───────────────────────────────────────────────────────────

async function getDbTokens() {
    const { data, error } = await supabase
        .from('platform_tokens')
        .select('*')
        .eq('platform', 'pinterest')
        .single();

    if (error || !data) return null;
    return data;
}

export async function saveTokens({ accessToken, refreshToken, expiresIn, refreshTokenExpiresIn, scopes, accountName, connectedBy }) {
    const now = new Date();
    const tokenExpiresAt = expiresIn
        ? new Date(now.getTime() + expiresIn * 1000).toISOString()
        : null;
    const refreshTokenExpiresAt = refreshTokenExpiresIn
        ? new Date(now.getTime() + refreshTokenExpiresIn * 1000).toISOString()
        : null;

    const row = {
        platform: 'pinterest',
        access_token: accessToken,
        refresh_token: refreshToken || null,
        token_expires_at: tokenExpiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        scopes: scopes || null,
        account_name: accountName || null,
        connected_by: connectedBy || null,
        updated_at: now.toISOString(),
    };

    // Upsert: insert if missing, update if exists
    const { error } = await supabase
        .from('platform_tokens')
        .upsert(row, { onConflict: 'platform' });

    if (error) {
        console.error('[Pinterest] Failed to save tokens:', error.message);
        throw new Error('Failed to save Pinterest tokens');
    }

    // Clear in-memory cache so next call loads from DB
    _accessToken = null;
    _tokenExpiresAt = 0;
}

export async function disconnectAccount() {
    const { error } = await supabase
        .from('platform_tokens')
        .delete()
        .eq('platform', 'pinterest');

    if (error) {
        console.error('[Pinterest] Failed to disconnect:', error.message);
        throw new Error('Failed to disconnect Pinterest account');
    }

    // Clear in-memory cache
    _accessToken = null;
    _tokenExpiresAt = 0;
}

// ─── OAuth 2.0 Helpers ──────────────────────────────────────────────────────────

// In-memory CSRF state store: { state → expiresAt }
const _oauthStates = new Map();

// Cleanup expired states every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, expiresAt] of _oauthStates.entries()) {
        if (now > expiresAt) _oauthStates.delete(key);
    }
}, 5 * 60 * 1000);

export function generateAuthorizationUrl(redirectUri) {
    const { appId } = getEnvVars();
    if (!appId) throw new Error('PINTEREST_APP_ID is not configured');

    const state = crypto.randomBytes(32).toString('hex');
    // State valid for 10 minutes
    _oauthStates.set(state, Date.now() + 10 * 60 * 1000);

    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'boards:read,pins:read,pins:write,boards:write',
        state,
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export function validateOAuthState(state) {
    const expiresAt = _oauthStates.get(state);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
        _oauthStates.delete(state);
        return false;
    }
    _oauthStates.delete(state); // one-time use
    return true;
}

export async function exchangeCodeForTokens(code, redirectUri) {
    const { appId, appSecret } = getEnvVars();
    if (!appId || !appSecret) {
        throw new Error('PINTEREST_APP_ID and PINTEREST_APP_SECRET must be configured');
    }

    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');

    const res = await fetch(`${PINTEREST_API}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pinterest token exchange failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in, // seconds
        refreshTokenExpiresIn: data.refresh_token_expires_in,
        scopes: data.scope ? data.scope.split(/[\s,]+/) : [],
    };
}

// ─── Connection Status ──────────────────────────────────────────────────────────

export async function getConnectionStatus() {
    // Check DB tokens first
    const dbTokens = await getDbTokens();

    if (dbTokens) {
        const hasWriteAccess = dbTokens.scopes?.includes('pins:write') || false;
        const tokenExpired = dbTokens.token_expires_at
            ? new Date(dbTokens.token_expires_at) < new Date()
            : false;

        return {
            connected: true,
            source: 'oauth',
            hasWriteAccess,
            accountName: dbTokens.account_name || null,
            scopes: dbTokens.scopes || [],
            tokenExpired,
            tokenExpiresAt: dbTokens.token_expires_at,
            connectedAt: dbTokens.connected_at,
        };
    }

    // Fall back to env-var token
    const { accessToken } = getEnvVars();
    if (accessToken) {
        return {
            connected: true,
            source: 'env',
            hasWriteAccess: false, // env tokens from dashboard are read-only
            accountName: null,
            scopes: ['boards:read', 'pins:read'],
            tokenExpired: false,
            tokenExpiresAt: null,
            connectedAt: null,
        };
    }

    return {
        connected: false,
        source: null,
        hasWriteAccess: false,
        accountName: null,
        scopes: [],
        tokenExpired: false,
        tokenExpiresAt: null,
        connectedAt: null,
    };
}

// ─── Token Resolution ───────────────────────────────────────────────────────────

async function refreshDbToken(dbTokens) {
    const { appId, appSecret } = getEnvVars();
    if (!appId || !appSecret || !dbTokens.refresh_token) {
        return null;
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
            refresh_token: dbTokens.refresh_token,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('[Pinterest] DB token refresh failed:', text);
        return null;
    }

    const data = await res.json();

    // Save refreshed tokens back to DB
    await saveTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || dbTokens.refresh_token,
        expiresIn: data.expires_in,
        refreshTokenExpiresIn: data.refresh_token_expires_in,
        scopes: dbTokens.scopes,
        accountName: dbTokens.account_name,
        connectedBy: dbTokens.connected_by,
    });

    return data.access_token;
}

async function ensureAccessToken() {
    // 1. Check in-memory cache
    const now = Date.now();
    if (_accessToken && now < _tokenExpiresAt * 0.85) {
        return _accessToken;
    }

    // 2. Check DB tokens (OAuth flow)
    try {
        const dbTokens = await getDbTokens();
        console.log('[Pinterest] DB token lookup:', dbTokens ? 'found' : 'not found');
        if (dbTokens) {
            const expiresAt = dbTokens.token_expires_at
                ? new Date(dbTokens.token_expires_at).getTime()
                : 0;

            // Token still valid
            if (expiresAt && now < expiresAt * 0.85) {
                _accessToken = dbTokens.access_token;
                _tokenExpiresAt = expiresAt;
                return _accessToken;
            }

            // Token expired or near-expiry — try refresh
            if (dbTokens.refresh_token) {
                const refreshed = await refreshDbToken(dbTokens);
                if (refreshed) return refreshed;
            }

            // If the token exists but we can't refresh, use it anyway (may still work)
            if (dbTokens.access_token) {
                _accessToken = dbTokens.access_token;
                _tokenExpiresAt = expiresAt || (now + 30 * 60 * 1000);
                return _accessToken;
            }
        }
    } catch (err) {
        console.warn('[Pinterest] DB token lookup failed, falling back to env:', err.message);
    }

    // 3. Fall back to env-var tokens
    const { appId, appSecret, refreshToken, accessToken } = getEnvVars();

    // Direct access token (no refresh flow)
    if (accessToken && !refreshToken) {
        console.log('[Pinterest] Using env access token (read-only)');
        return accessToken;
    }

    // Env-var refresh token flow
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

/**
 * Pinterest OAuth 2.0 Callback Route
 *
 * Handles the browser redirect from Pinterest after the user authorizes.
 * NOT behind verifyAuth — Pinterest redirects the browser directly here
 * with no Bearer token. Security is handled via CSRF state validation.
 */

import express from 'express';
import * as pinterest from '../services/pinterestService.js';

const router = express.Router();

const PINTEREST_API = process.env.PINTEREST_SANDBOX === 'true'
    ? 'https://api-sandbox.pinterest.com/v5'
    : 'https://api.pinterest.com/v5';

// GET /api/admin/pinterest/oauth/callback?code=XXX&state=YYY
router.get('/callback', async (req, res) => {
    const { code, state, error: oauthError } = req.query;
    const frontendUrl = pinterest.getFrontendUrl();
    const redirectBase = `${frontendUrl}/admin/marketing/pinterest`;

    // Pinterest returned an error (user denied, etc.)
    if (oauthError) {
        console.warn('[Pinterest OAuth] Authorization denied:', oauthError);
        return res.redirect(`${redirectBase}?oauth=error&reason=denied`);
    }

    // Missing required params
    if (!code || !state) {
        console.warn('[Pinterest OAuth] Missing code or state');
        return res.redirect(`${redirectBase}?oauth=error&reason=missing_params`);
    }

    // Validate CSRF state
    if (!pinterest.validateOAuthState(state)) {
        console.warn('[Pinterest OAuth] Invalid or expired state');
        return res.redirect(`${redirectBase}?oauth=error&reason=invalid_state`);
    }

    try {
        // Build the redirect URI (must match what was used in /oauth/start)
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
        const redirectUri = `${serverUrl}/api/admin/pinterest/oauth/callback`;

        // Exchange authorization code for tokens
        const tokens = await pinterest.exchangeCodeForTokens(code, redirectUri);

        // Fetch the Pinterest username
        let accountName = null;
        try {
            const userRes = await fetch(`${PINTEREST_API}/user_account`, {
                headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            if (userRes.ok) {
                const user = await userRes.json();
                accountName = user.username || user.business_name || null;
            }
        } catch (err) {
            console.warn('[Pinterest OAuth] Could not fetch username:', err.message);
        }

        // Save tokens to DB
        await pinterest.saveTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
            scopes: tokens.scopes,
            accountName,
        });

        console.log('[Pinterest OAuth] Successfully connected account:', accountName || '(unknown)');
        return res.redirect(`${redirectBase}?oauth=success`);
    } catch (err) {
        console.error('[Pinterest OAuth] Token exchange failed:', err.message);
        return res.redirect(`${redirectBase}?oauth=error&reason=exchange_failed`);
    }
});

export default router;

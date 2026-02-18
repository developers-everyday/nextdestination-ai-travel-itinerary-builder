import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars. By default dotenv loads from .env in process.cwd()
// If starting from server/ folder, it finds server/.env
dotenv.config();

// Support both standard and VITE_ prefixed variables for easier copy-pasting
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Key in server environment.');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ── JWT Verification Cache ──────────────────────────────────────────────────
// Supabase tokens are JWTs — verifying them doesn't need a network call every
// time. We cache the result for 5 minutes (well within typical token lifetimes)
// so the vast majority of requests skip the Supabase auth round-trip entirely.
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 5000;            // cap memory use (~5000 active sessions)
const tokenCache = new Map();           // token → { user, expiresAt }

// Purge expired entries every minute to keep memory bounded
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tokenCache.entries()) {
    if (now > val.expiresAt) tokenCache.delete(key);
  }
}, 60 * 1000);

export const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
  }

  // Fast path: return cached user without hitting Supabase
  const cached = tokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    req.user = cached.user;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth Error:', error?.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Evict the oldest entry when at capacity (simple FIFO eviction)
    if (tokenCache.size >= MAX_CACHE_SIZE) {
      tokenCache.delete(tokenCache.keys().next().value);
    }
    tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Exception:', err);
    res.status(500).json({ error: 'Internal Server Error during auth' });
  }
};

// ── Optional Auth ───────────────────────────────────────────────────────────
// Same as verifyAuth but never rejects: sets req.user if token is valid,
// leaves req.user undefined for anonymous requests. Use on routes that serve
// both authenticated and anonymous users (e.g. optional-auth saves).
export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') return next();

  const cached = tokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    req.user = cached.user;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      if (tokenCache.size >= MAX_CACHE_SIZE) {
        tokenCache.delete(tokenCache.keys().next().value);
      }
      tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL });
      req.user = user;
    }
  } catch (_) {
    // Ignore errors — treat request as anonymous
  }
  next();
};

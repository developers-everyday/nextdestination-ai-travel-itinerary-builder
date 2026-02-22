import * as Sentry from '@sentry/node';
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1, // 10% of requests get performance traces
});

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
dotenv.config(); // current dir
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Trust the first proxy hop (needed for accurate IP-based rate limiting when
// the app sits behind Nginx, a load balancer, or a cloud provider's edge)
app.set('trust proxy', 1);

// ── Security Headers ───────────────────────────────────────────────────────
// Sets X-Frame-Options, HSTS, X-Content-Type-Options, X-XSS-Protection, etc.
// No custom CSP needed — this API only returns JSON, never HTML.
app.use(helmet());

// ── Response Compression ───────────────────────────────────────────────────
// Compresses JSON responses with gzip/brotli. Typical itinerary payloads
// compress from ~8KB to ~1.5KB — a meaningful bandwidth and latency saving
// across 2000 concurrent users.
app.use(compression());

// ── Rate Limiting ──────────────────────────────────────────────────────────
// General limit: protects all API routes from brute-force and runaway clients.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: process.env.NODE_ENV === 'production' ? 100 : 500, // relax limit in dev
    standardHeaders: true,      // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a few minutes.' }
});

// AI generation limit: Gemini calls are expensive (latency + cost). A tighter
// cap prevents one user from monopolising the generation queue for others.
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,                    // 15 generation requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many itinerary requests. Please wait before generating more.' }
});

import recommendationRoutes from './routes/recommendations.js';
import itineraryRoutes from './routes/itineraries.js';
import suggestionRoutes from './routes/suggestions.js';
import activityRoutes from './routes/activities.js';
import transportRoutes from './routes/transport.js';

const allowedOrigins = [
    'https://www.nextdestination.ai',
    'https://nextdestination.ai',
    process.env.CORS_ORIGIN, // extra origin via env var (staging, preview, etc.)
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow production domains and any Vercel preview deployments
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));

// Dynamic sitemap — mounted before rate limiter (crawlers must not be blocked)
import sitemapRoute from './routes/sitemap.js';
app.use('/api/sitemap.xml', sitemapRoute);

// Apply general limiter to all /api routes, stricter limiter to AI endpoints
app.use('/api/', generalLimiter);
app.use('/api/suggestions', aiLimiter);

// ── Request Timeout ────────────────────────────────────────────────────────
// AI generation endpoints can call Gemini, which can legitimately take 30-60s.
// Without a timeout, a stalled Gemini request holds open a Node.js connection
// indefinitely, eventually exhausting the event loop under load.
//
// Strategy:
//   - AI routes (/api/suggestions, /api/transport/*)  → 90s
//   - All other routes                                → 30s
const AI_TIMEOUT_MS = 90_000;
const DEFAULT_TIMEOUT_MS = 30_000;

app.use((req, res, next) => {
    const ms = (
        req.path.startsWith('/api/suggestions') ||
        req.path.startsWith('/api/transport')
    ) ? AI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

    const timer = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({ error: 'Request timed out. Please try again.' });
        }
    }, ms);

    // Clear the timer whether the response completes normally or the client disconnects
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
});

// Stripe webhook needs raw body BEFORE express.json() parses it
import stripeRoutes from './routes/stripe.js';
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes);

app.use(express.json({ limit: '10mb' }));

// Register Stripe API routes (after JSON parsing)
app.use('/api/stripe', stripeRoutes);

app.use('/api/recommend', recommendationRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/suggestions', suggestionRoutes);

app.use('/api/activities', activityRoutes);
app.use('/api/transport', transportRoutes);

import wishlistRoutes from './routes/wishlist.js';
app.use('/api/wishlist', wishlistRoutes);

import profileRoutes from './routes/userProfile.js';
app.use('/api/profile', profileRoutes);

import destinationRoutes from './routes/destinations.js';
app.use('/api/destinations', destinationRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('NextDestination API is running');
});

// ── Sentry Error Handler ────────────────────────────────────────────────────
// Must be registered after all routes. Captures any error passed to next(err).
Sentry.setupExpressErrorHandler(app);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

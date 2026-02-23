import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
const mockLookupTemplate = vi.fn();
const mockPopulateTemplateCache = vi.fn().mockResolvedValue(undefined);
const mockCreateJob = vi.fn();
const mockCompleteJob = vi.fn();
const mockFailJob = vi.fn();
const mockGetJobStatus = vi.fn();

vi.mock('../../../services/templateService.js', () => ({
    lookupTemplate: mockLookupTemplate,
    populateTemplateCache: mockPopulateTemplateCache,
    createJob: mockCreateJob,
    completeJob: mockCompleteJob,
    failJob: mockFailJob,
    getJobStatus: mockGetJobStatus,
}));

const mockGenerateEmbedding = vi.fn().mockResolvedValue([0.1, 0.2]);
const mockGenerateQuickItinerary = vi.fn();
const mockAnalyzeQuery = vi.fn();

vi.mock('../../../services/gemini.js', () => ({
    generateEmbedding: mockGenerateEmbedding,
    generateQuickItinerary: mockGenerateQuickItinerary,
    analyzeQuery: mockAnalyzeQuery,
}));

const mockSearchSimilarItineraries = vi.fn().mockResolvedValue([]);
const mockStoreItinerary = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../services/vectorService.js', () => ({
    searchSimilarItineraries: mockSearchSimilarItineraries,
    storeItinerary: mockStoreItinerary,
}));

vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => { req.user = { id: 'user-1' }; next(); },
}));

vi.mock('../../../db/supabase.js', () => ({
    getAuthenticatedClient: vi.fn(() => ({ from: vi.fn() })),
}));

const { default: router } = await import('../../../routes/suggestions.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return { headers: { authorization: 'Bearer token' }, body: {}, query: {}, params: {}, user: { id: 'user-1' }, ...overrides };
}

function createRes() {
    const res = { _status: 200, _json: null, status(c) { res._status = c; return res; }, json(b) { res._json = b; return res; } };
    return res;
}

function getHandler(method, path) {
    const route = router.stack.find(l => l.route && l.route.path === path && l.route.methods[method]);
    return route.route.stack[route.route.stack.length - 1].handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST / (synchronous suggestions)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST / (sync suggestions)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when destination is missing', async () => {
        const handler = getHandler('post', '/');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns template cache hit when available', async () => {
        mockLookupTemplate.mockResolvedValueOnce({
            itinerary_data: { destination: 'Paris', days: [] },
        });

        const handler = getHandler('post', '/');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.source).toBe('template-cache');
        expect(res._json.data.destination).toBe('Paris');
    });

    it('returns vector cache hit when template misses', async () => {
        mockLookupTemplate.mockResolvedValueOnce(null);
        mockSearchSimilarItineraries.mockResolvedValueOnce([
            { id: 'itin-1', metadata: { destination: 'Paris', days: [] }, similarity: 0.85 },
        ]);

        const handler = getHandler('post', '/');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.source).toBe('vector-cache');
    });

    it('falls back to Gemini when all caches miss', async () => {
        mockLookupTemplate.mockResolvedValueOnce(null);
        mockSearchSimilarItineraries.mockResolvedValueOnce([]);
        mockGenerateQuickItinerary.mockResolvedValueOnce({ destination: 'Mars', days: [{ day: 1 }] });

        const handler = getHandler('post', '/');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Mars', days: 1, interests: ['astronomy'] } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.source).toBe('gemini');
        expect(mockGenerateQuickItinerary).toHaveBeenCalledWith('Mars', 1, ['astronomy']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /async (async generation)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /async', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when destination is missing', async () => {
        const handler = getHandler('post', '/async');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns jobId immediately', async () => {
        mockLookupTemplate.mockResolvedValueOnce(null);
        mockSearchSimilarItineraries.mockResolvedValueOnce([]);
        mockGenerateQuickItinerary.mockResolvedValueOnce({ destination: 'Tokyo', days: [] });

        const handler = getHandler('post', '/async');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Tokyo', days: 5 } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.jobId).toBeDefined();
        expect(res._json.status).toBe('processing');
        expect(res._json.totalDays).toBe(5);
        expect(mockCreateJob).toHaveBeenCalledWith(expect.any(String), 5);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /status/:jobId
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /status/:jobId', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns job status', async () => {
        mockGetJobStatus.mockResolvedValueOnce({ status: 'completed', itinerary: { destination: 'Tokyo' } });

        const handler = getHandler('get', '/status/:jobId');
        const res = createRes();
        await handler(createReq({ params: { jobId: 'job-123' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.status).toBe('completed');
        expect(mockGetJobStatus).toHaveBeenCalledWith('job-123');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /analyze
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /analyze', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when query is missing', async () => {
        const handler = getHandler('post', '/analyze');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns 400 when query is not a string', async () => {
        const handler = getHandler('post', '/analyze');
        const res = createRes();
        await handler(createReq({ body: { query: 123 } }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('analyzes travel query successfully', async () => {
        mockAnalyzeQuery.mockResolvedValueOnce({
            destination: 'Bali',
            days: 7,
            interests: ['surfing', 'temples'],
            intent: 'plan_trip',
            response: 'Great choice! Bali is beautiful.',
        });

        const handler = getHandler('post', '/analyze');
        const res = createRes();
        await handler(createReq({ body: { query: 'I want to surf in Bali for a week' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.destination).toBe('Bali');
        expect(res._json.intent).toBe('plan_trip');
    });

    it('returns fallback response on AI error', async () => {
        mockAnalyzeQuery.mockRejectedValueOnce(new Error('AI unavailable'));

        const handler = getHandler('post', '/analyze');
        const res = createRes();
        await handler(createReq({ body: { query: 'plan a trip' } }), res, vi.fn());

        expect(res._status).toBe(500);
        expect(res._json.intent).toBe('continue_chat');
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock all external dependencies before importing routes ──────────────────

// Mock Supabase createClient chain
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

// Build a flexible chained mock that supports multiple .eq() calls
function createChainedMock() {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        then: vi.fn((cb) => cb({ error: null })),
    };
    return chain;
}

const mockChain = createChainedMock();
const mockFrom = vi.fn(() => mockChain);

const mockSupabaseClient = {
    from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Gemini service
const mockGenerateEmbedding = vi.fn();
vi.mock('../../../services/gemini.js', () => ({
    generateEmbedding: mockGenerateEmbedding,
}));

// Mock auth middleware (pass through in unit tests)
vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => { req.user = req._testUser || { id: 'test-user-id' }; next(); },
    optionalAuth: (req, res, next) => { if (req._testUser) req.user = req._testUser; next(); },
}));

// Mock roleAuth middleware (pass through)
vi.mock('../../../middleware/roleAuth.js', () => ({
    checkSaveQuota: (req, res, next) => next(),
    incrementSaves: vi.fn().mockResolvedValue(undefined),
}));

// Mock image generation service
vi.mock('../../../services/imageGenerationService.js', () => ({
    generateAndSaveItineraryImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}));

// Mock vector service
vi.mock('../../../services/vectorService.js', () => ({
    searchSimilarItineraries: vi.fn().mockResolvedValue([]),
}));

// Import the router AFTER mocks are set up
const { default: router } = await import('../../../routes/itineraries.js');

// ── Express-like test helpers ───────────────────────────────────────────────
function createReq(overrides = {}) {
    return {
        headers: {},
        body: {},
        query: {},
        params: {},
        _testUser: null,
        ...overrides,
    };
}

function createRes() {
    const res = {
        _status: 200,
        _json: null,
        _headers: {},
        status(code) { res._status = code; return res; },
        json(body) { res._json = body; return res; },
        set(key, val) { res._headers[key] = val; return res; },
    };
    return res;
}

// Find a route handler by method and path pattern
function findRoute(method, pathPattern) {
    const layer = router.stack.find(l =>
        l.route &&
        l.route.methods[method] &&
        (l.route.path === pathPattern || l.route.path.match(pathPattern))
    );
    if (!layer) throw new Error(`Route ${method.toUpperCase()} ${pathPattern} not found`);
    // Return the last handler in the stack (after middleware)
    return layer.route.stack[layer.route.stack.length - 1].handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /trending
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /trending', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // U-API-01: List public itineraries
    it('U-API-01 — returns public itineraries with correct shape', async () => {
        const mockData = [
            {
                id: 'itin-1',
                metadata: { destination: 'Paris', days: [] },
                user_id: 'user-1',
            },
            {
                id: 'itin-2',
                metadata: { destination: 'Tokyo', days: [] },
                user_id: 'user-2',
            },
        ];

        // Make the chain resolve with data at the end
        const chain = createChainedMock();
        chain.limit.mockResolvedValueOnce({ data: mockData, error: null });
        mockFrom.mockReturnValueOnce(chain);

        const handler = findRoute('get', '/trending');
        const req = createReq({ query: {} });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json).toHaveLength(2);
        expect(res._json[0].id).toBe('itin-1');
        expect(res._json[0].destination).toBe('Paris');
        expect(res._headers['Cache-Control']).toContain('public');
    });

    it('returns 500 when database throws', async () => {
        const chain = createChainedMock();
        chain.limit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
        mockFrom.mockReturnValueOnce(chain);

        const handler = findRoute('get', '/trending');
        const req = createReq({ query: {} });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(500);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /:id
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /:id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // U-API-02: Get itinerary by ID
    it('U-API-02 — returns itinerary when found', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({
            data: {
                metadata: { destination: 'Bali', days: [] },
                is_public: true,
                user_id: 'owner-1',
            },
            error: null,
        });
        mockFrom.mockReturnValueOnce(chain);

        const handler = findRoute('get', '/:id');
        const req = createReq({ params: { id: 'itin-123' } });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.destination).toBe('Bali');
        expect(res._json.isPublic).toBe(true);
        expect(res._json.userId).toBe('owner-1');
    });

    // U-API-03: Get non-existent itinerary
    it('U-API-03 — returns 404 when itinerary not found (PGRST116)', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116', message: 'Row not found' },
        });
        mockFrom.mockReturnValueOnce(chain);

        const handler = findRoute('get', '/:id');
        const req = createReq({ params: { id: 'nonexistent' } });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(404);
        expect(res._json.error).toContain('not found');
    });

    it('sets Cache-Control to private for private itineraries', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({
            data: {
                metadata: { destination: 'Secret Island' },
                is_public: false,
                user_id: 'owner-1',
            },
            error: null,
        });
        mockFrom.mockReturnValueOnce(chain);

        const handler = findRoute('get', '/:id');
        const req = createReq({ params: { id: 'private-itin' } });
        const res = createRes();

        await handler(req, res);

        expect(res._headers['Cache-Control']).toContain('private');
        expect(res._headers['Cache-Control']).toContain('no-store');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST / (Save itinerary)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST / (save)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // U-API-04: Create new itinerary (authenticated)
    it('U-API-04 — saves itinerary and returns id + success message', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({
            data: { id: 'new-itin-id' },
            error: null,
        });
        mockFrom.mockReturnValue(chain);

        const middlewareStack = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.post).route.stack;
        const lastHandler = middlewareStack[middlewareStack.length - 1].handle;

        const req = createReq({
            body: {
                destination: 'Rome',
                days: [{ day: 1, theme: 'History', activities: [{ time: '9:00', activity: 'Colosseum', location: 'Rome', description: 'Visit' }] }],
            },
            user: { id: 'test-user-id' },
            headers: { authorization: 'Bearer test-token' },
        });
        const res = createRes();

        await lastHandler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.message).toContain('saved successfully');
        expect(res._json.id).toBeDefined();
    });

    // Note: Express parses body as {} not null, and source code accesses req.body.isPublic
    // before null check. The null check at line 248 (`if (!itineraryData)`) only catches
    // actual falsy values, so with Express's default {} this branch is unreachable.
    // Test with an actual empty body (which Express sends as {}).
    it('handles empty body gracefully', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({ data: { id: 'empty-body-id' }, error: null });
        mockFrom.mockReturnValue(chain);

        const middlewareStack = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.post).route.stack;
        const lastHandler = middlewareStack[middlewareStack.length - 1].handle;

        const req = createReq({
            body: {},
            user: { id: 'test-user' },
        });
        const res = createRes();

        await lastHandler(req, res);

        // With empty body, it still saves (no required field validation in route)
        expect(res._status).toBe(200);
    });

    it('defaults isPublic to false for authenticated users', async () => {
        const upsertArgs = [];
        const chain = createChainedMock();
        // Capture the upsert arguments
        chain.single.mockResolvedValueOnce({ data: { id: 'x' }, error: null });
        const origUpsert = chain.eq;
        mockFrom.mockReturnValue({
            ...chain,
            upsert: vi.fn((data) => {
                upsertArgs.push(data);
                return chain;
            }),
            update: vi.fn(() => chain),
        });

        const middlewareStack = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.post).route.stack;
        const lastHandler = middlewareStack[middlewareStack.length - 1].handle;

        const req = createReq({
            body: { destination: 'London', days: [] },
            user: { id: 'auth-user' },
        });
        const res = createRes();

        await lastHandler(req, res);

        // isPublic should default to false for authenticated user
        expect(upsertArgs[0].is_public).toBe(false);
    });

    it('defaults isPublic to true for anonymous users', async () => {
        const upsertArgs = [];
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({ data: { id: 'y' }, error: null });
        mockFrom.mockReturnValue({
            ...chain,
            upsert: vi.fn((data) => {
                upsertArgs.push(data);
                return chain;
            }),
            update: vi.fn(() => chain),
        });

        const middlewareStack = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.post).route.stack;
        const lastHandler = middlewareStack[middlewareStack.length - 1].handle;

        const req = createReq({
            body: { destination: 'London', days: [] },
            user: null,
        });
        const res = createRes();

        await lastHandler(req, res);

        // isPublic should default to true for anonymous user
        expect(upsertArgs[0].is_public).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /:id/privacy
// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /:id/privacy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('toggles privacy successfully', async () => {
        const chain = createChainedMock();
        chain.single.mockResolvedValueOnce({
            data: { is_public: true },
            error: null,
        });
        // The route calls getSupabase(req) which returns the mock client
        // which requires .from().update().eq().select().single() chain
        mockFrom.mockReturnValue(chain);

        const privacyRoute = router.stack.find(l =>
            l.route && l.route.path === '/:id/privacy' && l.route.methods.patch
        );
        const lastHandler = privacyRoute.route.stack[privacyRoute.route.stack.length - 1].handle;

        const req = createReq({
            params: { id: 'itin-1' },
            body: { isPublic: true },
            user: { id: 'owner' },
            headers: { authorization: 'Bearer token' },
        });
        const res = createRes();

        await lastHandler(req, res);

        expect(res._status).toBe(200);
        expect(res._json.success).toBe(true);
        expect(res._json.isPublic).toBe(true);
    });

    it('returns 400 when isPublic is missing', async () => {
        const privacyRoute = router.stack.find(l =>
            l.route && l.route.path === '/:id/privacy' && l.route.methods.patch
        );
        const lastHandler = privacyRoute.route.stack[privacyRoute.route.stack.length - 1].handle;

        const req = createReq({
            params: { id: 'itin-1' },
            body: {},
            user: { id: 'owner' },
        });
        const res = createRes();

        await lastHandler(req, res);

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('isPublic');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /search
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 when no query or destination provided', async () => {
        const handler = findRoute('post', '/search');
        const req = createReq({ body: {} });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('required');
    });

    it('searches with destination when no query provided', async () => {
        mockGenerateEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3]);
        const { searchSimilarItineraries } = await import('../../../services/vectorService.js');
        searchSimilarItineraries.mockResolvedValueOnce([
            { id: 'result-1', metadata: { destination: 'Paris', category: 'Culture' } }
        ]);

        const handler = findRoute('post', '/search');
        const req = createReq({ body: { destination: 'Paris' } });
        const res = createRes();

        await handler(req, res);

        expect(res._status).toBe(200);
        expect(mockGenerateEmbedding).toHaveBeenCalledWith('Trip to Paris');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /my-trips
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /my-trips', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns user trips with correct shape', async () => {
        const mockTrips = [
            {
                id: 'trip-1',
                metadata: { destination: 'Lisbon', days: [] },
                is_public: false,
                user_id: 'test-user-id',
            },
        ];

        const chain = createChainedMock();
        chain.order.mockResolvedValueOnce({ data: mockTrips, error: null });
        mockFrom.mockReturnValueOnce(chain);

        // Find the my-trips handler (after verifyAuth middleware)
        const myTripsRoute = router.stack.find(l =>
            l.route && l.route.path === '/my-trips' && l.route.methods.get
        );
        const lastHandler = myTripsRoute.route.stack[myTripsRoute.route.stack.length - 1].handle;

        const req = createReq({
            user: { id: 'test-user-id' },
            headers: { authorization: 'Bearer test-token' },
        });
        const res = createRes();

        await lastHandler(req, res);

        expect(res._status).toBe(200);
        expect(res._json).toHaveLength(1);
        expect(res._json[0].destination).toBe('Lisbon');
        expect(res._json[0].isPublic).toBe(false);
    });
});

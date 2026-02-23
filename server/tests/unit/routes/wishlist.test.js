import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
        update: vi.fn(() => chain),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        delete: vi.fn(() => chain),
    };
    return chain;
}

let chainQueue = [];
const mockFrom = vi.fn(() => {
    return chainQueue.length > 0 ? chainQueue.shift() : createChainedMock();
});

vi.mock('../../../db/supabase.js', () => ({
    supabase: { from: mockFrom },
}));

vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => { req.user = { id: 'user-1' }; next(); },
}));

const { default: router } = await import('../../../routes/wishlist.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return { headers: {}, body: {}, query: {}, params: {}, user: { id: 'user-1' }, ...overrides };
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
// POST /toggle
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /toggle', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when itineraryId is missing', async () => {
        const handler = getHandler('post', '/toggle');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('Itinerary ID is required');
    });

    it('returns 400 for invalid UUID format', async () => {
        const handler = getHandler('post', '/toggle');
        const res = createRes();
        await handler(createReq({ body: { itineraryId: 'not-a-uuid' } }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('Invalid Itinerary ID format');
    });

    it('adds to wishlist when not already wishlisted', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';

        // Step 1: Check existing — not found
        const checkChain = createChainedMock({ data: null, error: { code: 'PGRST116' } });
        // Step 2: Insert into wishlists
        const insertChain = createChainedMock();
        insertChain.insert.mockReturnValueOnce(Promise.resolve({ error: null }));
        // Step 3: Fetch itinerary metadata for saveCount
        const fetchItinChain = createChainedMock({ data: { metadata: { saveCount: 5 } }, error: null });
        // Step 4: Update itinerary metadata
        const updateChain = createChainedMock();
        updateChain.eq.mockResolvedValueOnce({ error: null });

        chainQueue.push(checkChain, insertChain, fetchItinChain, updateChain);

        const handler = getHandler('post', '/toggle');
        const res = createRes();
        await handler(createReq({ body: { itineraryId: validUuid } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.isWishlisted).toBe(true);
    });

    it('removes from wishlist when already wishlisted', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';

        // Step 1: Check existing — found
        const checkChain = createChainedMock({ data: { id: 'wish-1' }, error: null });
        // Step 2: Delete
        const deleteChain = createChainedMock();
        deleteChain.eq.mockResolvedValueOnce({ error: null });
        // Step 3: Fetch itinerary metadata
        const fetchItinChain = createChainedMock({ data: { metadata: { saveCount: 5 } }, error: null });
        // Step 4: Update metadata
        const updateChain = createChainedMock();
        updateChain.eq.mockResolvedValueOnce({ error: null });

        chainQueue.push(checkChain, deleteChain, fetchItinChain, updateChain);

        const handler = getHandler('post', '/toggle');
        const res = createRes();
        await handler(createReq({ body: { itineraryId: validUuid } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.isWishlisted).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET / (list wishlist)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET / (list)', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns transformed wishlist items', async () => {
        const listChain = createChainedMock();
        listChain.eq.mockResolvedValueOnce({
            data: [
                {
                    itinerary_id: 'itin-1',
                    itineraries: { id: 'itin-1', metadata: { destination: 'Paris' } },
                    created_at: '2024-01-01',
                },
            ],
            error: null,
        });
        chainQueue.push(listChain);

        const handler = getHandler('get', '/');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json).toHaveLength(1);
        expect(res._json[0].destination).toBe('Paris');
    });

    it('filters out null itinerary joins', async () => {
        const listChain = createChainedMock();
        listChain.eq.mockResolvedValueOnce({
            data: [
                { itinerary_id: 'deleted', itineraries: null },
                { itinerary_id: 'ok', itineraries: { id: 'ok', metadata: { destination: 'Rome' } } },
            ],
            error: null,
        });
        chainQueue.push(listChain);

        const handler = getHandler('get', '/');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._json).toHaveLength(1);
        expect(res._json[0].destination).toBe('Rome');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /check/:id
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /check/:id', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns true when item is wishlisted', async () => {
        chainQueue.push(createChainedMock({ data: { id: 'wish-1' }, error: null }));

        const handler = getHandler('get', '/check/:id');
        const res = createRes();
        await handler(createReq({ params: { id: 'itin-1' } }), res, vi.fn());

        expect(res._json.isWishlisted).toBe(true);
    });

    it('returns false when item is not wishlisted', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116' } }));

        const handler = getHandler('get', '/check/:id');
        const res = createRes();
        await handler(createReq({ params: { id: 'itin-2' } }), res, vi.fn());

        expect(res._json.isWishlisted).toBe(false);
    });
});

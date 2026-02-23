import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        ilike: vi.fn(() => chain),
        not: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => Promise.resolve(resolves)),
        single: vi.fn(() => Promise.resolve(resolves)),
    };
    return chain;
}

let chainQueue = [];
const mockSupabaseClient = {
    from: vi.fn(() => chainQueue.length > 0 ? chainQueue.shift() : createChainedMock()),
};

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}));

const { default: router } = await import('../../../routes/destinations.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return { headers: {}, body: {}, query: {}, params: {}, ...overrides };
}

function createRes() {
    const res = {
        _status: 200, _json: null, _headers: {},
        status(c) { res._status = c; return res; },
        json(b) { res._json = b; return res; },
        set(k, v) { res._headers[k] = v; return res; },
    };
    return res;
}

function getHandler(method, path) {
    const route = router.stack.find(l => l.route && l.route.path === path && l.route.methods[method]);
    return route.route.stack[route.route.stack.length - 1].handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /:name
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /:name', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns destination with community trips', async () => {
        // Step 1: Destination fetch
        chainQueue.push(createChainedMock({
            data: {
                name: 'Paris',
                general_info: { visa: 'Not required for EU' },
                attractions: [{ name: 'Eiffel Tower' }],
                updated_at: '2024-01-01',
            },
            error: null,
        }));
        // Step 2: Community itineraries
        const itinChain = createChainedMock();
        itinChain.limit.mockResolvedValueOnce({
            data: [
                { id: 'trip-1', metadata: { destination: 'Paris', days: [1, 2, 3], category: 'Culture', tags: ['culture'] }, created_at: '2024-01-01', image_url: 'http://img.com' },
            ],
            error: null,
        });
        chainQueue.push(itinChain);

        const handler = getHandler('get', '/:name');
        const res = createRes();
        await handler(createReq({ params: { name: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.name).toBe('Paris');
        expect(res._json.generalInfo).toBeDefined();
        expect(res._json.communityTrips).toHaveLength(1);
        expect(res._headers['Cache-Control']).toContain('max-age=300');
    });

    it('returns 404 when destination not found', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { message: 'Not found' } }));

        const handler = getHandler('get', '/:name');
        const res = createRes();
        await handler(createReq({ params: { name: 'Nowhere' } }), res, vi.fn());

        expect(res._status).toBe(404);
    });

    it('decodes URL-encoded names with hyphens', async () => {
        chainQueue.push(createChainedMock({
            data: { name: 'New York', general_info: {}, attractions: [], updated_at: null },
            error: null,
        }));
        const itinChain = createChainedMock();
        itinChain.limit.mockResolvedValueOnce({ data: [], error: null });
        chainQueue.push(itinChain);

        const handler = getHandler('get', '/:name');
        const res = createRes();
        await handler(createReq({ params: { name: 'New-York' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.name).toBe('New York');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns list of destinations', async () => {
        const chain = createChainedMock();
        chain.order.mockResolvedValueOnce({
            data: [{ name: 'Paris', updated_at: '2024-01-01' }, { name: 'Tokyo', updated_at: '2024-01-02' }],
            error: null,
        });
        chainQueue.push(chain);

        const handler = getHandler('get', '/');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json).toHaveLength(2);
        expect(res._headers['Cache-Control']).toContain('max-age=600');
    });

    it('returns 500 on DB error', async () => {
        const chain = createChainedMock();
        chain.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
        chainQueue.push(chain);

        const handler = getHandler('get', '/');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(500);
    });
});

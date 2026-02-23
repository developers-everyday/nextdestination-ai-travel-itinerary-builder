import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
const mockRpc = vi.fn();

vi.mock('../../../db/supabase.js', () => ({
    supabase: { rpc: mockRpc, from: vi.fn() },
}));

const mockGenerateEmbedding = vi.fn();

vi.mock('../../../services/gemini.js', () => ({
    generateEmbedding: mockGenerateEmbedding,
}));

vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => { req.user = { id: 'user-1' }; next(); },
}));

const { default: router } = await import('../../../routes/recommendations.js');

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
// POST /vector
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /vector', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when query is missing', async () => {
        const handler = getHandler('post', '/vector');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('Query is required');
    });

    it('returns vector search recommendations', async () => {
        mockGenerateEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3]);
        mockRpc.mockResolvedValueOnce({
            data: [{ id: 'itin-1', metadata: { destination: 'Paris' }, similarity: 0.9 }],
            error: null,
        });

        const handler = getHandler('post', '/vector');
        const res = createRes();
        await handler(createReq({ body: { query: 'romantic trip to Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.recommendations).toHaveLength(1);
        expect(mockRpc).toHaveBeenCalledWith('match_itineraries', expect.objectContaining({
            match_threshold: 0.5,
            match_count: 5,
        }));
    });

    it('returns 500 when vector search fails', async () => {
        mockGenerateEmbedding.mockResolvedValueOnce([0.1]);
        mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } });

        const handler = getHandler('post', '/vector');
        const res = createRes();
        await handler(createReq({ body: { query: 'test' } }), res, vi.fn());

        expect(res._status).toBe(500);
    });
});

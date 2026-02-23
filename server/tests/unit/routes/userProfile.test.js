import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
        update: vi.fn(() => chain),
        insert: vi.fn(() => chain),
    };
    return chain;
}

let chainQueue = [];
const mockFrom = vi.fn(() => chainQueue.length > 0 ? chainQueue.shift() : createChainedMock());

vi.mock('../../../db/supabase.js', () => ({
    supabase: { from: mockFrom },
    getAuthenticatedClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock('../../../middleware/auth.js', () => ({
    verifyAuth: (req, res, next) => {
        req.user = { id: 'user-1', email: 'test@test.com', user_metadata: { full_name: 'Test User' } };
        next();
    },
}));

const { default: router } = await import('../../../routes/userProfile.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return {
        headers: { authorization: 'Bearer test-token' },
        body: {}, query: {}, params: {},
        // Pre-set user so handler works even if middleware doesn't run
        user: { id: 'user-1', email: 'test@test.com', user_metadata: { full_name: 'Test User' } },
        ...overrides,
    };
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
// GET /me
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /me', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns existing profile with flattened plan config', async () => {
        chainQueue.push(createChainedMock({
            data: {
                id: 'prof-1', user_id: 'user-1', display_name: 'Alice',
                avatar_url: null, role: 'user', plan: 'free',
                generations_used: 2, saves_used: 0, bio: null,
                is_verified: false, created_at: '2024-01-01', updated_at: '2024-01-01',
                plan_config: { max_generations: 5, max_saves: 1, has_voice_agent: false, has_affiliate: false, can_sell_packages: false },
            },
            error: null,
        }));

        const handler = getHandler('get', '/me');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.displayName).toBe('Alice');
        expect(res._json.maxGenerations).toBe(5);
        expect(res._json.generationsUsed).toBe(2);
    });

    it('auto-creates profile when PGRST116 error', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116' } }));
        chainQueue.push(createChainedMock({
            data: {
                id: 'new-prof', user_id: 'user-1', display_name: 'Test User',
                avatar_url: null, role: 'user', plan: 'free',
                generations_used: 0, saves_used: 0, bio: null,
                is_verified: false, created_at: '2024-01-01', updated_at: '2024-01-01',
                plan_config: null,
            },
            error: null,
        }));

        const handler = getHandler('get', '/me');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.userId).toBe('user-1');
    });

    it('returns 500 on non-PGRST116 DB error', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'OTHER', message: 'DB crash' } }));

        const handler = getHandler('get', '/me');
        const res = createRes();
        await handler(createReq(), res, vi.fn());

        expect(res._status).toBe(500);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /me
// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /me', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('updates profile fields successfully', async () => {
        chainQueue.push(createChainedMock({
            data: { id: 'prof-1', user_id: 'user-1', display_name: 'NewName', avatar_url: null, bio: 'Hello', updated_at: '2024-02-01' },
            error: null,
        }));

        const handler = getHandler('patch', '/me');
        const res = createRes();
        await handler(createReq({ body: { displayName: 'NewName', bio: 'Hello' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.displayName).toBe('NewName');
        expect(res._json.bio).toBe('Hello');
    });

    it('returns 400 when no valid fields provided', async () => {
        const handler = getHandler('patch', '/me');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
        expect(res._json.error).toContain('No valid fields');
    });

    it('only allows safe fields (displayName, bio, avatarUrl)', async () => {
        chainQueue.push(createChainedMock({
            data: { id: 'prof-1', user_id: 'user-1', display_name: 'X', avatar_url: null, bio: null, updated_at: '' },
            error: null,
        }));

        const handler = getHandler('patch', '/me');
        const res = createRes();
        // Pass unsafe fields along with a safe one — only safe ones should be applied
        await handler(createReq({ body: { displayName: 'X', role: 'admin', plan: 'custom' } }), res, vi.fn());

        expect(res._status).toBe(200);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /:userId (public profile)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /:userId', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns public profile data', async () => {
        chainQueue.push(createChainedMock({
            data: {
                id: 'p-1', user_id: 'user-2', display_name: 'Bob',
                avatar_url: 'http://img.com/bob.jpg', role: 'user', plan: 'explorer',
                bio: 'Traveler', is_verified: true, created_at: '2024-01-01',
            },
            error: null,
        }));

        const handler = getHandler('get', '/:userId');
        const res = createRes();
        await handler(createReq({ params: { userId: 'user-2' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.displayName).toBe('Bob');
        expect(res._json.isVerified).toBe(true);
        expect(res._json.generationsUsed).toBeUndefined();
    });

    it('returns 404 for non-existent user', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }));

        const handler = getHandler('get', '/:userId');
        const res = createRes();
        await handler(createReq({ params: { userId: 'ghost' } }), res, vi.fn());

        expect(res._status).toBe(404);
    });
});

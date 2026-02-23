import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock Supabase before importing the module under test ────────────────────
const mockGetUser = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: mockGetUser,
        },
    })),
}));

// Now import the module — it will use the mocked Supabase
const { verifyAuth, optionalAuth } = await import('../../../middleware/auth.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createMockReq(authHeader) {
    return {
        headers: authHeader !== undefined
            ? { authorization: authHeader }
            : {},
    };
}

function createMockRes() {
    const res = {
        _status: null,
        _json: null,
        status(code) {
            res._status = code;
            return res;
        },
        json(body) {
            res._json = body;
            return res;
        },
    };
    return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyAuth
// ─────────────────────────────────────────────────────────────────────────────
describe('verifyAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // U-AUTH-01: Missing Authorization header
    it('U-AUTH-01 — returns 401 when Authorization header is missing', async () => {
        const req = createMockReq(undefined);
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(res._status).toBe(401);
        expect(res._json.error).toBe('Unauthorized: No valid token provided');
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-02: Token is the string "undefined"
    it('U-AUTH-02 — returns 401 when token is the string "undefined"', async () => {
        const req = createMockReq('Bearer undefined');
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-03: Token is the string "null"
    it('U-AUTH-03 — returns 401 when token is the string "null"', async () => {
        const req = createMockReq('Bearer null');
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(res._status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-06: Valid token, Supabase returns user
    it('U-AUTH-06 — sets req.user and calls next() for a valid token', async () => {
        const fakeUser = { id: 'user-123', email: 'test@example.com' };
        mockGetUser.mockResolvedValueOnce({
            data: { user: fakeUser },
            error: null,
        });

        const req = createMockReq('Bearer valid-token-abc');
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull();
    });

    // U-AUTH-07: Invalid token, Supabase returns error
    it('U-AUTH-07 — returns 401 when Supabase returns an error', async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'JWT expired' },
        });

        const req = createMockReq('Bearer expired-token');
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(res._status).toBe(401);
        expect(res._json.error).toBe('Unauthorized: Invalid token');
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-09: Supabase throws exception
    it('U-AUTH-09 — returns 500 when Supabase throws an exception', async () => {
        mockGetUser.mockRejectedValueOnce(new Error('Network failure'));

        const req = createMockReq('Bearer crash-token');
        const res = createMockRes();
        const next = vi.fn();

        await verifyAuth(req, res, next);

        expect(res._status).toBe(500);
        expect(res._json.error).toBe('Internal Server Error during auth');
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-04: Valid cached token (within TTL) — cache behaviour
    it('U-AUTH-04 — uses cached token without calling Supabase', async () => {
        const fakeUser = { id: 'cached-user', email: 'cached@test.com' };
        // First call — populates cache
        mockGetUser.mockResolvedValueOnce({
            data: { user: fakeUser },
            error: null,
        });

        const token = `Bearer cache-test-token-${Date.now()}`;
        const req1 = createMockReq(token);
        const res1 = createMockRes();
        const next1 = vi.fn();
        await verifyAuth(req1, res1, next1);

        // Reset mock call count
        mockGetUser.mockClear();

        // Second call — should use cache
        const req2 = createMockReq(token);
        const res2 = createMockRes();
        const next2 = vi.fn();
        await verifyAuth(req2, res2, next2);

        expect(mockGetUser).not.toHaveBeenCalled(); // Cache hit!
        expect(req2.user).toEqual(fakeUser);
        expect(next2).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// optionalAuth
// ─────────────────────────────────────────────────────────────────────────────
describe('optionalAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // U-AUTH-10: No token provided
    it('U-AUTH-10 — calls next() without setting req.user when no token present', async () => {
        const req = createMockReq(undefined);
        const res = createMockRes();
        const next = vi.fn();

        await optionalAuth(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledTimes(1);
    });

    // U-AUTH-11: Valid token provided
    it('U-AUTH-11 — sets req.user when valid token provided', async () => {
        const fakeUser = { id: 'opt-user-1', email: 'opt@test.com' };
        mockGetUser.mockResolvedValueOnce({
            data: { user: fakeUser },
            error: null,
        });

        const req = createMockReq(`Bearer opt-valid-${Date.now()}`);
        const res = createMockRes();
        const next = vi.fn();

        await optionalAuth(req, res, next);

        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalledTimes(1);
    });

    // U-AUTH-12: Invalid token — still calls next (no rejection)
    it('U-AUTH-12 — calls next() without req.user when token is invalid', async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Invalid token' },
        });

        const req = createMockReq(`Bearer opt-invalid-${Date.now()}`);
        const res = createMockRes();
        const next = vi.fn();

        await optionalAuth(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull(); // No error response sent
    });

    // U-AUTH-13: Supabase exception — silent catch
    it('U-AUTH-13 — calls next() without req.user when Supabase throws', async () => {
        mockGetUser.mockRejectedValueOnce(new Error('Network down'));

        const req = createMockReq(`Bearer opt-crash-${Date.now()}`);
        const res = createMockRes();
        const next = vi.fn();

        await optionalAuth(req, res, next);

        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull();
    });
});

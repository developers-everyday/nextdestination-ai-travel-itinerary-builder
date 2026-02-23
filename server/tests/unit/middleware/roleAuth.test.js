import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase DB (used by roleAuth.js) ──────────────────────────────────
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

// Build the chained query mock: supabase.from().select().eq().single()
const mockFrom = vi.fn(() => ({
    select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
            single: mockSingle,
        }),
    }),
    update: mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
    }),
}));

vi.mock('../../../db/supabase.js', () => ({
    supabase: {
        from: mockFrom,
        rpc: mockRpc,
    },
}));

const {
    requireRole,
    requirePlan,
    checkGenerationQuota,
    checkSaveQuota,
    incrementGenerations,
    incrementSaves,
    invalidateProfileCache,
} = await import('../../../middleware/roleAuth.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createMockReq(user, userProfile) {
    return {
        user: user || undefined,
        userProfile: userProfile || undefined,
        userQuota: undefined,
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
// requireRole
// ─────────────────────────────────────────────────────────────────────────────
describe('requireRole', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateProfileCache('test-user');
    });

    // U-AUTH-17: No user on request
    it('U-AUTH-17 — returns 401 when req.user is not set', async () => {
        const middleware = requireRole('agent');
        const req = createMockReq(null);
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(401);
        expect(res._json.error).toBe('Unauthorized: User not authenticated');
        expect(next).not.toHaveBeenCalled();
    });

    // U-AUTH-14: User with required role
    it('U-AUTH-14 — calls next() when user has the required role', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { role: 'agent' },
            error: null,
        });

        const middleware = requireRole('agent', 'influencer');
        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userProfile.role).toBe('agent');
    });

    // U-AUTH-15: User without required role
    it('U-AUTH-15 — returns 403 when user does not have the required role', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { role: 'user' },
            error: null,
        });

        const middleware = requireRole('agent', 'influencer');
        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(403);
        expect(res._json.error).toContain('Requires one of');
        expect(res._json.currentRole).toBe('user');
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when profile is not found', async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { message: 'Not found' },
        });

        const middleware = requireRole('agent');
        const req = createMockReq({ id: 'nonexistent-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(403);
        expect(res._json.error).toBe('Forbidden: Profile not found');
    });

    it('returns 500 on unexpected exception', async () => {
        mockSingle.mockRejectedValueOnce(new Error('DB down'));

        const middleware = requireRole('agent');
        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(500);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// requirePlan
// ─────────────────────────────────────────────────────────────────────────────
describe('requirePlan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateProfileCache('test-user');
    });

    it('returns 401 when req.user is not set', async () => {
        const middleware = requirePlan('explorer');
        const req = createMockReq(null);
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(401);
    });

    it('calls next() when user has the required plan', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { plan: 'explorer' },
            error: null,
        });

        const middleware = requirePlan('explorer', 'custom');
        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userProfile.plan).toBe('explorer');
    });

    it('returns 403 when user does not have the required plan', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { plan: 'free' },
            error: null,
        });

        const middleware = requirePlan('explorer');
        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res._status).toBe(403);
        expect(res._json.currentPlan).toBe('free');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkGenerationQuota
// ─────────────────────────────────────────────────────────────────────────────
describe('checkGenerationQuota', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateProfileCache('test-user');
    });

    it('returns 401 when req.user is not set', async () => {
        const req = createMockReq(null);
        const res = createMockRes();
        const next = vi.fn();

        await checkGenerationQuota(req, res, next);

        expect(res._status).toBe(401);
    });

    it('calls next() when user is within quota', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 2,
                saves_used: 0,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkGenerationQuota(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userQuota.generationsUsed).toBe(2);
        expect(req.userQuota.maxGenerations).toBe(5);
    });

    it('returns 429 when generation quota is exceeded', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 5,
                saves_used: 0,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkGenerationQuota(req, res, next);

        expect(res._status).toBe(429);
        expect(res._json.error).toBe('Generation limit reached');
        expect(res._json.limit).toBe(5);
        expect(next).not.toHaveBeenCalled();
    });

    it('uses default max_generations (5) when plan_config is missing', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 4,
                saves_used: 0,
                plan: 'free',
                plan_config: null,
            },
            error: null,
        });

        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkGenerationQuota(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userQuota.maxGenerations).toBe(5); // default
    });

    it('returns 403 when profile is not found', async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { message: 'Not found' },
        });

        const req = createMockReq({ id: 'nonexistent' });
        const res = createMockRes();
        const next = vi.fn();

        await checkGenerationQuota(req, res, next);

        expect(res._status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkSaveQuota
// ─────────────────────────────────────────────────────────────────────────────
describe('checkSaveQuota', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateProfileCache('test-user');
    });

    it('allows save for anonymous users (no req.user)', async () => {
        const req = createMockReq(null);
        const res = createMockRes();
        const next = vi.fn();

        await checkSaveQuota(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('calls next() when save quota is within limit', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 0,
                saves_used: 0,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkSaveQuota(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userQuota.savesUsed).toBe(0);
        expect(req.userQuota.maxSaves).toBe(1);
    });

    it('returns 429 when save quota is exceeded', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 0,
                saves_used: 1,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req = createMockReq({ id: 'test-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkSaveQuota(req, res, next);

        expect(res._status).toBe(429);
        expect(res._json.error).toBe('Save limit reached');
        expect(next).not.toHaveBeenCalled();
    });

    it('allows save gracefully when profile not found', async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { message: 'Not found' },
        });

        const req = createMockReq({ id: 'ghost-user' });
        const res = createMockRes();
        const next = vi.fn();

        await checkSaveQuota(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// incrementGenerations & incrementSaves
// ─────────────────────────────────────────────────────────────────────────────
describe('incrementGenerations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls supabase rpc to increment generations_used', async () => {
        mockRpc.mockResolvedValueOnce({ error: null });

        await incrementGenerations('user-1');

        expect(mockRpc).toHaveBeenCalledWith('increment_field', {
            table_name: 'user_profiles',
            field_name: 'generations_used',
            row_user_id: 'user-1',
        });
    });

    it('falls back to manual update when rpc fails', async () => {
        mockRpc.mockResolvedValueOnce({ error: { message: 'RPC not found' } });
        mockSingle.mockResolvedValueOnce({
            data: { generations_used: 3 },
            error: null,
        });
        mockUpdateEq.mockResolvedValueOnce({ error: null });

        await incrementGenerations('user-2');

        // Should have called from().select() as fallback
        expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    });
});

describe('incrementSaves', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls supabase rpc to increment saves_used', async () => {
        mockRpc.mockResolvedValueOnce({ error: null });

        await incrementSaves('user-1');

        expect(mockRpc).toHaveBeenCalledWith('increment_field', {
            table_name: 'user_profiles',
            field_name: 'saves_used',
            row_user_id: 'user-1',
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// invalidateProfileCache
// ─────────────────────────────────────────────────────────────────────────────
describe('invalidateProfileCache', () => {
    it('clears cached profile so next check reads from DB', async () => {
        // First request — populates profile cache
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 0,
                saves_used: 0,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req1 = createMockReq({ id: 'cache-test-user' });
        const res1 = createMockRes();
        const next1 = vi.fn();
        await checkGenerationQuota(req1, res1, next1);

        // Invalidate cache
        invalidateProfileCache('cache-test-user');

        // Second request — should hit DB again
        mockSingle.mockResolvedValueOnce({
            data: {
                generations_used: 1,
                saves_used: 0,
                plan: 'free',
                plan_config: { max_generations: 5, max_saves: 1 },
            },
            error: null,
        });

        const req2 = createMockReq({ id: 'cache-test-user' });
        const res2 = createMockRes();
        const next2 = vi.fn();
        await checkGenerationQuota(req2, res2, next2);

        expect(req2.userQuota.generationsUsed).toBe(1); // Fresh from DB
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        ilike: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
        upsert: vi.fn(() => ({ then: vi.fn(cb => { cb({ error: null }); return { catch: vi.fn() }; }) })),
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

const mockGenerateTransportOptions = vi.fn();
const mockGenerateGeneralInfo = vi.fn();
const mockEstimateFlightDuration = vi.fn();
const mockGenerateAttractions = vi.fn();

vi.mock('../../../services/gemini.js', () => ({
    generateTransportOptions: mockGenerateTransportOptions,
    generateGeneralInfo: mockGenerateGeneralInfo,
    estimateFlightDuration: mockEstimateFlightDuration,
    generateAttractions: mockGenerateAttractions,
}));

const { default: router } = await import('../../../routes/transport.js');

// ── Helpers ─────────────────────────────────────────────────────────────────
function createReq(overrides = {}) {
    return { headers: {}, body: {}, query: {}, params: {}, ...overrides };
}

function createRes() {
    const res = {
        _status: 200, _json: null,
        status(c) { res._status = c; return res; },
        json(b) { res._json = b; return res; },
    };
    return res;
}

function getHandler(method, path) {
    const route = router.stack.find(l => l.route && l.route.path === path && l.route.methods[method]);
    return route.route.stack[route.route.stack.length - 1].handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /options
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /options', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when destination is missing', async () => {
        const handler = getHandler('post', '/options');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns transport options for valid destination', async () => {
        mockGenerateTransportOptions.mockResolvedValueOnce([{ type: 'bus', duration: '2h' }]);

        const handler = getHandler('post', '/options');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.options).toHaveLength(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /general-info
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /general-info', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when destination is missing', async () => {
        const handler = getHandler('post', '/general-info');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns cached info on DB hit', async () => {
        chainQueue.push(createChainedMock({
            data: { general_info: { visa: 'Not required', safety: 'Safe' } },
            error: null,
        }));

        const handler = getHandler('post', '/general-info');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.info.visa).toBe('Not required');
        expect(mockGenerateGeneralInfo).not.toHaveBeenCalled();
    });

    it('falls back to AI on cache miss', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116' } }));
        mockGenerateGeneralInfo.mockResolvedValueOnce({ visa: 'Required', safety: 'Moderate' });

        const handler = getHandler('post', '/general-info');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Madagascar' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.info.visa).toBe('Required');
        expect(mockGenerateGeneralInfo).toHaveBeenCalledWith('Madagascar');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /attractions
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /attractions', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when destination is missing', async () => {
        const handler = getHandler('post', '/attractions');
        const res = createRes();
        await handler(createReq({ body: {} }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns cached attractions on DB hit', async () => {
        chainQueue.push(createChainedMock({
            data: { attractions: [{ name: 'Eiffel Tower' }, { name: 'Louvre' }] },
            error: null,
        }));

        const handler = getHandler('post', '/attractions');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.attractions).toHaveLength(2);
        expect(mockGenerateAttractions).not.toHaveBeenCalled();
    });

    it('falls back to AI when cache has empty attractions', async () => {
        chainQueue.push(createChainedMock({ data: { attractions: [] }, error: null }));
        mockGenerateAttractions.mockResolvedValueOnce([{ name: 'Antananarivo Market' }]);

        const handler = getHandler('post', '/attractions');
        const res = createRes();
        await handler(createReq({ body: { destination: 'Madagascar' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(mockGenerateAttractions).toHaveBeenCalledWith('Madagascar');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /flight-estimates
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /flight-estimates', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns 400 when from or to is missing', async () => {
        const handler = getHandler('post', '/flight-estimates');
        const res = createRes();
        await handler(createReq({ body: { from: 'Delhi' } }), res, vi.fn());

        expect(res._status).toBe(400);
    });

    it('returns 3 flight slots (morning, afternoon, evening)', async () => {
        mockEstimateFlightDuration.mockResolvedValueOnce('2h 30m');

        const handler = getHandler('post', '/flight-estimates');
        const res = createRes();
        await handler(createReq({ body: { from: 'Delhi', to: 'Paris' } }), res, vi.fn());

        expect(res._status).toBe(200);
        expect(res._json.results).toHaveLength(3);
        expect(res._json.results[0].departure).toBe('06:00');
        expect(res._json.results[0].arrival).toBe('08:30');
        expect(res._json.results[1].departure).toBe('12:00');
        expect(res._json.results[2].departure).toBe('18:00');
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        from: vi.fn(() => chain),
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
    };
    return chain;
}

const mockRpc = vi.fn();
let chainQueue = [];

const mockSupabase = {
    rpc: mockRpc,
    from: vi.fn(() => chainQueue.length > 0 ? chainQueue.shift() : createChainedMock()),
};

vi.mock('../../../db/supabase.js', () => ({
    supabase: mockSupabase,
}));

const { searchSimilarItineraries, storeItinerary } = await import('../../../services/vectorService.js');

// ─────────────────────────────────────────────────────────────────────────────
// searchSimilarItineraries
// ─────────────────────────────────────────────────────────────────────────────
describe('searchSimilarItineraries', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('calls RPC with correct parameters and returns results', async () => {
        const mockData = [
            { id: 'itin-1', metadata: { destination: 'Paris' }, similarity: 0.9 },
        ];
        mockRpc.mockResolvedValueOnce({ data: mockData, error: null });

        const result = await searchSimilarItineraries([0.1, 0.2], 0.75, 3);

        expect(mockRpc).toHaveBeenCalledWith('match_itineraries', {
            query_embedding: [0.1, 0.2],
            match_threshold: 0.75,
            match_count: 3,
        });
        expect(result).toEqual(mockData);
    });

    it('uses default threshold and limit', async () => {
        mockRpc.mockResolvedValueOnce({ data: [], error: null });

        await searchSimilarItineraries([0.1]);

        expect(mockRpc).toHaveBeenCalledWith('match_itineraries', {
            query_embedding: [0.1],
            match_threshold: 0.7,
            match_count: 5,
        });
    });

    it('throws on RPC error', async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } });

        await expect(searchSimilarItineraries([0.1])).rejects.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// storeItinerary
// ─────────────────────────────────────────────────────────────────────────────
describe('storeItinerary', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('stores itinerary with extracted content string', async () => {
        const insertedData = { id: 'new-1', content: 'test' };
        chainQueue.push(createChainedMock({ data: insertedData, error: null }));

        const itinerary = {
            destination: 'Tokyo',
            days: [
                { theme: 'Culture', activities: [{ activity: 'Visit Shrine' }] },
            ],
        };

        const result = await storeItinerary(itinerary, [0.1, 0.2]);

        expect(result).toEqual(insertedData);
        expect(mockSupabase.from).toHaveBeenCalledWith('itineraries');
    });

    it('includes user_id when provided', async () => {
        const chain = createChainedMock({ data: { id: 'new-2' }, error: null });
        chainQueue.push(chain);

        const itinerary = { destination: 'Rome', days: [] };
        await storeItinerary(itinerary, [0.1], mockSupabase, 'user-123');

        // Verify insert was called (checking the chain was used)
        expect(chain.insert).toHaveBeenCalled();
    });

    it('throws on insert error', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { message: 'Insert failed' } }));

        const itinerary = { destination: 'X' };
        await expect(storeItinerary(itinerary, [0.1])).rejects.toThrow();
    });
});

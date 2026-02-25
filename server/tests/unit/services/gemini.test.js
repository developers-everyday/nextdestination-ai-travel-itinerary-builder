import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
// Must mock GoogleGenAI before importing gemini.js
const mockEmbedContent = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
            embedContent: mockEmbedContent,
            generateContent: mockGenerateContent,
        },
    })),
}));

vi.mock('../../../services/googleMaps.js', () => ({
    getPlaceCoordinates: vi.fn().mockResolvedValue({ lat: 48.8584, lng: 2.2945 }),
}));

process.env.GEMINI_API_KEY = 'fake-key';

const {
    generateEmbedding,
    generateQuickItinerary,
    searchActivitiesWithGemini,
    estimateFlightDuration,
    analyzeQuery,
    generateAttractions,
} = await import('../../../services/gemini.js');

// ─────────────────────────────────────────────────────────────────────────────
// generateEmbedding
// ─────────────────────────────────────────────────────────────────────────────
describe('generateEmbedding', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns embedding values from Gemini', async () => {
        mockEmbedContent.mockResolvedValueOnce({
            embeddings: [{ values: [0.1, 0.2, 0.3] }],
        });

        const result = await generateEmbedding('test text');

        expect(result).toEqual([0.1, 0.2, 0.3]);
        expect(mockEmbedContent).toHaveBeenCalledWith(expect.objectContaining({
            model: 'gemini-embedding-001',
            contents: 'test text',
        }));
    });

    it('throws on API error', async () => {
        mockEmbedContent.mockRejectedValueOnce(new Error('API error'));

        await expect(generateEmbedding('fail')).rejects.toThrow('API error');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateQuickItinerary
// ─────────────────────────────────────────────────────────────────────────────
describe('generateQuickItinerary', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns parsed itinerary with activity IDs injected', async () => {
        const mockItinerary = {
            destination: 'Paris',
            days: [
                {
                    day: 1, theme: 'Culture',
                    activities: [
                        { time: 'Morning', activity: 'Eiffel Tower', location: 'Champ de Mars', description: 'Visit', coordinates: [2.29, 48.86] },
                    ],
                },
            ],
        };

        mockGenerateContent.mockResolvedValueOnce({
            text: () => JSON.stringify(mockItinerary),
        });

        const result = await generateQuickItinerary('Paris', 1, ['culture']);

        expect(result.destination).toBe('Paris');
        expect(result.days).toHaveLength(1);
        // Check that IDs were injected
        expect(result.days[0].activities[0].id).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// searchActivitiesWithGemini
// ─────────────────────────────────────────────────────────────────────────────
describe('searchActivitiesWithGemini', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns parsed activity list', async () => {
        const mockActivities = [
            { name: 'Louvre', description: 'Art museum', location: 'Paris', type: 'landmark' },
        ];

        mockGenerateContent.mockResolvedValueOnce({
            text: () => JSON.stringify(mockActivities),
        });

        const result = await searchActivitiesWithGemini('museums', 'Paris');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Louvre');
    });

    it('returns empty array on error', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('API down'));

        const result = await searchActivitiesWithGemini('test', 'test');

        expect(result).toEqual([]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// estimateFlightDuration
// ─────────────────────────────────────────────────────────────────────────────
describe('estimateFlightDuration', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns trimmed duration string', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            candidates: [{ content: { parts: [{ text: '  2h 15m  ' }] } }],
        });

        const result = await estimateFlightDuration('Delhi', 'Paris');

        expect(result).toBe('2h 15m');
    });

    it('returns N/A on error', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('Timeout'));

        const result = await estimateFlightDuration('A', 'B');

        expect(result).toBe('N/A');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// analyzeQuery
// ─────────────────────────────────────────────────────────────────────────────
describe('analyzeQuery', () => {
    beforeEach(() => vi.clearAllMocks());

    it('parses travel intent from AI response', async () => {
        const mockResponse = {
            destination: 'Bali',
            days: 7,
            interests: ['surfing'],
            intent: 'generate_itinerary',
            response: 'Great choice!',
        };

        mockGenerateContent.mockResolvedValueOnce({
            text: () => JSON.stringify(mockResponse),
        });

        const result = await analyzeQuery('I want to surf in Bali');

        expect(result.destination).toBe('Bali');
        expect(result.intent).toBe('generate_itinerary');
    });

    it('returns fallback on error', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('down'));

        const result = await analyzeQuery('test');

        expect(result.intent).toBe('continue_chat');
        expect(result.destination).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateAttractions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateAttractions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns parsed attractions list', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            candidates: [{ content: { parts: [{ text: '["Eiffel Tower", "Louvre", "Seine Cruise"]' }] } }],
        });

        const result = await generateAttractions('Paris');

        expect(result).toHaveLength(3);
        expect(result).toContain('Eiffel Tower');
    });

    it('returns fallback list on error', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('API error'));

        const result = await generateAttractions('Unknown');

        expect(result).toContain('Local Food Tour');
        expect(result.length).toBeGreaterThan(0);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ───────────────────────────────────────────────────────
function createChainedMock(resolves = { data: null, error: null }) {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(resolves)),
        upsert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        then: vi.fn((cb) => { cb({}); return { catch: vi.fn() }; }),
    };
    return chain;
}

let chainQueue = [];
const mockFrom = vi.fn(() => chainQueue.length > 0 ? chainQueue.shift() : createChainedMock());

vi.mock('../../../db/supabase.js', () => ({
    supabase: { from: mockFrom },
}));

// We need to handle the setInterval in templateService — fake timers
vi.useFakeTimers();

const {
    createJob,
    updateJobDay,
    completeJob,
    failJob,
    getJobStatus,
    normalizeDestination,
    lookupTemplate,
    populateTemplateCache,
} = await import('../../../services/templateService.js');

// ─────────────────────────────────────────────────────────────────────────────
// normalizeDestination
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeDestination', () => {
    it('lowercases and trims destination', () => {
        expect(normalizeDestination('  Paris  ')).toBe('paris');
    });

    it('collapses multiple spaces', () => {
        expect(normalizeDestination('New  York   City')).toBe('new york city');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Job lifecycle (createJob, updateJobDay, completeJob, failJob, getJobStatus)
// ─────────────────────────────────────────────────────────────────────────────
describe('Job lifecycle', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('createJob initializes a processing job', () => {
        const job = createJob('job-1', 3);

        expect(job.status).toBe('processing');
        expect(job.totalDays).toBe(3);
        expect(job.completedDays).toEqual([]);
    });

    it('updateJobDay adds a day and auto-completes when all days done', () => {
        createJob('job-2', 2);

        updateJobDay('job-2', { day: 1, activities: [] });
        const result = updateJobDay('job-2', { day: 2, activities: [] });

        expect(result.completedDays).toHaveLength(2);
        expect(result.status).toBe('complete');
    });

    it('updateJobDay returns null for unknown job', () => {
        expect(updateJobDay('ghost', {})).toBeNull();
    });

    it('completeJob sets status and itinerary', () => {
        createJob('job-3', 1);
        const result = completeJob('job-3', { destination: 'Paris' });

        expect(result.status).toBe('complete');
        expect(result.itinerary.destination).toBe('Paris');
    });

    it('failJob sets error status', () => {
        createJob('job-4', 1);
        const result = failJob('job-4', 'AI timeout');

        expect(result.status).toBe('error');
        expect(result.error).toBe('AI timeout');
    });

    it('getJobStatus returns L1 cached job', async () => {
        createJob('job-5', 2);
        completeJob('job-5', { destination: 'Rome' });

        const status = await getJobStatus('job-5');

        expect(status.status).toBe('complete');
        expect(status.itinerary.destination).toBe('Rome');
    });

    it('getJobStatus falls back to DB for unknown L1 job', async () => {
        // DB returns a completed job
        chainQueue.push(createChainedMock({
            data: { status: 'complete', total_days: 3, itinerary: { destination: 'Tokyo' }, error_msg: null },
            error: null,
        }));

        const status = await getJobStatus('unknown-job');

        expect(status.status).toBe('complete');
        expect(status.itinerary.destination).toBe('Tokyo');
    });

    it('getJobStatus returns not_found when both L1 and L2 miss', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116' } }));

        const status = await getJobStatus('totally-unknown');

        expect(status.status).toBe('not_found');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// lookupTemplate
// ─────────────────────────────────────────────────────────────────────────────
describe('lookupTemplate', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('returns template data on cache hit', async () => {
        const templateChain = createChainedMock({
            data: {
                id: 'tmpl-1',
                itinerary_data: { destination: 'Paris' },
                quality_score: 0.8,
                use_count: 5,
                updated_at: new Date().toISOString(), // fresh
            },
            error: null,
        });
        // lookupTemplate also does a fire-and-forget update for use_count
        templateChain.then = vi.fn((cb) => { cb(); return { catch: vi.fn() }; });
        chainQueue.push(templateChain);

        const result = await lookupTemplate('Paris', 3);

        expect(result).toBeDefined();
        expect(result.itinerary_data.destination).toBe('Paris');
    });

    it('returns null on cache miss', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { code: 'PGRST116' } }));

        const result = await lookupTemplate('Atlantis', 5);

        expect(result).toBeNull();
    });

    it('returns null for stale cache (> 30 days old)', async () => {
        const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
        chainQueue.push(createChainedMock({
            data: { id: 'old', itinerary_data: {}, quality_score: 0.5, use_count: 1, updated_at: staleDate },
            error: null,
        }));

        const result = await lookupTemplate('OldCity', 3);

        expect(result).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// populateTemplateCache
// ─────────────────────────────────────────────────────────────────────────────
describe('populateTemplateCache', () => {
    beforeEach(() => { vi.clearAllMocks(); chainQueue = []; });

    it('upserts template data successfully', async () => {
        chainQueue.push(createChainedMock({
            data: { id: 'tmpl-new', destination: 'Tokyo' },
            error: null,
        }));

        const result = await populateTemplateCache('Tokyo', 5, { destination: 'Tokyo' });

        expect(result).toBeDefined();
        expect(mockFrom).toHaveBeenCalledWith('itinerary_templates');
    });

    it('returns null on upsert error', async () => {
        chainQueue.push(createChainedMock({ data: null, error: { message: 'constraint violation' } }));

        const result = await populateTemplateCache('X', 1, {});

        expect(result).toBeNull();
    });
});

// Restore real timers
vi.useRealTimers();

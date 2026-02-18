import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

// ============================================================
// Dual-layer async job store
//
// L1 — In-memory Map  : fast reads for same-process polling (common case)
// L2 — Supabase table : survives restarts, works across multiple processes
//
// Requires migration 013_async_jobs.sql to be run in Supabase first.
// If the table is unavailable the system falls back to L1-only gracefully.
// ============================================================

const jobStore = new Map();        // L1 cache
const JOB_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── DB helpers (fire-and-forget; never throw to caller) ─────────────────────

const dbUpsertJob = (id, fields) => {
    supabase.from('async_jobs').upsert({ id, ...fields }, { onConflict: 'id' })
        .then(() => {})
        .catch(err => console.error('[JobStore] DB write failed:', err));
};

const dbReadJob = async (jobId) => {
    try {
        const { data, error } = await supabase
            .from('async_jobs')
            .select('status, total_days, itinerary, error_msg')
            .eq('id', jobId)
            .single();
        return (error || !data) ? null : data;
    } catch (_) {
        return null;
    }
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new async generation job (L1 write + L2 background write)
 */
export const createJob = (jobId, totalDays) => {
    const job = {
        status: 'processing',
        totalDays,
        completedDays: [],
        itinerary: null,
        error: null,
        createdAt: Date.now()
    };
    jobStore.set(jobId, job);
    dbUpsertJob(jobId, { status: 'processing', total_days: totalDays });
    return job;
};

/**
 * Update job with a completed day (L1 only — polled frequently, DB update unneeded)
 */
export const updateJobDay = (jobId, dayData) => {
    const job = jobStore.get(jobId);
    if (!job) return null;

    job.completedDays.push(dayData);
    if (job.completedDays.length >= job.totalDays) {
        job.status = 'complete';
    }
    return job;
};

/**
 * Mark job as complete with full itinerary (L1 + L2)
 */
export const completeJob = (jobId, itinerary) => {
    const job = jobStore.get(jobId);
    if (job) {
        job.status = 'complete';
        job.itinerary = itinerary;
    }
    dbUpsertJob(jobId, { status: 'complete', itinerary });
    return job;
};

/**
 * Mark job as failed (L1 + L2)
 */
export const failJob = (jobId, errorMsg) => {
    const job = jobStore.get(jobId);
    if (job) {
        job.status = 'error';
        job.error = errorMsg;
    }
    dbUpsertJob(jobId, { status: 'error', error_msg: errorMsg });
    return job;
};

/**
 * Get job status — checks L1 first, falls back to L2 (cross-process / post-restart)
 */
export const getJobStatus = async (jobId) => {
    // Fast path: in-memory (same process)
    const job = jobStore.get(jobId);
    if (job) {
        return {
            status: job.status,
            totalDays: job.totalDays,
            completedDays: job.completedDays,
            itinerary: job.itinerary || null,
            error: job.error
        };
    }

    // Slow path: DB lookup (different process or after restart)
    const dbJob = await dbReadJob(jobId);
    if (!dbJob) {
        return { status: 'not_found', error: 'Job not found or expired' };
    }

    // Re-hydrate L1 so subsequent polls are fast
    jobStore.set(jobId, {
        status: dbJob.status,
        totalDays: dbJob.total_days,
        completedDays: [],
        itinerary: dbJob.itinerary || null,
        error: dbJob.error_msg || null,
        createdAt: Date.now()
    });

    return {
        status: dbJob.status,
        totalDays: dbJob.total_days,
        completedDays: [],
        itinerary: dbJob.itinerary || null,
        error: dbJob.error_msg || null
    };
};

// ── L1 Cleanup: purge expired entries from memory every 10 minutes ──────────
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobStore.entries()) {
        if (now - job.createdAt > JOB_TTL_MS) jobStore.delete(id);
    }
}, 10 * 60 * 1000);


// ============================================================
// Template Cache (Supabase itinerary_templates table)
// ============================================================

/**
 * Normalize destination string for consistent cache lookups
 */
export const normalizeDestination = (destination) => {
    return destination.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Lookup a cached itinerary template by destination + duration
 * Returns null if no match found or cache is stale (>30 days)
 */
export const lookupTemplate = async (destination, durationDays, tripType = 'general') => {
    const normalized = normalizeDestination(destination);

    try {
        const { data, error } = await supabase
            .from('itinerary_templates')
            .select('id, itinerary_data, quality_score, use_count, updated_at')
            .eq('destination_normalized', normalized)
            .eq('duration_days', durationDays)
            .eq('trip_type', tripType)
            .single();

        if (error || !data) {
            return null;
        }

        // Check staleness (30 day TTL)
        const updatedAt = new Date(data.updated_at);
        const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 30) {
            console.log(`[TemplateCache] Stale cache for "${normalized}" (${daysSinceUpdate.toFixed(0)}d old), skipping`);
            return null;
        }

        // Increment use_count in background (fire-and-forget)
        supabase
            .from('itinerary_templates')
            .update({ use_count: (data.use_count || 0) + 1 })
            .eq('id', data.id)
            .then(() => console.log(`[TemplateCache] Incremented use_count for ${data.id}`))
            .catch(err => console.error(`[TemplateCache] Failed to increment use_count:`, err));

        console.log(`[TemplateCache] HIT for "${normalized}" ${durationDays}d (used ${data.use_count + 1} times)`);
        return data;

    } catch (err) {
        console.error('[TemplateCache] Lookup error:', err);
        return null;
    }
};

/**
 * Store or update a template in the cache after successful AI generation
 * Uses upsert on the UNIQUE constraint (destination_normalized, duration_days, trip_type)
 */
export const populateTemplateCache = async (destination, durationDays, itineraryData, tripType = 'general') => {
    const normalized = normalizeDestination(destination);

    try {
        const { data, error } = await supabase
            .from('itinerary_templates')
            .upsert({
                destination: destination,
                destination_normalized: normalized,
                duration_days: durationDays,
                trip_type: tripType,
                itinerary_data: itineraryData,
                quality_score: 0.5, // Default quality, increase with usage
                use_count: 1
            }, {
                onConflict: 'destination_normalized,duration_days,trip_type'
            })
            .select()
            .single();

        if (error) {
            console.error('[TemplateCache] Populate error:', error);
            return null;
        }

        console.log(`[TemplateCache] Cached template for "${normalized}" ${durationDays}d (id: ${data.id})`);
        return data;

    } catch (err) {
        console.error('[TemplateCache] Populate exception:', err);
        return null;
    }
};

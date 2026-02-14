import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

// ============================================================
// In-memory job store for async generation progress tracking
// In production, this should be Redis or a DB table
// ============================================================
const jobStore = new Map();

// Job TTL: 30 minutes
const JOB_TTL_MS = 30 * 60 * 1000;

/**
 * Create a new async generation job
 */
export const createJob = (jobId, totalDays) => {
    jobStore.set(jobId, {
        status: 'processing',
        totalDays,
        completedDays: [],
        destination: null,
        error: null,
        createdAt: Date.now()
    });
    return jobStore.get(jobId);
};

/**
 * Update job with a completed day
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
 * Mark job as complete with full itinerary
 */
export const completeJob = (jobId, itinerary) => {
    const job = jobStore.get(jobId);
    if (!job) return null;

    job.status = 'complete';
    job.itinerary = itinerary;
    return job;
};

/**
 * Mark job as failed
 */
export const failJob = (jobId, error) => {
    const job = jobStore.get(jobId);
    if (!job) return null;

    job.status = 'error';
    job.error = error;
    return job;
};

/**
 * Get job status
 */
export const getJobStatus = (jobId) => {
    const job = jobStore.get(jobId);
    if (!job) {
        return { status: 'not_found', error: 'Job not found or expired' };
    }
    return {
        status: job.status,
        totalDays: job.totalDays,
        completedDays: job.completedDays,
        itinerary: job.itinerary || null,
        error: job.error
    };
};

// Cleanup expired jobs every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobStore.entries()) {
        if (now - job.createdAt > JOB_TTL_MS) {
            jobStore.delete(id);
        }
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

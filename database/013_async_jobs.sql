-- ============================================================
-- Migration 013: Persistent async job store
-- Replaces the in-memory Map in templateService.js so that:
--   1. Jobs survive server restarts
--   2. Jobs work correctly when running multiple server processes
--
-- Run this in the Supabase SQL Editor before deploying the
-- updated templateService.js
-- ============================================================

CREATE TABLE IF NOT EXISTS async_jobs (
    id          TEXT        PRIMARY KEY,
    status      TEXT        NOT NULL DEFAULT 'processing'
                            CHECK (status IN ('processing', 'complete', 'error')),
    total_days  INTEGER     NOT NULL,
    itinerary   JSONB,
    error_msg   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-delete jobs older than 1 hour to keep the table lean
-- (cron.job requires pg_cron extension — if unavailable, the application-level
--  cleanup in templateService.js handles TTL instead)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'cleanup-async-jobs',
            '*/30 * * * *',   -- every 30 minutes
            $$DELETE FROM async_jobs WHERE created_at < NOW() - INTERVAL '1 hour'$$
        );
    END IF;
END;
$$;

-- Index for the status-polling query (GET /api/suggestions/status/:jobId)
CREATE INDEX IF NOT EXISTS idx_async_jobs_created_at ON async_jobs (created_at);

-- RLS: these are internal server records — block direct client access
ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses RLS entirely; deny everything else
CREATE POLICY "deny_all_client_access" ON async_jobs
    AS RESTRICTIVE
    FOR ALL
    USING (false);

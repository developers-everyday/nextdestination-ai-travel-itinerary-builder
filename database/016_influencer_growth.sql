-- ============================================================
-- Migration 016: Influencer Growth Plan — Schema Additions
-- ============================================================
-- Adds:
--   1. status column on itineraries (pending / ready / error)
--   2. view_count and remix_count on itineraries
-- ============================================================

-- 1. Status column (default 'ready' so all existing rows are unaffected)
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('pending', 'ready', 'error'));

-- 2. Analytics counters
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS remix_count INTEGER NOT NULL DEFAULT 0;

-- Index for filtering by status (e.g. trending query should exclude pending)
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries (status);

-- ============================================================
-- Migration 014: Missing indexes on the itineraries table
--
-- Migration 003 already added idx_itineraries_destination for
-- (metadata->>'destination'). This migration adds the remaining
-- indexes that are hit by the current query patterns.
--
-- Run this in the Supabase SQL Editor.
-- All statements use IF NOT EXISTS so they are safe to re-run.
-- ============================================================

-- 1. is_public column — used by every trending query:
--    WHERE is_public = true
--    Without this, Postgres does a full sequential scan of the table for
--    every community browse request.
CREATE INDEX IF NOT EXISTS idx_itineraries_is_public
    ON itineraries (is_public);

-- 2. user_id column — used by the my-trips query and RLS policies:
--    WHERE user_id = $1  (RLS: auth.uid() = user_id)
--    Also used heavily by Supabase's own RLS enforcement on every write.
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id
    ON itineraries (user_id);

-- 3. metadata->>'category' expression index — used by the trending
--    category filter:  WHERE metadata->>'category' = $1
--    Without this, every category filter is a full table scan on JSONB.
CREATE INDEX IF NOT EXISTS idx_itineraries_category
    ON itineraries ((metadata->>'category'));

-- 4. Composite index for the most common trending query pattern:
--    WHERE is_public = true ORDER BY id DESC
--    Postgres can satisfy this with an index-only scan instead of
--    fetching all public rows and then sorting.
CREATE INDEX IF NOT EXISTS idx_itineraries_public_id
    ON itineraries (is_public, id DESC)
    WHERE is_public = true;

-- =====================================================
-- Migration 009: Itinerary Template Cache
-- Purpose: Fast lookup of pre-generated itineraries
--          keyed by (destination, duration_days, trip_type)
-- =====================================================

-- Cache table for pre-generated itinerary templates
CREATE TABLE IF NOT EXISTS itinerary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    destination_normalized TEXT NOT NULL,  -- lowercase, trimmed for consistent lookups
    duration_days INTEGER NOT NULL,
    trip_type TEXT DEFAULT 'general',      -- solo, couple, family, general
    itinerary_data JSONB NOT NULL,         -- full itinerary JSON (same shape as Gemini output)
    quality_score REAL DEFAULT 0.0,        -- 0-1 score based on usage/feedback
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(destination_normalized, duration_days, trip_type)
);

-- Composite index for the primary lookup pattern
CREATE INDEX IF NOT EXISTS idx_templates_lookup
ON itinerary_templates(destination_normalized, duration_days, trip_type);

-- Index for cache invalidation queries (find old entries)
CREATE INDEX IF NOT EXISTS idx_templates_updated_at
ON itinerary_templates(updated_at);

-- Trigger to auto-update updated_at (reuses function from 008)
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON itinerary_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE itinerary_templates ENABLE ROW LEVEL SECURITY;

-- Public read access (templates are shared resources)
DROP POLICY IF EXISTS "Public read for templates" ON itinerary_templates;
CREATE POLICY "Public read for templates" ON itinerary_templates
FOR SELECT USING (true);

-- Insert for authenticated users (backend populates these after AI generation)
DROP POLICY IF EXISTS "Insert for authenticated" ON itinerary_templates;
CREATE POLICY "Insert for authenticated" ON itinerary_templates
FOR INSERT WITH CHECK (true);

-- Update for authenticated users (increment use_count, update quality_score)
DROP POLICY IF EXISTS "Update for authenticated" ON itinerary_templates;
CREATE POLICY "Update for authenticated" ON itinerary_templates
FOR UPDATE USING (true);

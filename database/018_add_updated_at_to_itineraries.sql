-- Migration: Add updated_at column to itineraries table
-- The admin panel references updated_at for image removal & metadata updates,
-- but the column was never added to the itineraries table.

ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Back-fill existing rows so updated_at is not null
UPDATE itineraries SET updated_at = NOW() WHERE updated_at IS NULL;

-- Auto-update trigger (reuses function from 008_create_destinations_table)
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add attractions column to existing destinations table
ALTER TABLE destinations
ADD COLUMN IF NOT EXISTS attractions JSONB;

-- Add UPDATE policy (needed for upsert write-back when attractions are cached)
DROP POLICY IF EXISTS "Enable update for all users" ON destinations;
CREATE POLICY "Enable update for all users"
ON destinations FOR UPDATE
USING (true)
WITH CHECK (true);

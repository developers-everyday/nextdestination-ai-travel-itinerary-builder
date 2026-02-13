-- Create a table to store general information for destinations
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    general_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by name
CREATE INDEX IF NOT EXISTS idx_destinations_name ON destinations(name);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached info is generic and public)
DROP POLICY IF EXISTS "Public read access for destinations" ON destinations;
CREATE POLICY "Public read access for destinations"
ON destinations FOR SELECT
USING (true);

-- Allow authenticated users to insert (for now, simpler than service role for background tasks)
-- In a production environment, we'd use service role for background updates.
DROP POLICY IF EXISTS "Enable insert for all users" ON destinations;
CREATE POLICY "Enable insert for all users"
ON destinations FOR INSERT
WITH CHECK (true);

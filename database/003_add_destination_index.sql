-- Create an index on the destination field within the metadata JSONB column
-- This improves performance when filtering trending trips by destination
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries ((metadata->>'destination'));

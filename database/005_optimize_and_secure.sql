-- Enable Row Level Security (RLS) on tables
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY; -- Fixes lint for wishlists

-- Create permissive policies for 'itineraries'
-- Note: These are permissive because the backend currently connects as an anonymous user (missing service role key).
-- We need to allow operations to continue working. 
-- Ideally, the backend should use a Service Role Key to bypass RLS, allowing us to restrict these policies further.

DROP POLICY IF EXISTS "Enable read access for all users" ON itineraries;
CREATE POLICY "Enable read access for all users" 
ON itineraries FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON itineraries;
CREATE POLICY "Enable insert access for all users" 
ON itineraries FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON itineraries;
CREATE POLICY "Enable update access for all users" 
ON itineraries FOR UPDATE 
USING (true);

-- Create permissive policies for 'activities'
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
CREATE POLICY "Enable read access for all users" 
ON activities FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON activities;
CREATE POLICY "Enable insert access for all users" 
ON activities FOR INSERT 
WITH CHECK (true);

-- Create permissive policies for 'wishlists' (New addition)
-- Ensures the backend can still function (authenticate users, etc.) without service role key
DROP POLICY IF EXISTS "Enable read access for all users" ON wishlists;
CREATE POLICY "Enable read access for all users" 
ON wishlists FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON wishlists;
CREATE POLICY "Enable insert access for all users" 
ON wishlists FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON wishlists;
CREATE POLICY "Enable delete access for all users" 
ON wishlists FOR DELETE 
USING (true);

-- Create indexes to improve performance based on slow query logs

-- 1. Index for filtering activities by destination
-- This was identified as a slow query in: "SELECT ... FROM activities WHERE destination = $1 ..."
CREATE INDEX IF NOT EXISTS idx_activities_destination ON activities(destination);

-- 2. Index for wishlists by user_id
-- This optimizes fetching a user's wishlist: "SELECT ... FROM wishlists WHERE user_id = $1 ..."
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- 3. Index for wishlists by itinerary_id (FK mostly, but good for lookups/joins)
CREATE INDEX IF NOT EXISTS idx_wishlists_itinerary_id ON wishlists(itinerary_id);

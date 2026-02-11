-- Add user_id and is_public columns
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for user_id to speed up "My Trips" queries
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);

-- Update RLS Policies

-- 1. Read Access:
-- Public itineraries are visible to everyone.
-- Private itineraries are only visible to their creator (user_id matches auth.uid())
DROP POLICY IF EXISTS "Enable read access for all users" ON itineraries;
CREATE POLICY "Enable read access for public or own itineraries" 
ON itineraries FOR SELECT 
USING (
  is_public = true 
  OR 
  (auth.uid() = user_id)
);

-- 2. Insert Access:
-- Authenticated users can insert their own rows.
-- Anonymous inserts might currently be allowed, but we should prefer authenticated.
-- Keeping permissive for now if needed, but ideally:
DROP POLICY IF EXISTS "Enable insert access for all users" ON itineraries;
CREATE POLICY "Enable insert access for authenticated users" 
ON itineraries FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  user_id IS NULL -- Maintain backward compatibility if needed for anon users
);

-- 3. Update Access:
-- Only the owner can update their itinerary.
DROP POLICY IF EXISTS "Enable update access for all users" ON itineraries;
CREATE POLICY "Enable update access for owners" 
ON itineraries FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Delete Access:
-- Only the owner can delete their itinerary.
CREATE POLICY "Enable delete access for owners" 
ON itineraries FOR DELETE 
USING (auth.uid() = user_id);

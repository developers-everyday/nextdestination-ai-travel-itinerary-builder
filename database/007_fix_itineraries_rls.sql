-- Fix RLS Policy for Itineraries (Strict Auth)

-- 1. Drop existing/conflicting policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON itineraries;
DROP POLICY IF EXISTS "Enable insert access for all users" ON itineraries;
DROP POLICY IF EXISTS "Enable insert for authenticated and anonymous" ON itineraries;

-- 2. Create STRICT policy: Only authenticated users can insert their own rows
CREATE POLICY "Enable insert for authenticated users only" 
ON itineraries FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

-- 3. Ensure Read policy supports this
DROP POLICY IF EXISTS "Enable read access for public or own itineraries" ON itineraries;
CREATE POLICY "Enable read access for public or own itineraries" 
ON itineraries FOR SELECT 
USING (
  is_public = true 
  OR 
  (auth.uid() = user_id)
);

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your itineraries
create table if not exists itineraries (
  id uuid primary key,
  content text, -- Text representation for search
  metadata jsonb, -- structured data like destination, tags
  embedding vector(768) -- Gemini embeddings are 768 dimensions
);

-- Create a function to search for itineraries
create or replace function match_itineraries (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    itineraries.id,
    itineraries.content,
    itineraries.metadata,
    1 - (itineraries.embedding <=> query_embedding) as similarity
  from itineraries
  where 1 - (itineraries.embedding <=> query_embedding) > match_threshold
  order by itineraries.embedding <=> query_embedding
  limit match_count;
end;
$$;
-- Create a table to store individual activities/places
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  name text not null,
  description text,
  location text,
  coordinates jsonb, -- e.g. { "lat": 48.8584, "lng": 2.2945 }
  metadata jsonb, -- e.g. { "price": "$20", "rating": 4.5, "image": "url", "type": "activity" }
  embedding vector(768), -- Gemini embeddings dimensions
  created_at timestamp with time zone default now()
);

-- Index for faster vector similarity search
create index on activities using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Function to search for similar activities within a destination
create or replace function match_activities (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_destination text default null
)
returns table (
  id uuid,
  name text,
  description text,
  location text,
  coordinates jsonb,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    activities.id,
    activities.name,
    activities.description,
    activities.location,
    activities.coordinates,
    activities.metadata,
    1 - (activities.embedding <=> query_embedding) as similarity
  from activities
  where 1 - (activities.embedding <=> query_embedding) > match_threshold
  and (filter_destination is null or activities.destination ilike filter_destination)
  order by activities.embedding <=> query_embedding
  limit match_count;
end;
$$;
-- Create an index on the destination field within the metadata JSONB column
-- This improves performance when filtering trending trips by destination
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries ((metadata->>'destination'));
-- Create wishlists table to store user bucket lists
create table if not exists wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  itinerary_id uuid references itineraries(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, itinerary_id)
);

-- Enable RLS
alter table wishlists enable row level security;

-- Policies
create policy "Users can view their own wishlist"
  on wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own wishlist"
  on wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlist"
  on wishlists for delete
  using (auth.uid() = user_id);
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
-- Create a new storage bucket for itinerary images
insert into storage.buckets (id, name, public)
values ('itinerary-images', 'itinerary-images', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'itinerary-images' );

-- Allow authenticated users (and service role) to upload
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'itinerary-images' );

-- Allow users to update/delete their own files (optional, but good for cleanup)
-- For now, we mainly rely on backend admin/service role for management
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

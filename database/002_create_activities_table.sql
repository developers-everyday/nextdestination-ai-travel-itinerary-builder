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

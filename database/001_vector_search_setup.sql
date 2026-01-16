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

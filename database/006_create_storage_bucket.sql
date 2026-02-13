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

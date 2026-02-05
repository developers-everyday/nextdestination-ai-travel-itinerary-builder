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

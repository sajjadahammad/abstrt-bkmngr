-- Create collections table
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'folder',
  color text default '#6366f1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.collections enable row level security;

create policy "collections_select_own" on public.collections for select using (auth.uid() = user_id);
create policy "collections_insert_own" on public.collections for insert with check (auth.uid() = user_id);
create policy "collections_update_own" on public.collections for update using (auth.uid() = user_id);
create policy "collections_delete_own" on public.collections for delete using (auth.uid() = user_id);

-- Create bookmarks table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  title text not null,
  url text not null,
  description text,
  favicon_url text,
  og_image_url text,
  tags text[] default '{}',
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_update_own" on public.bookmarks for update using (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = user_id);

-- Enable realtime for bookmarks and collections
alter publication supabase_realtime add table public.bookmarks;
alter publication supabase_realtime add table public.collections;

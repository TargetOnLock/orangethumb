-- Run this in Supabase: SQL Editor → New query → Run

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Server uses service role key (bypasses RLS). Block anonymous DB access.
create policy "no public site_content access"
  on public.site_content
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- Storage bucket "media" must be created in Dashboard → Storage.
-- Set it to Public so image URLs work on the storefront.

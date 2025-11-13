-- Supabase SQL: tables + example RLS policies
-- Run these in the Supabase SQL editor (or via psql) to create tables and policies.

-- Tables (same structure as local migrations)
create table if not exists public.attempts (
  id bigserial primary key,
  bank text,
  user_email text,
  score integer,
  answers jsonb,
  created_at timestamptz default now()
);

create table if not exists public.ranking (
  id bigserial primary key,
  name text not null,
  score integer not null,
  bank text,
  user_email text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.attempts enable row level security;
alter table public.ranking enable row level security;

-- Policies for attempts:
-- Allow authenticated users to insert attempts where user_email matches their JWT email
create policy "insert_own_attempts" on public.attempts
  for insert
  with check ( (auth.role() = 'authenticated' and new.user_email = (auth.jwt() ->> 'email'))
               or (auth.role() = 'service_role') );

-- Allow users to select their own attempts
create policy "select_own_attempts" on public.attempts
  for select
  using ( (auth.role() = 'authenticated' and user_email = (auth.jwt() ->> 'email'))
          or (auth.role() = 'service_role') );

-- Optionally allow anonymous read for audit (uncomment if desired)
-- create policy "public_select_attempts" on public.attempts for select using (true);

-- Policies for ranking:
-- Allow authenticated users to insert ranking entries
create policy "insert_ranking_authenticated" on public.ranking
  for insert
  with check ( (auth.role() = 'authenticated' and new.user_email = (auth.jwt() ->> 'email'))
               or (auth.role() = 'service_role') );

-- Allow public select on ranking so leaderboard is visible to everyone
create policy "public_select_ranking" on public.ranking
  for select
  using ( true );

-- Notes:
-- 1) In Supabase, `auth.jwt() ->> 'email'` extracts the email claim from the user's JWT.
-- 2) Service role (`service_role`) is typically used by server-side processes with the service key.
-- 3) Adjust policies to your needs: allow admins, restrict updates/deletes, etc.

-- Tuntas persistent state
--
-- Run this once in Supabase Dashboard -> SQL Editor.
-- The server uses SUPABASE_SERVICE_ROLE_KEY and writes through PostgREST.
--
-- The app stores its small relational snapshot as one JSONB document. Writes
-- carry an incrementing `version`, so two devices cannot silently overwrite
-- each other. RLS is enabled with no public policy: only the service role
-- (server-side) can read or write this table.

create table if not exists public.tuntas_state (
  id text primary key,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.tuntas_state enable row level security;

comment on table public.tuntas_state is
  'Tuntas application state. Managed by the Next.js server using the service role key.';

-- Run this once in Supabase: SQL Editor → New query → paste → Run.
create table if not exists kv (
  key text primary key,
  value jsonb not null
);

-- Lock the table down. Only the app's server (using the service role key) can read or write it.
alter table kv enable row level security;

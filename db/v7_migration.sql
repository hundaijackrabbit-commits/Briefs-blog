-- Briefs.blog V7: Query Intelligence, Finance & Change Routing
create extension if not exists pgcrypto;

create table if not exists query_intent_observations (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  domain text not null,
  intent text not null,
  entity_query text not null,
  ticker_hint text,
  effective_perspective text not null,
  freshness text not null,
  source_policy text,
  depth text,
  created_at timestamptz not null default now()
);
create index if not exists query_intent_observations_created_idx on query_intent_observations(created_at desc);
create index if not exists query_intent_observations_intent_idx on query_intent_observations(intent,created_at desc);

create table if not exists market_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  provider text not null,
  price numeric,
  change_value numeric,
  change_percent text,
  volume bigint,
  market_date date,
  observed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(ticker,provider,market_date,price)
);
create index if not exists market_snapshots_ticker_idx on market_snapshots(ticker,observed_at desc);

create table if not exists observed_changes (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  change_type text not null,
  summary text not null,
  source_url text,
  source_family text,
  event_at timestamptz,
  observed_at timestamptz not null default now(),
  importance integer not null default 50 check (importance between 0 and 100),
  status text not null default 'candidate' check (status in ('candidate','accepted','rejected','merged','published')),
  fingerprint text not null unique,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists observed_changes_subject_idx on observed_changes(lower(subject),observed_at desc);
create index if not exists observed_changes_status_idx on observed_changes(status,importance desc,observed_at desc);

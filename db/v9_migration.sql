-- Briefs.blog V9: Authority, Distribution, Email Delivery & Public API
create extension if not exists pgcrypto;

alter table reader_notifications add column if not exists email_sent_at timestamptz;

create table if not exists distribution_deliveries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references reader_accounts(id) on delete cascade,
  channel text not null check (channel in ('email','feed','export','api')),
  destination text,
  fingerprint text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(channel,account_id,fingerprint)
);
create index if not exists distribution_deliveries_status_idx on distribution_deliveries(channel,status,created_at desc);
create index if not exists distribution_deliveries_account_idx on distribution_deliveries(account_id,created_at desc);

create table if not exists public_api_observations (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  depth text not null,
  perspective text not null,
  source_policy text,
  result_confidence text,
  source_count integer not null default 0,
  research_needed boolean not null default false,
  observed_at timestamptz not null default now()
);
create index if not exists public_api_observations_observed_idx on public_api_observations(observed_at desc);

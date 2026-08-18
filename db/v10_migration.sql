-- Briefs.blog V10: MVP Completion — persistent research memory, operations and living observations
create extension if not exists pgcrypto;

create table if not exists research_memories (
  memory_key text primary key,
  subject text not null,
  canonical_subject text not null,
  freshness text not null check (freshness in ('live','current','historical')),
  graph jsonb not null,
  knowledge_cutoff timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists research_memories_subject_idx on research_memories(lower(subject),expires_at desc);
create index if not exists research_memories_expiry_idx on research_memories(expires_at);

create table if not exists system_observations (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  status text not null check (status in ('ok','degraded','error')),
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);
create index if not exists system_observations_metric_idx on system_observations(metric,observed_at desc);

create table if not exists provider_health (
  provider text primary key,
  status text not null default 'unknown' check (status in ('healthy','degraded','down','unknown')),
  consecutive_failures integer not null default 0,
  last_latency_ms integer,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

-- observed_changes is the reader-facing, subject-oriented stream introduced in V7.
-- Editorial change_candidates remains the entity/claim-level review queue from V3/V4.
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

create table if not exists brief_signals (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  window_days integer not null default 7,
  mention_count integer not null default 0,
  prior_mention_count integer not null default 0,
  source_diversity integer not null default 0,
  average_importance integer not null default 0,
  velocity integer not null default 0,
  score integer not null check (score between 0 and 100),
  calculated_at timestamptz not null default now()
);
create index if not exists brief_signals_topic_idx on brief_signals(lower(topic),calculated_at desc);
create index if not exists brief_signals_score_idx on brief_signals(score desc,calculated_at desc);

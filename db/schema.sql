create extension if not exists pgcrypto;

create table if not exists entities (
  id text primary key,
  entity_type text not null check (entity_type in ('company','person','concept','technology','industry','organization','country','product')),
  name text not null,
  slug text not null unique,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sources (
  id text primary key,
  name text not null,
  url text not null,
  feed_url text,
  source_type text not null check (source_type in ('primary','reporting','specialist','discovery')),
  tier text not null check (tier in ('A','B','C','D')),
  ingestion_method text not null default 'rss' check (ingestion_method in ('rss','json','manual','custom')),
  topics text[] not null default '{}',
  poll_interval_minutes integer not null default 1440,
  request_timeout_ms integer not null default 12000,
  max_retries integer not null default 3,
  consecutive_failures integer not null default 0,
  circuit_open_until timestamptz,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'daily',
  status text not null default 'running' check (status in ('running','completed','partial','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  sources_attempted integer not null default 0,
  sources_failed integer not null default 0,
  documents_collected integer not null default 0,
  events_created integer not null default 0,
  candidate_claims integer not null default 0,
  meaningful_changes integer not null default 0,
  reviews_created integer not null default 0,
  updates_published integer not null default 0,
  error_summary text
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references intelligence_runs(id) on delete cascade,
  job_type text not null check (job_type in ('ingest','normalize','cluster','extract','verify','compare','impact','review','publish','reconcile')),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','running','retrying','completed','dead')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists jobs_claim_idx on jobs(status, available_at, job_type);

create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references sources(id) on delete cascade,
  external_key text,
  canonical_url text not null,
  title text not null,
  excerpt text,
  body text,
  authors text[] not null default '{}',
  language text not null default 'en',
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  unique(source_id, content_hash)
);
create index if not exists source_documents_hash_idx on source_documents(content_hash);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  title text not null,
  summary text,
  occurred_at timestamptz,
  status text not null default 'developing' check (status in ('developing','confirmed','disputed','closed')),
  confidence text not null default 'medium' check (confidence in ('high','medium','low')),
  importance_score integer not null default 0 check (importance_score between 0 and 100),
  topic_tags text[] not null default '{}',
  entity_ids text[] not null default '{}',
  document_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null references entities(id) on delete cascade,
  predicate text not null,
  value_text text not null,
  normalized_value jsonb,
  freshness_class text not null check (freshness_class in ('live','current','slow','static')),
  verification_status text not null default 'unverified' check (verification_status in ('confirmed','corroborated','reported','estimated','disputed','unverified','retracted')),
  confidence text not null check (confidence in ('high','medium','low')),
  valid_from timestamptz,
  valid_to timestamptz,
  first_observed_at timestamptz not null default now(),
  last_verified_at timestamptz,
  supersedes_claim_id uuid references claims(id),
  created_at timestamptz not null default now()
);
create index if not exists claims_entity_predicate_idx on claims(entity_id,predicate);
create index if not exists claims_verified_idx on claims(last_verified_at);

create table if not exists claim_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  document_id uuid not null references source_documents(id) on delete cascade,
  stance text not null check (stance in ('supports','conflicts','mentions')),
  excerpt text,
  source_tier text not null check (source_tier in ('A','B','C','D')),
  created_at timestamptz not null default now(),
  unique(claim_id,document_id,stance)
);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  deck text not null default '',
  category text not null,
  answer text not null,
  why_it_matters text not null default '',
  context text not null default '',
  watch_next text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  risk_class text not null default 'normal' check (risk_class in ('normal','sensitive','high')),
  freshness_score integer not null default 100 check (freshness_score between 0 and 100),
  reading_minutes integer not null default 4,
  last_verified_at timestamptz,
  last_substantial_update_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brief_claims (
  brief_id uuid references briefs(id) on delete cascade,
  claim_id uuid references claims(id) on delete cascade,
  display_order integer not null default 0,
  primary key (brief_id, claim_id)
);

create table if not exists entity_relations (
  id uuid primary key default gen_random_uuid(),
  from_entity_id text not null references entities(id) on delete cascade,
  relation_type text not null,
  to_entity_id text not null references entities(id) on delete cascade,
  confidence text not null default 'high',
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references intelligence_runs(id) on delete set null,
  brief_id uuid references briefs(id) on delete cascade,
  claim_id uuid references claims(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  title text not null,
  reason text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  review_mode text not null check (review_mode in ('auto','review','manual')),
  status text not null default 'open' check (status in ('open','approved','rejected','dismissed','deferred')),
  before_value text,
  proposed_value text,
  evidence_summary jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists change_log (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references intelligence_runs(id),
  entity_id text references entities(id),
  brief_id uuid references briefs(id),
  claim_id uuid references claims(id),
  event_id uuid references events(id),
  change_type text not null,
  summary text not null,
  before_value text,
  after_value text,
  changed_at timestamptz not null default now()
);

create or replace function briefs_claim_job(worker text, wanted_type text default null)
returns setof jobs language plpgsql as $$
begin
  return query
  with picked as (
    select id from jobs
    where status in ('pending','retrying')
      and available_at <= now()
      and (wanted_type is null or job_type = wanted_type)
    order by available_at, created_at
    for update skip locked
    limit 1
  )
  update jobs j set
    status='running', attempts=attempts+1, locked_by=worker,
    heartbeat_at=now(), lease_expires_at=now()+interval '2 minutes', updated_at=now()
  from picked where j.id=picked.id returning j.*;
end $$;

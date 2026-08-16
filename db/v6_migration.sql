-- Briefs.blog V6: Research & Source Discovery Engine
create extension if not exists pgcrypto;

alter table entities drop constraint if exists entities_entity_type_check;
alter table entities add constraint entities_entity_type_check check (entity_type in (
  'company','person','concept','technology','industry','organization','country','product','work','event','place','media_franchise','fictional_character'
));

create table if not exists research_runs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references research_requests(id) on delete set null,
  subject text not null,
  status text not null default 'running' check (status in ('running','completed','partial','failed','cancelled')),
  query_plan jsonb not null default '{}'::jsonb,
  source_count integer not null default 0,
  finding_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);
create index if not exists research_runs_subject_idx on research_runs(lower(subject),started_at desc);
create index if not exists research_runs_status_idx on research_runs(status,started_at desc);

create table if not exists research_evidence (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references research_runs(id) on delete cascade,
  provider text not null,
  source_name text not null,
  title text not null,
  url text not null,
  tier text not null check (tier in ('A','B','C','D')),
  kind text not null,
  retrieved_at timestamptz not null,
  content_excerpt text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id,url)
);
create index if not exists research_evidence_run_idx on research_evidence(run_id,created_at);

create table if not exists research_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references research_runs(id) on delete cascade,
  finding_key text not null,
  subject text not null,
  predicate text not null,
  value_text text not null,
  statement text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  verification_status text not null check (verification_status in ('confirmed','corroborated','reported','unverified')),
  evidence_ids uuid[] not null default '{}',
  status text not null default 'staged' check (status in ('staged','accepted','rejected','promoted')),
  promoted_claim_id uuid references claims(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(run_id,finding_key)
);
create index if not exists research_findings_run_idx on research_findings(run_id,status,created_at);

create table if not exists research_contexts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  entity_ids text[] not null default '{}',
  previous_query text,
  claim_ids text[] not null default '{}',
  expires_at timestamptz not null default now()+interval '24 hours',
  created_at timestamptz not null default now()
);
create index if not exists research_contexts_expiry_idx on research_contexts(expires_at);

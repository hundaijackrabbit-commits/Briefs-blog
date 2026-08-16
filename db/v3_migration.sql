-- Briefs.blog V3: Knowledge & Editorial Intelligence
create extension if not exists pgcrypto;

alter table entities add column if not exists description text;
alter table entities add column if not exists canonical_url text;
alter table entities add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists entity_identifiers (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null references entities(id) on delete cascade,
  namespace text not null,
  identifier text not null,
  source_id text references sources(id) on delete set null,
  confidence text not null default 'high' check (confidence in ('high','medium','low')),
  created_at timestamptz not null default now(),
  unique(namespace,identifier)
);
create index if not exists entity_identifiers_entity_idx on entity_identifiers(entity_id);

create table if not exists event_entities (
  event_id uuid not null references events(id) on delete cascade,
  entity_id text not null references entities(id) on delete cascade,
  role text not null default 'mentioned',
  confidence numeric(5,4) not null default 1,
  primary key(event_id,entity_id,role)
);

alter table claim_evidence add column if not exists independence_key text;
alter table claim_evidence add column if not exists directness text not null default 'indirect' check (directness in ('direct','indirect','derived'));
alter table claim_evidence add column if not exists observed_at timestamptz not null default now();

create table if not exists claim_versions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  version_no integer not null,
  value_text text not null,
  normalized_value jsonb,
  verification_status text not null,
  confidence text not null,
  valid_from timestamptz,
  valid_to timestamptz,
  evidence_ids uuid[] not null default '{}',
  recorded_at timestamptz not null default now(),
  unique(claim_id,version_no)
);

create table if not exists semantic_annotations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references source_documents(id) on delete cascade,
  frame jsonb not null,
  extractor_version text not null,
  created_at timestamptz not null default now(),
  unique(document_id,extractor_version)
);

create table if not exists knowledge_snapshots (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null references entities(id) on delete cascade,
  snapshot_at timestamptz not null,
  state jsonb not null,
  source_run_id uuid references intelligence_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(entity_id,snapshot_at)
);
create index if not exists knowledge_snapshots_lookup_idx on knowledge_snapshots(entity_id,snapshot_at desc);

create table if not exists brief_sections (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  section_key text not null,
  heading text not null,
  body text not null default '',
  display_order integer not null default 0,
  generated_from text not null default 'editorial' check (generated_from in ('editorial','structured','ai-assisted')),
  last_verified_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(brief_id,section_key)
);

create table if not exists brief_section_claims (
  section_id uuid not null references brief_sections(id) on delete cascade,
  claim_id uuid not null references claims(id) on delete cascade,
  dependency_type text not null default 'supports' check (dependency_type in ('supports','number','context','timeline','watch')),
  primary key(section_id,claim_id,dependency_type)
);

create table if not exists brief_requests (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  entity_ids text[] not null default '{}',
  depth text not null check (depth in ('flash','quick','standard','deep','research')),
  perspective text not null check (perspective in ('general','executive','investor','developer','student','marketer')),
  time_from timestamptz,
  time_to timestamptz,
  source_policy text not null default 'verified',
  freshness_requirement text not null default 'current',
  requested_format text not null default 'web',
  created_at timestamptz not null default now()
);

create table if not exists brief_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references brief_requests(id) on delete cascade,
  result jsonb not null,
  confidence text not null check (confidence in ('high','medium','low')),
  knowledge_cutoff timestamptz not null,
  research_needed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists coverage_scores (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null,
  score integer not null check (score between 0 and 100),
  entity_coverage integer not null default 0,
  claim_freshness integer not null default 0,
  source_diversity integer not null default 0,
  missing_concepts text[] not null default '{}',
  calculated_at timestamptz not null default now()
);
create index if not exists coverage_scores_topic_idx on coverage_scores(topic_slug,calculated_at desc);

create table if not exists quality_evaluations (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references briefs(id) on delete cascade,
  result_id uuid references brief_results(id) on delete cascade,
  evidence_score integer not null,
  freshness_score integer not null,
  clarity_score integer not null,
  coverage_score integer not null,
  originality_score integer not null,
  overall_score integer not null,
  blockers text[] not null default '{}',
  warnings text[] not null default '{}',
  evaluated_at timestamptz not null default now(),
  check ((brief_id is not null) or (result_id is not null))
);

create table if not exists change_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references intelligence_runs(id) on delete set null,
  entity_id text not null references entities(id) on delete cascade,
  predicate text not null,
  previous_claim_id uuid references claims(id) on delete set null,
  proposed_value text not null,
  proposed_normalized_value jsonb,
  significance integer not null default 50 check (significance between 0 and 100),
  status text not null default 'open' check (status in ('open','accepted','rejected','superseded')),
  evidence_document_ids uuid[] not null default '{}',
  detected_at timestamptz not null default now()
);

-- Expand the V2 queue safely. PostgreSQL check constraints are named by default.
alter table jobs drop constraint if exists jobs_job_type_check;
alter table jobs add constraint jobs_job_type_check check (job_type in (
  'ingest','normalize','cluster','understand','resolve','extract','verify','compare','temporal','impact','review','publish','snapshot','quality','reconcile'
));

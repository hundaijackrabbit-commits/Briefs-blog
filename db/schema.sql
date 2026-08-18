create extension if not exists pgcrypto;

create table if not exists entities (
  id text primary key,
  entity_type text not null check (entity_type in ('company','person','concept','technology','industry','organization','country','product','work','event','place','media_franchise','fictional_character')),
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

-- Briefs.blog V4: Autonomous Editorial Foundation
create extension if not exists pgcrypto;

create table if not exists editorial_revisions (
  id uuid primary key default gen_random_uuid(),
  change_candidate_id uuid not null references change_candidates(id) on delete cascade,
  brief_id uuid not null references briefs(id) on delete cascade,
  section_id uuid not null references brief_sections(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','published','rolled_back','superseded')),
  review_mode text not null check (review_mode in ('auto','review','manual')),
  risk_class text not null default 'normal' check (risk_class in ('normal','sensitive','high')),
  rationale text not null,
  before_body text not null default '',
  proposed_body text not null,
  after_body text,
  claim_ids uuid[] not null default '{}',
  evidence_document_ids uuid[] not null default '{}',
  quality_score integer check (quality_score between 0 and 100),
  quality_blockers text[] not null default '{}',
  reviewed_by text,
  reviewed_at timestamptz,
  published_by text,
  published_at timestamptz,
  resolution_note text,
  snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(change_candidate_id,section_id)
);
create index if not exists editorial_revisions_status_idx on editorial_revisions(status,review_mode,created_at desc);

create table if not exists editorial_revision_citations (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references editorial_revisions(id) on delete cascade,
  document_id uuid not null references source_documents(id) on delete cascade,
  source_id text references sources(id) on delete set null,
  url text not null,
  title text not null,
  source_name text not null,
  source_tier text not null check (source_tier in ('A','B','C','D')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(revision_id,document_id)
);

create table if not exists publication_snapshots (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  revision_id uuid references editorial_revisions(id) on delete set null,
  state jsonb not null,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists publication_snapshots_brief_idx on publication_snapshots(brief_id,created_at desc);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='editorial_revisions_snapshot_fk') then
    alter table editorial_revisions add constraint editorial_revisions_snapshot_fk foreign key (snapshot_id) references publication_snapshots(id) on delete set null;
  end if;
end $$;

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  revision_id uuid references editorial_revisions(id) on delete set null,
  correction_type text not null check (correction_type in ('correction','rollback','clarification','retraction')),
  summary text not null,
  before_value text,
  after_value text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists internal_link_suggestions (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  target_brief_id uuid not null references briefs(id) on delete cascade,
  reason text not null,
  status text not null default 'suggested' check (status in ('suggested','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(brief_id,target_brief_id),
  check (brief_id<>target_brief_id)
);

create table if not exists editorial_policies (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null unique,
  subject_pattern text,
  risk_class text not null default 'normal' check (risk_class in ('normal','sensitive','high')),
  allow_auto boolean not null default false,
  require_primary boolean not null default true,
  require_corroboration integer not null default 1,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into editorial_policies(policy_key,subject_pattern,risk_class,allow_auto,require_primary,require_corroboration,notes)
values
('objective-primary','^(ceo|president|revenue|price|users|employees|availability|release date|market cap|funding|rate|status)$','normal',true,true,1,'Objective structured updates may auto-publish only when confirmation and quality gates pass.'),
('sensitive-default',null,'sensitive',false,true,2,'Sensitive subjects always require human review.'),
('high-risk-default',null,'high',false,true,2,'High-risk subjects always require human review and stronger corroboration.')
on conflict(policy_key) do nothing;
-- Briefs.blog V5: Living Knowledge MVP
create extension if not exists pgcrypto;

alter table claims add column if not exists claim_key text;
create unique index if not exists claims_claim_key_unique on claims(claim_key) where claim_key is not null;

create table if not exists source_packs (
  id text primary key,
  name text not null,
  description text not null default '',
  trust_policy text not null default 'verified',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_pack_sources (
  pack_id text not null references source_packs(id) on delete cascade,
  source_id text not null references sources(id) on delete cascade,
  priority integer not null default 50 check (priority between 0 and 100),
  primary key(pack_id,source_id)
);

create table if not exists research_requests (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  entity_ids text[] not null default '{}',
  reason text not null,
  priority integer not null default 50 check (priority between 0 and 100),
  status text not null default 'queued' check (status in ('queued','researching','review','completed','cancelled')),
  requested_depth text not null default 'standard' check (requested_depth in ('flash','quick','standard','deep','research')),
  requested_perspective text not null default 'general' check (requested_perspective in ('general','executive','investor','developer','student','marketer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists research_requests_queue_idx on research_requests(status,priority desc,created_at);

create table if not exists ingestion_checkpoints (
  source_id text primary key references sources(id) on delete cascade,
  cursor_value text,
  etag text,
  last_modified text,
  last_document_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists brief_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references brief_requests(id) on delete set null,
  subject text not null,
  rating text not null check (rating in ('helpful','not-helpful')),
  note text,
  created_at timestamptz not null default now()
);

alter table jobs drop constraint if exists jobs_job_type_check;
alter table jobs add constraint jobs_job_type_check check (job_type in (
  'ingest','normalize','cluster','understand','resolve','extract','verify','compare','temporal','impact','review','publish','snapshot','quality','reconcile','research'
));

insert into source_packs(id,name,description,trust_policy)
values ('starter-history','Starter History','Curated high-confidence sources used to bootstrap evergreen historical Briefs.','verified')
on conflict(id) do update set name=excluded.name,description=excluded.description,updated_at=now();
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
-- Briefs.blog V8: Personal Intelligence, Context, Evidence Inspection & Security
create extension if not exists pgcrypto;

create table if not exists reader_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reader_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references reader_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists reader_sessions_account_idx on reader_sessions(account_id,expires_at desc);
create index if not exists reader_sessions_expiry_idx on reader_sessions(expires_at);

create table if not exists reader_preferences (
  account_id uuid primary key references reader_accounts(id) on delete cascade,
  default_depth text not null default 'standard' check (default_depth in ('flash','quick','standard','deep','research')),
  default_perspective text not null default 'general' check (default_perspective in ('general','executive','investor','developer','student','marketer')),
  digest_enabled boolean not null default true,
  min_importance integer not null default 65 check (min_importance between 0 and 100),
  last_digest_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brief_packs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references reader_accounts(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brief_packs_account_idx on brief_packs(account_id,created_at);

create table if not exists brief_pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references brief_packs(id) on delete cascade,
  subject text not null,
  entity_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists brief_pack_items_subject_unique on brief_pack_items(pack_id,lower(subject));
create index if not exists brief_pack_items_subject_idx on brief_pack_items(lower(subject));

create table if not exists reader_read_states (
  account_id uuid not null references reader_accounts(id) on delete cascade,
  subject_key text not null,
  subject text not null,
  last_read_at timestamptz not null default now(),
  last_knowledge_cutoff timestamptz,
  last_change_count integer not null default 0,
  primary key(account_id,subject_key)
);

create table if not exists reader_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references reader_accounts(id) on delete cascade,
  subject text not null,
  title text not null,
  body text not null,
  fingerprint text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(account_id,fingerprint)
);
create index if not exists reader_notifications_account_idx on reader_notifications(account_id,read_at,created_at desc);

create table if not exists brief_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references reader_accounts(id) on delete cascade,
  root_subject text not null,
  last_subject text not null,
  context jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default now()+interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brief_conversations_account_idx on brief_conversations(account_id,updated_at desc);

create table if not exists brief_turns (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references brief_conversations(id) on delete cascade,
  query text not null,
  resolved_subject text,
  intent text,
  claim_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists brief_turns_conversation_idx on brief_turns(conversation_id,created_at);

create table if not exists research_iterations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references research_runs(id) on delete cascade,
  iteration integer not null,
  gap_kind text not null,
  reason text not null,
  next_query text not null,
  created_at timestamptz not null default now()
);
create index if not exists research_iterations_run_idx on research_iterations(run_id,iteration);

-- Personal rows are isolated by account_id in server-side queries. Production roles should remain server-only.

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
-- Briefs.blog V10.2 / 1.2.0 — Reader Intelligence & Editorial Refinement
create extension if not exists pgcrypto;

create table if not exists publication_angle_candidates(
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references publication_opportunities(id) on delete cascade,
  keyword_id uuid references publication_keywords(id) on delete cascade,
  research_snapshot_id uuid references publication_research_snapshots(id) on delete set null,
  angle_key text not null,
  title text not null,
  thesis text not null,
  score int not null check(score between 0 and 100),
  evidence_score int not null check(evidence_score between 0 and 100),
  novelty_score int not null check(novelty_score between 0 and 100),
  audience_score int not null check(audience_score between 0 and 100),
  risk_score int not null check(risk_score between 0 and 100),
  claim_ids jsonb not null default '[]'::jsonb,
  selected boolean not null default false,
  rationale jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(opportunity_id,angle_key)
);
create index if not exists publication_angle_candidates_rank_idx on publication_angle_candidates(opportunity_id,selected desc,score desc);

create table if not exists publication_story_contracts(
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null unique references publication_opportunities(id) on delete cascade,
  audience_key text not null,
  angle_key text not null,
  angle text not null,
  thesis text not null,
  why_now text not null,
  reader_outcome text not null,
  differentiator text not null,
  strongest_claim_ids jsonb not null default '[]'::jsonb,
  counter_claim_ids jsonb not null default '[]'::jsonb,
  cannot_claim jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brief_answer_evaluations(
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  perspective text not null,
  reader_goal text not null,
  reader_expertise text not null,
  intent text not null,
  source_mode text not null,
  total_score int not null check(total_score between 0 and 100),
  audience_score int not null check(audience_score between 0 and 100),
  directness_score int not null check(directness_score between 0 and 100),
  grounding_score int not null check(grounding_score between 0 and 100),
  clarity_score int not null check(clarity_score between 0 and 100),
  uncertainty_score int not null check(uncertainty_score between 0 and 100),
  specificity_score int not null check(specificity_score between 0 and 100),
  generated_by text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists brief_answer_evaluations_subject_idx on brief_answer_evaluations(subject,created_at desc);
create index if not exists brief_answer_evaluations_quality_idx on brief_answer_evaluations(total_score,created_at desc);

alter table publication_quality_results add column if not exists reader_goal_score int not null default 0;
alter table publication_quality_results add column if not exists headline_score int not null default 0;
alter table publication_quality_results add column if not exists specificity_score int not null default 0;
alter table publication_quality_results add column if not exists voice_version text not null default '1.0';

-- Publication Engine 1.2.1 — Global Importance + Daily Distinctiveness
alter table publication_keywords add column if not exists system_owned boolean not null default false;

create table if not exists publication_global_runs(
  id uuid primary key default gen_random_uuid(), editorial_day date not null,
  status text not null default 'running' check(status in ('running','selected','failed')),
  candidates_count int not null default 0, selected_candidate_id uuid, error_summary text,
  started_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists publication_global_runs_day_idx on publication_global_runs(editorial_day desc,started_at desc);

create table if not exists publication_global_candidates(
  id uuid primary key default gen_random_uuid(), run_id uuid not null references publication_global_runs(id) on delete cascade,
  event_key text not null, subject text not null, research_query text not null, category text not null,
  regions jsonb not null default '[]'::jsonb, source_countries jsonb not null default '[]'::jsonb,
  source_families jsonb not null default '[]'::jsonb, mention_count int not null default 0, newest_at timestamptz,
  geographic_reach int not null default 0 check(geographic_reach between 0 and 100),
  human_consequence int not null default 0 check(human_consequence between 0 and 100),
  economic_consequence int not null default 0 check(economic_consequence between 0 and 100),
  political_impact int not null default 0 check(political_impact between 0 and 100),
  long_term_consequence int not null default 0 check(long_term_consequence between 0 and 100),
  surprise_velocity int not null default 0 check(surprise_velocity between 0 and 100),
  public_attention int not null default 0 check(public_attention between 0 and 100),
  evidence_breadth int not null default 0 check(evidence_breadth between 0 and 100),
  importance_score int not null default 0 check(importance_score between 0 and 100),
  distinctiveness_score int not null default 0 check(distinctiveness_score between 0 and 100),
  repeat_penalty int not null default 0, final_score int not null default 0 check(final_score between 0 and 100),
  material_change_override boolean not null default false, rationale jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb, title_samples jsonb not null default '[]'::jsonb,
  selected boolean not null default false,
  status text not null default 'candidate' check(status in ('candidate','selected','drafted','research-blocked','dismissed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(run_id,event_key)
);
create index if not exists publication_global_candidates_rank_idx on publication_global_candidates(run_id,selected desc,final_score desc);
create index if not exists publication_global_candidates_event_idx on publication_global_candidates(event_key,created_at desc);

alter table publication_global_runs drop constraint if exists publication_global_runs_selected_candidate_id_fkey;
alter table publication_global_runs add constraint publication_global_runs_selected_candidate_id_fkey foreign key(selected_candidate_id) references publication_global_candidates(id) on delete set null;

create table if not exists publication_daily_flagships(
  id uuid primary key default gen_random_uuid(), editorial_day date not null unique,
  run_id uuid references publication_global_runs(id) on delete set null,
  candidate_id uuid references publication_global_candidates(id) on delete set null,
  keyword_id uuid references publication_keywords(id) on delete set null,
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  article_id uuid references publication_articles(id) on delete set null,
  subject text not null, research_query text not null, category text not null,
  importance_score int not null check(importance_score between 0 and 100),
  distinctiveness_score int not null check(distinctiveness_score between 0 and 100),
  final_score int not null check(final_score between 0 and 100),
  material_change_override boolean not null default false, mention_count int not null default 0,
  source_family_count int not null default 0, regions jsonb not null default '[]'::jsonb,
  status text not null default 'selected' check(status in ('selected','drafted','published','research-required','dismissed')),
  rationale jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists publication_daily_flagships_recent_idx on publication_daily_flagships(editorial_day desc,status);

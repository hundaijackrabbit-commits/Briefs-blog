create extension if not exists pgcrypto;

create table if not exists publication_keywords(
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  category text not null default 'General',
  audience_key text not null default 'smart-generalist',
  editorial_mode text not null default 'review' check(editorial_mode in ('auto','review','manual')),
  min_sources int not null default 3 check(min_sources between 1 and 20),
  require_primary boolean not null default false,
  freshness_hours int not null default 24 check(freshness_hours between 1 and 720),
  min_story_score int not null default 72 check(min_story_score between 0 and 100),
  active boolean not null default true,
  last_researched_at timestamptz,
  next_research_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists publication_opportunities(
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references publication_keywords(id) on delete cascade,
  subject text not null,
  suggested_angle text not null,
  story_score int not null,
  evidence_score int not null,
  novelty_score int not null,
  audience_score int not null,
  freshness_score int not null,
  status text not null default 'candidate' check(status in ('candidate','drafted','published','dismissed','blocked')),
  rationale text not null default '',
  research_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publication_opportunities_status_idx
  on publication_opportunities(status, story_score desc, created_at desc);

create table if not exists publication_research_snapshots(
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  keyword_id uuid references publication_keywords(id) on delete set null,
  subject text not null,
  graph jsonb not null,
  source_count int not null default 0,
  primary_source_count int not null default 0,
  independent_source_families int not null default 0,
  confidence text not null default 'low',
  sufficient boolean not null default false,
  knowledge_cutoff timestamptz,
  created_at timestamptz not null default now()
);

alter table publication_opportunities
  drop constraint if exists publication_opportunities_research_snapshot_id_fkey;
alter table publication_opportunities
  add constraint publication_opportunities_research_snapshot_id_fkey
  foreign key(research_snapshot_id) references publication_research_snapshots(id) on delete set null;

create table if not exists publication_articles(
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  primary_keyword text not null,
  slug text not null unique,
  title text not null,
  deck text not null default '',
  category text not null default 'General',
  audience_key text not null default 'smart-generalist',
  voice_key text not null default 'briefs',
  article_type text not null default 'briefing' check(article_type in ('briefing','explainer','analysis')),
  editorial_mode text not null default 'review' check(editorial_mode in ('auto','review','manual')),
  status text not null default 'draft' check(status in ('draft','review','published','archived')),
  freshness_status text not null default 'current' check(freshness_status in ('current','revalidated','update-available','research-required','disputed','stale')),
  quality_score int not null default 0,
  source_count int not null default 0,
  primary_source_count int not null default 0,
  independent_source_families int not null default 0,
  published_at timestamptz,
  last_revalidated_at timestamptz,
  last_substantial_update_at timestamptz,
  next_revalidate_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publication_articles_public_idx
  on publication_articles(status, published_at desc);
create index if not exists publication_articles_revalidate_idx
  on publication_articles(next_revalidate_at, status);

create table if not exists publication_article_versions(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references publication_articles(id) on delete cascade,
  version_no int not null,
  title text not null,
  deck text not null,
  sections jsonb not null,
  reason text not null default 'initial draft',
  created_at timestamptz not null default now(),
  unique(article_id, version_no)
);

create table if not exists publication_article_sections(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references publication_articles(id) on delete cascade,
  section_key text not null,
  heading text not null,
  body text not null,
  display_order int not null default 0,
  claim_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(article_id, section_key)
);

create table if not exists publication_article_claims(
  article_id uuid not null references publication_articles(id) on delete cascade,
  claim_id text not null,
  subject text not null,
  predicate text not null,
  value_text text not null,
  confidence text not null,
  verification_status text not null,
  source_ids jsonb not null default '[]'::jsonb,
  primary key(article_id, claim_id)
);

create table if not exists publication_article_sources(
  article_id uuid not null references publication_articles(id) on delete cascade,
  source_id text not null,
  name text not null,
  title text not null default '',
  url text not null,
  tier text not null,
  kind text not null,
  source_family text not null default '',
  excerpt text not null default '',
  retrieved_at timestamptz,
  published_at timestamptz,
  primary key(article_id, source_id)
);

create table if not exists publication_content_dependencies(
  id uuid primary key default gen_random_uuid(),
  target_type text not null check(target_type in ('article','brief')),
  target_id uuid not null,
  dependency_type text not null check(dependency_type in ('claim','entity','keyword')),
  dependency_key text not null,
  section_key text,
  created_at timestamptz not null default now(),
  unique(target_type,target_id,dependency_type,dependency_key,section_key)
);

create index if not exists publication_dependency_lookup_idx
  on publication_content_dependencies(dependency_type, dependency_key);

create table if not exists publication_similarity_checks(
  id uuid primary key default gen_random_uuid(),
  article_id uuid references publication_articles(id) on delete cascade,
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  max_source_overlap numeric(6,5) not null default 0,
  max_library_overlap numeric(6,5) not null default 0,
  longest_matching_words int not null default 0,
  passed boolean not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists publication_quality_results(
  id uuid primary key default gen_random_uuid(),
  article_id uuid references publication_articles(id) on delete cascade,
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  total_score int not null,
  evidence_coverage int not null,
  evidence_diversity int not null,
  originality_score int not null,
  audience_score int not null,
  voice_score int not null,
  freshness_score int not null,
  unsupported_facts int not null default 0,
  blockers jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists publication_update_proposals(
  id uuid primary key default gen_random_uuid(),
  target_type text not null check(target_type in ('article','brief')),
  target_id uuid not null,
  status text not null default 'proposed' check(status in ('proposed','approved','published','rejected','superseded')),
  review_mode text not null default 'review' check(review_mode in ('auto','review','manual')),
  summary text not null,
  reason text not null default '',
  proposed_patch jsonb not null,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  quality_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists publication_update_queue_idx
  on publication_update_proposals(status, created_at desc);

create table if not exists publication_revalidation_queue(
  id uuid primary key default gen_random_uuid(),
  target_type text not null check(target_type in ('keyword','article','brief')),
  target_id uuid not null,
  due_at timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','running','completed','failed')),
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publication_revalidation_queue_due_idx
  on publication_revalidation_queue(status,due_at);
create unique index if not exists publication_revalidation_queue_active_unique
  on publication_revalidation_queue(target_type,target_id)
  where status in ('pending','running');

create table if not exists publication_revalidation_runs(
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running',
  keywords_queued int not null default 0,
  articles_queued int not null default 0,
  briefs_queued int not null default 0,
  items_processed int not null default 0,
  items_failed int not null default 0,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

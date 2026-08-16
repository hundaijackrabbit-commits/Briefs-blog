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

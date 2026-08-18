-- Briefs.blog Publication Engine 1.2.1 — Global Importance + Daily Distinctiveness
create extension if not exists pgcrypto;

alter table publication_keywords add column if not exists system_owned boolean not null default false;

create table if not exists publication_global_runs(
  id uuid primary key default gen_random_uuid(),
  editorial_day date not null,
  status text not null default 'running' check(status in ('running','selected','failed')),
  candidates_count int not null default 0,
  selected_candidate_id uuid,
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists publication_global_runs_day_idx on publication_global_runs(editorial_day desc,started_at desc);

create table if not exists publication_global_candidates(
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references publication_global_runs(id) on delete cascade,
  event_key text not null,
  subject text not null,
  research_query text not null,
  category text not null,
  regions jsonb not null default '[]'::jsonb,
  source_countries jsonb not null default '[]'::jsonb,
  source_families jsonb not null default '[]'::jsonb,
  mention_count int not null default 0,
  newest_at timestamptz,
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
  repeat_penalty int not null default 0,
  final_score int not null default 0 check(final_score between 0 and 100),
  material_change_override boolean not null default false,
  rationale jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  title_samples jsonb not null default '[]'::jsonb,
  selected boolean not null default false,
  status text not null default 'candidate' check(status in ('candidate','selected','drafted','research-blocked','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id,event_key)
);
create index if not exists publication_global_candidates_rank_idx on publication_global_candidates(run_id,selected desc,final_score desc);
create index if not exists publication_global_candidates_event_idx on publication_global_candidates(event_key,created_at desc);

alter table publication_global_runs drop constraint if exists publication_global_runs_selected_candidate_id_fkey;
alter table publication_global_runs add constraint publication_global_runs_selected_candidate_id_fkey foreign key(selected_candidate_id) references publication_global_candidates(id) on delete set null;

create table if not exists publication_daily_flagships(
  id uuid primary key default gen_random_uuid(),
  editorial_day date not null unique,
  run_id uuid references publication_global_runs(id) on delete set null,
  candidate_id uuid references publication_global_candidates(id) on delete set null,
  keyword_id uuid references publication_keywords(id) on delete set null,
  opportunity_id uuid references publication_opportunities(id) on delete set null,
  article_id uuid references publication_articles(id) on delete set null,
  subject text not null,
  research_query text not null,
  category text not null,
  importance_score int not null check(importance_score between 0 and 100),
  distinctiveness_score int not null check(distinctiveness_score between 0 and 100),
  final_score int not null check(final_score between 0 and 100),
  material_change_override boolean not null default false,
  mention_count int not null default 0,
  source_family_count int not null default 0,
  regions jsonb not null default '[]'::jsonb,
  status text not null default 'selected' check(status in ('selected','drafted','published','research-required','dismissed')),
  rationale jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists publication_daily_flagships_recent_idx on publication_daily_flagships(editorial_day desc,status);

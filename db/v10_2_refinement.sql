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

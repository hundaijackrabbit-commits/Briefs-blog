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
  source_type text not null check (source_type in ('primary','reporting','specialist','discovery')),
  tier text not null check (tier in ('A','B','C','D')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists claims (
  id text primary key,
  entity_id text not null references entities(id) on delete cascade,
  claim_key text not null,
  claim_value text not null,
  freshness_class text not null check (freshness_class in ('live','current','slow','static')),
  confidence text not null check (confidence in ('high','medium','low')),
  source_ids text[] not null default '{}',
  valid_from timestamptz,
  valid_to timestamptz,
  last_verified_at timestamptz not null,
  supersedes_claim_id text references claims(id),
  created_at timestamptz not null default now()
);

create index if not exists claims_entity_idx on claims(entity_id);
create index if not exists claims_verified_idx on claims(last_verified_at);

create table if not exists briefs (
  id text primary key,
  slug text not null unique,
  title text not null,
  deck text not null,
  category text not null,
  answer text not null,
  why_it_matters text not null,
  context text not null,
  watch_next text[] not null default '{}',
  claim_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  freshness_score integer not null default 100 check (freshness_score between 0 and 100),
  reading_minutes integer not null default 4,
  last_verified_at timestamptz not null,
  last_substantial_update_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entity_relations (
  id uuid primary key default gen_random_uuid(),
  from_entity_id text not null references entities(id) on delete cascade,
  relation_type text not null,
  to_entity_id text not null references entities(id) on delete cascade,
  source_ids text[] not null default '{}',
  confidence text not null default 'high',
  valid_from timestamptz,
  valid_to timestamptz,
  unique(from_entity_id, relation_type, to_entity_id, valid_from)
);

create table if not exists source_events (
  id uuid primary key default gen_random_uuid(),
  source_id text references sources(id),
  external_key text,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  raw_text text,
  fingerprint text,
  created_at timestamptz not null default now(),
  unique(source_id, external_key)
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  brief_id text references briefs(id) on delete cascade,
  claim_id text references claims(id) on delete set null,
  title text not null,
  reason text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  review_mode text not null check (review_mode in ('auto','review','manual')),
  status text not null default 'open' check (status in ('open','approved','rejected','dismissed')),
  proposed_value text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists change_log (
  id uuid primary key default gen_random_uuid(),
  entity_id text references entities(id),
  brief_id text references briefs(id),
  claim_id text references claims(id),
  change_type text not null,
  summary text not null,
  before_value text,
  after_value text,
  source_ids text[] not null default '{}',
  changed_at timestamptz not null default now()
);

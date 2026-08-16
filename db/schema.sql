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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entity_relations (
  id uuid primary key default gen_random_uuid(),
  from_entity_id text not null references entities(id) on delete cascade,
  relation_type text not null,
  to_entity_id text not null references entities(id) on delete cascade,
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reason text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  review_mode text not null check (review_mode in ('auto','review','manual')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists change_log (
  id uuid primary key default gen_random_uuid(),
  change_type text not null,
  summary text not null,
  before_value text,
  after_value text,

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

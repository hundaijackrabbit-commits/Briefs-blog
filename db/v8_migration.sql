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

# Briefs.blog V2 — Intelligence Foundation

V2 turns the V1 prototype into a resilient daily intelligence pipeline. The public site always serves the last verified state while background jobs ingest trusted sources, normalize documents, deduplicate events, detect changes, verify claims, score freshness and importance, and create editorial review items.

## Core engines

Source Registry, Ingestion, Normalization, Deduplication, Event Clustering, Entity Resolution, Claim/Evidence, Verification, Contradiction Detection, Freshness, Change Detection, Impact Mapping, Importance Scoring, Editorial Policy, Intelligence Runs, Job Queue, Retry/Dead Letter, Watchdog, and Living Brief assembly.

## Reliability rules

- AI or source failure never takes the website down.
- No external request waits forever.
- Jobs are idempotent and retry-safe.
- Bad sources are isolated with circuit breakers.
- Publishing occurs transactionally after verification.
- Every run and job is observable in `/admin/intelligence`.

## Setup

1. Create a Postgres database and run `db/schema.sql`, then `db/seed.sql`.
2. Copy `.env.example` to `.env.local` and fill secrets.
3. `npm install`
4. `npm run typecheck`
5. `npm run dev`

The included RSS adapter is intentionally conservative and dependency-light. Production deployments should add source-specific adapters for primary datasets and filings.

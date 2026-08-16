# Briefs.blog — V3 Stabilized

Briefs is a living knowledge and current-intelligence platform designed around one deceptively simple request: **“Brief me on…”**

The public surface is intentionally minimal. Underneath it, V2/V3 establish source ingestion, durable jobs, event understanding, entity resolution, claims, evidence, freshness, temporal history, knowledge snapshots, change intelligence, quality gates, and the `BriefRequest → BriefPlan → BriefResult` contract.

## Local validation

```bash
npm install
npm run typecheck
npm run build
npm run stabilize
```

`npm run stabilize` performs repository-level checks that do not require a running database. See `STABILIZATION.md` for the production gate.

## Database paths

- Fresh database: apply `db/schema.sql`, then `db/seed.sql`.
- Existing confirmed V2 database: back up, apply `db/v3_migration.sql`, then update seed data as needed.

## Runtime configuration

Copy `.env.example` and configure at minimum `DATABASE_URL`, `CRON_SECRET`, `ADMIN_TOKEN`, and `BRIEFS_BASE_URL` for a database-backed deployment.

## Safety model

Briefs fails closed. Missing or weak evidence is allowed to produce **research needed**; it must not silently become a factual publication. AI availability and knowledge-pipeline availability must never determine whether the public website itself can render.

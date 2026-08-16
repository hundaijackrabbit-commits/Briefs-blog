# Briefs.blog — V3 Stabilized

Version: **0.3.1-stable**

This build is the stabilization gate between V3 Knowledge Intelligence and V4 Autonomous Editorial Intelligence.

## Stabilized in this build

- Reconciled the V3 project structure after the V1/V2/V3 merge path.
- Restored a non-empty, authoritative version manifest.
- Canonicalized the database bootstrap schema and retained the additive V3 migration.
- Added repository, SQL-shape, import, route-contract, environment, and empty-file diagnostics.
- Added a health endpoint that fails gracefully when the database is unavailable.
- Kept cron authentication fail-closed when `CRON_SECRET` is absent.
- Kept the Brief API fail-closed when its knowledge database cannot answer safely.
- Preserved V2 job idempotency, worker leases, heartbeat, stale recovery, retry, and dead-letter semantics.
- Preserved V3 entity resolution, semantic annotations, evidence graph, temporal claims, snapshots, change candidates, coverage scores, quality evaluation, and Brief Request/Plan/Result contracts.
- Refined the public home experience to a deliberately minimal **“Brief me on”** prompt. The visible interface is simple; the complexity stays in the intelligence layer.

## Required production validation

Before deploying a database-backed environment:

1. `npm install`
2. `npm run typecheck`
3. `npm run build`
4. `npm run stabilize`
5. Apply `db/schema.sql` for a fresh database, **or** apply `db/v3_migration.sql` to a confirmed V2 database.
6. Seed only after the schema/migration completes.
7. Configure `DATABASE_URL`, `CRON_SECRET`, `ADMIN_TOKEN`, and `BRIEFS_BASE_URL`.
8. Exercise `/api/health`, `/api/brief`, `/api/cron/daily`, and `/api/cron/worker` in staging.

## Release rule

V4 should not be merged if V3 stabilization checks fail. Editorial automation must never be allowed to publish unsupported or partially committed knowledge.

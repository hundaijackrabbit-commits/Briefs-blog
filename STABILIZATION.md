# V3 Stabilization Gate

The purpose of this pass is reliability, contract consistency, and merge recovery — not feature expansion.

## Gate A — repository integrity

`python scripts/stabilization-check.py` verifies required V3 files, rejects zero-byte critical manifests, catches common merge artifacts, checks local `@/` imports, checks route/engine contracts, and performs lightweight SQL-shape checks.

## Gate B — TypeScript and Next.js

Run `npm install`, `npm run typecheck`, and `npm run build` on a machine with dependency access. Static validation is not a substitute for compilation.

## Gate C — database

For a fresh database use `db/schema.sql`. For an existing, known-good V2 database use `db/v3_migration.sql`. Do not apply both paths blindly to an unknown database state. Back up before migration.

The seed expects the V2/V3 source and Brief columns to exist. Run it only after the schema path succeeds.

## Gate D — runtime safety

The public site should continue to render when `DATABASE_URL` is absent. Knowledge-dependent routes must return controlled errors rather than fabricated current information.

Cron routes require an explicit `CRON_SECRET`. Admin intelligence requires `ADMIN_TOKEN`.

## Gate E — editorial safety

V3 remains evidence-first. “Research needed” is a valid result. Missing evidence must not be converted into confident prose. V4 can automate revision proposals only after this gate remains green.

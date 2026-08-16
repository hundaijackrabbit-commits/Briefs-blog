# Briefs.blog V3.1 Hotfix

This package stabilizes the merged V3 baseline for deployment.

## Fixed

- Restores valid `package.json` JSON (removes the illegal trailing comma that caused Vercel to fail before dependency installation).
- Uses the reconciled V3 database schema with source polling/reliability fields expected by `db/seed.sql`.
- Removes the invalid trailing comma from the `entity_relations` table definition.
- Keeps the V2 reliability layer and V3 knowledge/Brief architecture intact.
- Keeps the minimal `Brief me on …` homepage direction intact.
- Preserves the daily cron configuration.

## Validation performed

- `package.json`, `vercel.json`, and `tsconfig.json` parse as valid JSON.
- `python scripts/static-check.py` passes.
- `python scripts/stabilization-check.py` passes.
- ZIP integrity is checked when this package is produced.

## Required local deployment gate

Run these on a machine with package registry access before treating V3.1 as production-ready:

```bash
npm install
npm run typecheck
npm run build
npm run stabilize
```

If Vercel then reports an application-level TypeScript/runtime error, use that build log as the next stabilization input; this hotfix specifically removes the current pre-build JSON blocker and reconciles the known SQL/seed mismatch.

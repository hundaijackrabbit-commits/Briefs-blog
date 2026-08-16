# V5 validation

Validation performed for this package:

- `package.json` JSON parse — pass
- V5 architecture check (`node scripts/v5-check.mjs`) — pass
- legacy static repository check — pass
- V4 stabilization check — pass
- TypeScript project-code compile with dependency stubs — pass
- known Postgres `sql.json` typing regressions repaired in queue/source/understanding
- V5 database schema/seed packaged and bootstrap tool included
- ZIP integrity — checked after packaging

A full `npm install && npm run typecheck && npm run build` could not be executed in the artifact environment because external package installation timed out. Run those commands on the Windows development machine before pushing to production. The same dependency versions already built successfully in V4.1 once the JSON typing regression was fixed locally.

# V8 validation

Validation performed for the V8 Personal Intelligence, Context & Evidence Inspection package:

- `package.json` + `tsconfig.json` JSON parse — pass
- V8 architecture registry check (`node scripts/v8-check.mjs`) — pass
- V7 architecture preservation check — pass
- V6 research-engine preservation check — pass
- V5 living-knowledge preservation check — pass
- legacy static repository check — pass
- V4 stabilization check — pass
- V4 architecture check — pass with the expected version warning
- TypeScript project-code compile with temporary offline dependency shims — pass
- temporary validation shims removed after compile
- admin-page authentication gate present before server-rendered `/admin/*` database reads
- account/password/session schema and API paths present
- local-first follows remain usable without Postgres
- synced Brief Packs, reader preferences, read state and change inbox activate with Postgres
- follow-up Brief Context is wired through `BriefRequest → BriefResult`
- claim-level evidence inspection is rendered in Brief Me
- comparison decomposition now correctly handles `Compare Nvidia vs AMD`
- iterative research-gap evaluation and a bounded refinement pass are wired into the V6 research engine
- V8 database migration is appended to the bootstrap schema
- daily personal notification generation is integrated with graceful failure isolation
- `SYSTEMS.md` preserves V1–V10 scope

## Full dependency-backed build

`npm install` could not complete in the artifact environment because external package installation timed out. Therefore the real Next.js dependency-backed TypeScript/build gate must still run on the development machine:

```bash
npm install
npm run typecheck
npm run check
npm run build
```

After deployment:

```bash
$env:BRIEFS_EVAL_BASE_URL="https://your-deployment.example"
npm run eval:v8
```

## Production activation

To activate accounts, synced Brief Packs, persisted conversations, read-state and the personal change inbox, configure `DATABASE_URL` and run:

```bash
npm run db:bootstrap
```

Set long random values for `CRON_SECRET` and `ADMIN_TOKEN`. Market quote freshness remains dependent on the optional `ALPHA_VANTAGE_API_KEY` entitlement.

# Briefs.blog

Briefs is a living knowledge and briefing platform. The public product stays intentionally simple — **Brief me on …** — while the backend maintains intent, entities, claims, evidence, research, changes, freshness, personal state, editorial state and public authority surfaces.

## V10 — MVP complete

```bash
npm install
npm run typecheck
npm run check
npm run build
```

Then configure production and verify the database:

```bash
npm run db:bootstrap
npm run db:doctor
```

V10 routes and researches questions differently based on what the user is asking. Evergreen/reference queries use the maintained knowledge store and general research path; current questions prioritize recent reporting; finance uses SEC primary evidence and an optional market-quote adapter; scholarly questions can use OpenAlex; comparisons, evidence follow-ups and recorded prior-state questions have dedicated handling.

### Production configuration

Required for the full persistent MVP: `DATABASE_URL`, `ADMIN_TOKEN`, `CRON_SECRET`, and `BRIEFS_BASE_URL`. The site can still answer from safe fallback/research paths when the database is unavailable, but accounts, persistent research memory, historical state, living change observations and cross-device personal intelligence require Postgres.

Optional: `ALPHA_VANTAGE_API_KEY` for specialist market quotes, and `RESEND_API_KEY` + `BRIEFS_FROM_EMAIL` for digest email delivery.

### Final production evaluation

```powershell
$env:BRIEFS_EVAL_BASE_URL="https://briefs-blog.vercel.app"
npm run eval:v10
```

See `V10-BLUEPRINT.md`, `COMPETITIVE-BENCHMARK-V10.md`, and `SYSTEMS.md` for the final MVP contract.

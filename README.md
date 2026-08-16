# Briefs.blog

Briefs is a living knowledge and briefing platform. The public product is intentionally simple — **Brief me on …** — while the backend maintains entities, claims, evidence, changes, freshness, editorial revisions and research gaps.

## V5 quick start

```bash
npm install
npm run typecheck
npm run v5check
npm run build
npm run dev
```

Without `DATABASE_URL`, Brief Me uses a small verified starter corpus and clearly marks coverage gaps. With Postgres configured, Briefs uses the database first.

To bootstrap a new database:

```bash
# set DATABASE_URL in your shell first
npm run db:bootstrap
```

Then configure the same `DATABASE_URL`, `CRON_SECRET` and `ADMIN_TOKEN` in Vercel.

See `SYSTEMS.md` for the canonical architecture registry and `V5-BLUEPRINT.md` for this release.

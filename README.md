# Briefs.blog

Briefs is a living knowledge and briefing platform. The public product stays intentionally simple — **Brief me on …** — while the backend maintains entities, claims, evidence, research, changes, freshness and editorial state.

## V6 quick start

```bash
npm install
npm run typecheck
npm run v6check
npm run build
npm run dev
```

V6 has three answer paths:

1. **Knowledge DB** — durable verified knowledge when `DATABASE_URL` is configured.
2. **Verified starter corpus** — safe degraded coverage for selected baseline subjects.
3. **Live Research** — unknown subjects automatically trigger bounded Wikipedia/Wikidata research and return a provenance-backed baseline when sufficient evidence is found.

A failed research provider does not fail the public site. If research cannot gather enough evidence safely, Briefs keeps the coverage gap explicit.

To bootstrap/update Postgres:

```bash
# set DATABASE_URL in your shell first
npm run db:bootstrap
```

Configure `DATABASE_URL`, `CRON_SECRET`, `ADMIN_TOKEN` and optionally `BRIEFS_USER_AGENT` in Vercel.

See `SYSTEMS.md` for the canonical architecture ledger and `V6-BLUEPRINT.md` for this release.

# Briefs.blog

Briefs is a living knowledge and briefing platform. The public product stays intentionally simple — **Brief me on …** — while the backend maintains entities, claims, evidence, research, changes, freshness, query intent and editorial state.

## V7 quick start

```bash
npm install
npm run typecheck
npm run v7check
npm run intentcheck
npm run build
npm run dev
```

V7 routes questions before researching them:

1. **Finance / market** — resolve public company and ticker, pull primary SEC filings/XBRL facts, optionally add market quotes, then surface current catalysts.
2. **Current / news** — prioritize recent reporting and freshness rather than encyclopedia history.
3. **Reference / evergreen** — retain the V5/V6 verified knowledge + Wikipedia/Wikidata research path.
4. **Coverage gaps** — stay explicit; no fabricated facts.

### Optional market quote data

Set `ALPHA_VANTAGE_API_KEY` to activate the current quote adapter. Without it, a query such as `Apple stock` still returns an investor-focused SEC brief but explicitly states that live/delayed price data is not connected.

### Postgres

```bash
npm run db:bootstrap
```

When `DATABASE_URL` is configured, V7 also records query-intent observations, market snapshots and change candidates for later continuous intelligence.

### Competitive prompt evaluation

With the app running locally or deployed:

```bash
$env:BRIEFS_EVAL_BASE_URL="https://your-briefs-domain.example"
npm run eval:v7
```

See `COMPETITIVE-BENCHMARK-V7.md`, `V7-BLUEPRINT.md`, and `SYSTEMS.md`.

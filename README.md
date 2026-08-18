# Briefs.blog

Briefs is a living knowledge and briefing platform. The public product stays intentionally simple — **Brief me on …** — while the backend maintains entities, claims, evidence, research, changes, freshness, query intent, editorial state and personal reading context.

## V8 quick start

```bash
npm install
npm run typecheck
npm run v8check
npm run intentcheck
npm run build
npm run dev
```

V8 keeps the V7 routing model and adds a persistent product layer:

1. **Intent-aware briefing** — finance/current/reference/general routing, source policy, freshness and perspective.
2. **Iterative research foundation** — evaluate evidence gaps, then perform a bounded refinement pass for deep/current research.
3. **Evidence inspection** — open a key fact to see exactly which eligible sources support it.
4. **Contextual follow-ups** — follow-up questions carry the previous subject/evidence context rather than starting from zero.
5. **Personal intelligence** — local follows work without a database; Postgres adds accounts, synced Brief Packs, read state and a change inbox.
6. **Safer administration** — `/admin/*` is gated before server-rendered admin pages query internal data.

### Production Postgres

Set `DATABASE_URL`, then:

```bash
npm run db:bootstrap
```

This activates persistent knowledge, research history, accounts, sessions, Brief Packs, conversation turns, read-state and notification generation.

### Admin

Set a long random `ADMIN_TOKEN`. Visiting `/admin/*` redirects to `/admin/login`; a successful login creates a hashed HttpOnly admin session cookie. Mutation APIs continue to require their explicit authorization token.

### Optional market data

Set `ALPHA_VANTAGE_API_KEY` to activate the current quote adapter. Without it, finance Briefs still use SEC primary filings and clearly state that eligible quote data is missing.

### Production evaluation

```bash
$env:BRIEFS_EVAL_BASE_URL="https://your-briefs-domain.example"
npm run eval:v8
```

See `V8-BLUEPRINT.md`, `COMPETITIVE-BENCHMARK-V8.md`, and the non-negotiable `SYSTEMS.md` registry.

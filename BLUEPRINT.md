# Briefs.blog — Development Blueprint

## Product thesis
Briefs.blog is a living knowledge and current-intelligence platform. The publication is the interface; the structured information layer is the product.

**Editorial promise:** Tell readers what changed, what matters, why it matters, and how we know — without information overload.

## V1 outcome
Launch a narrow, high-trust publication focused initially on AI/technology/business with living briefs that can be maintained by a daily information pipeline.

V1 must prove five things:
1. A Brief can be assembled from structured claims and sources.
2. Claims have explicit freshness policies and verification dates.
3. New source events can be ingested, clustered and scored.
4. Potentially stale/changed facts become review items rather than blind rewrites.
5. Readers can see freshness and sourcing; editors can see the review queue.

## Architecture

```text
PRIMARY / TRUSTED SOURCES
          ↓
  Source adapters / ingestion
          ↓
       Raw events
          ↓
 Story clustering + entity matching
          ↓
 Importance + source-strength scoring
          ↓
 Candidate facts / changed claims
          ↓
 Freshness + contradiction checks
          ↓
     Editorial review queue
       ↙            ↘
 objective         interpretive
 auto-safe          human review
       ↘            ↙
     Claim + change store
          ↓
 Entity graph + historical states
          ↓
       Living Briefs
          ↓
 Web · Search · RSS · Newsletter · Social · API
```

## Core data model
- **Entity** — company, person, concept, technology, product, organization, country, industry.
- **Source** — provenance record with type and trust tier.
- **Claim** — one factual assertion, its source IDs, confidence, validity interval and freshness class.
- **Relation** — typed relationship between entities.
- **SourceEvent** — newly ingested source material.
- **Brief** — reader-facing synthesis referencing claims/sources.
- **ReviewItem** — proposed change awaiting policy/human decision.
- **ChangeLog** — immutable history of meaningful updates.

This model deliberately stores facts separately from prose. That is what makes large-scale freshness maintenance possible.

## Engine boundaries

### 1. Source Engine — V1
Fetch approved sources through modular adapters. Prefer Tier A primary sources. Source discovery can be broad; fact establishment cannot.

### 2. Event / Story Cluster Engine — V1 basic, V2 semantic
Group multiple reports about the same underlying development. V1 uses deterministic entity/title signals. V2 can add embeddings.

### 3. Entity Engine — V1 schema, V2 richer resolver
Map events and claims to canonical entities and relations.

### 4. Claim Engine — V1
Extract/store atomic factual claims separately from Brief prose. Never overwrite history; supersede claims.

### 5. Freshness Engine — V1
Freshness classes:
- `live`: 1 day verification window
- `current`: 7 days
- `slow`: 90 days
- `static`: 365 days

These are defaults, not editorial absolutes. Source-triggered changes can force immediate review.

### 6. Importance Engine — V1 basic
Weighted score: magnitude, reach, novelty, source strength, persistence, velocity. Used for triage, not truth determination.

### 7. Editorial Engine — V1
Three policies:
- **AUTO** — narrow, objective, high-confidence facts from approved primary sources.
- **REVIEW** — machine-proposed change requiring approval.
- **MANUAL** — sensitive, disputed or interpretive subjects.

V1 starts conservatively: no external event auto-publishes until adapter-specific tests exist.

### 8. Contradiction Engine — V2
Detect incompatible live claims, show source disagreement, prohibit silent resolution.

### 9. Historical State Engine — V1 schema / V2 UI
Claims use validity intervals and supersession. Change log makes “what changed?” and “as of date” possible later.

### 10. Personalization / Brief Me — V3+
Answer from the maintained knowledge database, not directly from unverified web content.

## Daily workflow
1. Cron starts.
2. Fetch active source adapters since previous successful run.
3. Normalize + deduplicate source events.
4. Resolve affected entities.
5. Cluster events into developments.
6. Score importance and source strength.
7. Compare candidate claims against active claims.
8. If unchanged: verify/refresh provenance where appropriate.
9. If objective change: create proposed superseding claim.
10. Route via AUTO/REVIEW/MANUAL policy.
11. Apply approved claims atomically.
12. Recompute affected Brief freshness.
13. Write immutable change log.
14. Revalidate only affected pages.
15. Generate daily “what changed?” candidates.

## Trust rules
- Never fabricate freshness.
- Never update only a date to appear current.
- Primary sources win for direct facts; independent reporting supplies context.
- One weak source cannot silently override a strong active claim.
- Sensitive/medical/political/legal allegations always require manual editorial policy.
- Store what source supports what claim.
- Display corrections and meaningful revisions.
- AI can propose; provenance determines whether anything can publish.

## Public V1 pages
- `/` — Today + living briefs.
- `/brief/[slug]` — standard living brief template.
- `/admin` — V1 freshness/review dashboard (must be authenticated before production).
- `/api/health` — health check.
- `/api/cron/daily` — scheduled engine entrypoint.

Next public pages after V1: `/topics/[slug]`, `/companies/[slug]`, `/changed/[topic]`, `/sources`, `/corrections`, author profiles, search.

## Deployment
- Next.js 16 / React 19.
- Vercel deployment.
- PostgreSQL for structured/historical data.
- Vercel Cron invokes the daily engine.
- `CRON_SECRET` guards the cron endpoint.
- Local UI can run without a DB using explicit demo data; demo mode never pretends to fetch current information.

## Production gates before launch
1. Add authentication + authorization to `/admin`.
2. Provision Postgres; apply `db/schema.sql`.
3. Seed entities/briefs/sources.
4. Add 5–10 Tier A source adapters for the first topic vertical.
5. Persist daily-run state and source-event fingerprints.
6. Implement claim-change persistence transaction.
7. Add audit logging and rollback.
8. Add rate limits / timeouts / adapter failure isolation.
9. Add tests with fixed source fixtures.
10. Add sitemap, RSS, Article JSON-LD, authorship, corrections and editorial-policy pages.
11. Add monitoring/alerting for failed cron runs or stale critical claims.
12. Security review before any AUTO publication mode is enabled.

## Initial editorial scope
Start with 50–100 high-quality living briefs in a tight cluster rather than thousands of generated pages. Recommended first graph:
- AI agents
- AI models
- inference
- model context / tool use
- AI chips
- data centers
- OpenAI
- Anthropic
- Google DeepMind
- Microsoft
- NVIDIA
- AMD
- major regulation / enterprise adoption concepts

Then expand into adjacent business/markets only after freshness SLAs are consistently met.

## Roadmap
### Phase 0 — foundation (implemented in this scaffold)
Data contracts, schema, demo publication UI, living Brief template, freshness algorithm, deterministic event clustering, importance scoring, cron orchestration contract, admin review preview.

### Phase 1 — operational V1
Real database, auth, source adapters, persistence, review actions, change log UI, 50–100 briefs, SEO infrastructure.

### Phase 2 — intelligence
Semantic clustering, entity resolver, contradiction detection, topic dashboards, “what changed?”, richer timelines, source reliability statistics.

### Phase 3 — proprietary data
Signals, indexes, watchlists, original datasets, newsletters/social distribution, user accounts and alerts.

### Phase 4 — Brief Me / Pro
Historical queries, personalized catch-up, advanced exports, research workspaces and API access.

## Success metrics
- % of active claims inside freshness SLA.
- Median time from authoritative source change → verified Brief update.
- % of claims with Tier A/B provenance.
- Corrections per 1,000 claims and correction latency.
- Returning readers / newsletter subscribers.
- Organic citations/backlinks to original Briefs data.
- Search/AI referral visibility without sacrificing direct audience growth.

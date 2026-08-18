# Briefs.blog canonical system registry

This file is the non-negotiable scope ledger. No later release may silently delete a system. A system may move from **foundation → operational → mature**, but it remains tracked through V10.

## Core roadmap — maximum ten major versions
- V1 — publication foundation — complete
- V2 — reliable intelligence pipeline — complete/foundation
- V3 — knowledge intelligence — complete/foundation
- V4 — autonomous editorial foundation — complete/foundation
- V5 — living knowledge MVP — complete/foundation
- V6 — research & source-discovery engine — complete/foundation
- V7 — query intelligence, finance routing & change-intelligence expansion — complete/foundation
- V8 — personal intelligence, context, evidence inspection & security integration — current
- V9 — authority/distribution: SEO, answer-engine visibility, feeds, audio, API — planned
- V10 — production integration, scale, security, observability and product completion — planned

Patch releases such as V4.1 do not consume a major-version slot.

## Reliability & orchestration
- Source registry — operational
- RSS/structured adapters — foundation
- Normalization — foundation
- Deduplication — operational/foundation
- Intelligence runs — operational
- Durable job queue — operational
- Leases, heartbeats, stale-job recovery — operational
- Retries/backoff — operational
- Idempotency — operational
- Circuit breaking/source isolation — operational
- Dead-job handling — operational
- Ingestion checkpoints — V5 operational foundation
- Graceful degradation / last-safe-state philosophy — operational
- Health/status endpoints — operational
- Observability dashboard — foundation; V10 mature

## Knowledge intelligence
- Semantic understanding — foundation
- Entity resolution + aliases/identifiers — foundation
- Event model/clustering — foundation
- Claim model — operational foundation
- Claim history/versioning — foundation
- Evidence graph — foundation
- Source independence/authority tiers — foundation
- Verification engine — foundation
- Contradiction engine — foundation
- Knowledge graph — foundation
- Temporal validity — foundation
- Historical snapshots/state — foundation
- Freshness engine — foundation
- Change detection/intelligence — foundation
- Impact mapper — foundation
- Contextual importance — foundation
- Coverage-gap engine — foundation
- Topic authority scoring — foundation
- Quality evaluation — foundation
- V5 Knowledge Store — operational
- V5 source packs — operational foundation
- V5 verified starter corpus — operational

## Editorial intelligence
- Editorial policy engine — operational foundation
- AUTO / REVIEW / MANUAL routing — operational
- Section dependency mapping — operational foundation
- Editorial revision proposals — operational foundation
- Brief Composer — operational deterministic core; V7 intent-specific answer contracts operational foundation
- Editorial review queue — operational
- Transactional publishing — operational foundation
- Approval/rejection/defer — operational
- Rollback — operational foundation
- Correction log — operational foundation
- Citation maintenance — foundation
- Freshness maintenance — foundation
- Internal-link intelligence — foundation
- Sensitive/high-risk manual routing — operational

## Brief Me product
- Minimal `Brief me on` homepage — operational
- Interactive Brief Me — operational
- BriefRequest → BriefPlan → BriefResult — operational
- Database-first Fast Path — V5 operational
- Verified fallback path — V5 operational
- Depth selector — operational foundation
- Perspective selector — operational; V7 automatically applies investor lens to finance queries unless explicitly overridden
- Evidence list — V5 operational
- Claim-level evidence counts — V6 operational foundation
- Evidence drawer/claim-level inspection — V8 operational
- Explicit knowledge cutoff — operational
- Research-needed state — operational
- Research request persistence — V5 foundation
- Follow-up conversational context storage — V8 operational foundation; DB persistence when Postgres is configured
- Compare/query decomposition — V6 foundation; V8 comparison surface operational foundation
- “What changed?” — V7 operational foundation for finance/current queries; continuous maintenance continues through V8/V10
- “Since I was here” — V8 operational foundation (local + DB-backed read state)
- Read/listen/watch/export renderers — V9 planned

## Research & discovery
- Question decomposition — V6 operational foundation
- Targeted external research orchestrator — V6 operational
- Keyless Wikipedia provider — V6 operational
- Keyless Wikidata structured provider — V6 operational
- Provider time budgets / failure isolation — V6 operational
- Source discovery/ranking — V6 operational foundation
- Source-family independence detection — V6 operational foundation
- Missing-evidence acquisition — V6 operational foundation
- Temporary research graph / staged findings — V6 operational
- Research-run/evidence/finding persistence — V6 operational when Postgres is configured
- Reviewed knowledge insertion — V6 data foundation; admin promotion workflow matures V8/V10
- Research context storage — V6 foundation
- Query Intent Engine — V7 operational
- Intent-specific Answer Contracts — V7 operational foundation (market snapshot, market move, financials, current/reference)
- SEC company/ticker resolver — V7 operational
- SEC filings/XBRL provider — V7 operational
- Optional market quote adapter — V7 operational foundation
- GDELT current-reporting discovery — V7 operational foundation
- Query-intent observation persistence — V7 operational when Postgres is configured
- Market snapshot persistence — V7 operational when Postgres is configured
- Change-candidate persistence — V7 operational when Postgres is configured
- Competitive prompt evaluation harness — V7 operational
- Emerging-topic detection — V10
- Velocity/trend engine — V10
- Briefs Signals — V9/V10
- Proprietary indexes/datasets — V9/V10

## Query intelligence & domain routing
- Query Intent Engine — V7 operational
- Domain routing: finance / current / reference / general — V7 operational
- Effective perspective routing — V7 operational foundation
- Freshness requirement routing — V7 operational foundation
- Source-policy controls — V7 operational UI + API
- SEC primary financial evidence — V7 operational
- Optional licensed/specialist quote adapter — V7 operational foundation
- Current reporting discovery — V7 operational foundation
- Finance `What changed` candidates — V7 operational foundation
- Query evaluation/benchmark suite — V7 operational

## Personal intelligence
- Reader accounts — V8 operational when Postgres is configured
- Password security (scrypt + per-password salt) — V8 operational
- Opaque reader sessions / hashed token persistence — V8 operational
- Reader preferences — V8 operational when Postgres is configured
- Local-first follows — V8 operational without database
- Synced follows/watchlists — V8 operational when Postgres is configured
- Brief Packs — V8 operational when Postgres is configured
- Reading state / since-last-visit — V8 operational foundation
- Change inbox — V8 operational when Postgres is configured
- Daily personal digest generation — V8 operational foundation; external email delivery V9
- Finite “you’re caught up” experience — V8 operational
- Conversation/turn persistence — V8 operational foundation
- Pro tier/premium data controls — V9/V10

## V8 integration & security
- Admin UI authentication gate before server-rendered DB reads — V8 operational
- Hashed HttpOnly admin session cookie — V8 operational
- Personal query account scoping — V8 operational
- Claim-level evidence inspection UI — V8 operational
- Brief Context follow-up carry-forward — V8 operational foundation
- Iterative research-gap evaluator — V8 operational foundation
- Bounded second-pass refinement — V8 operational foundation
- Comparison cards — V8 operational foundation
- Personal change-notification generation integrated into daily run — V8 operational foundation

## Authority, distribution & product surfaces
- Canonical public Brief URLs — foundation, V9 mature
- Structured data / citations / provenance — V9
- SEO and answer-engine readiness — V9
- RSS/news feeds/sitemaps — V9
- Email briefings — V8/V9
- Audio/watch renderers — V9
- Briefs API / exports — V9
- Enterprise/team workspaces — V10
- Security hardening, auditability and scale testing — V10

# Briefs.blog canonical system registry

This file is the non-negotiable scope ledger. No later release may silently delete a system. A system may move from **foundation → operational → mature**, but it remains tracked through V10.

## Core roadmap — maximum ten major versions
- V1 — publication foundation — complete
- V2 — reliable intelligence pipeline — complete/foundation
- V3 — knowledge intelligence — complete/foundation
- V4 — autonomous editorial foundation — complete/foundation
- V5 — living knowledge MVP — complete/foundation
- V6 — research & source-discovery engine — current
- V7 — daily change intelligence & continuous maintenance — planned
- V8 — personal intelligence, accounts, packs & alerts — planned
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
- Brief Composer — operational deterministic core; richer composition through V6–V7
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
- Perspective selector — UI operational; semantic tailoring matures V7
- Evidence list — V5 operational
- Claim-level evidence counts — V6 operational foundation
- Evidence drawer/claim-level inspection — V7 planned
- Explicit knowledge cutoff — operational
- Research-needed state — operational
- Research request persistence — V5 foundation
- Follow-up conversational context storage — V6 foundation; product conversation loop V7
- Compare/query decomposition — V6 foundation; full entity comparison surface V7
- “What changed?” — V7 planned product surface
- “Since I was here” — V8 planned
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
- Reviewed knowledge insertion — V6 data foundation; admin promotion workflow matures V7
- Research context storage — V6 foundation
- Emerging-topic detection — V7
- Velocity/trend engine — V7
- Briefs Signals — V7/V9
- Proprietary indexes/datasets — V9/V10

## Personal intelligence
- Accounts/preferences — V8
- Follows/watchlists — V8
- Brief Packs — V8
- Reading state / since-last-visit — V8
- Alerts and daily brief — V8
- Finite “you’re caught up” experience — V8
- Pro tier/premium data controls — V9/V10

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

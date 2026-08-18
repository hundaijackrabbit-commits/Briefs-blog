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
- V8 — personal intelligence, context, evidence inspection & security integration — complete/foundation
- V9 — authority/distribution: SEO, answer-engine visibility, feeds, listen, email, API & exports — complete/foundation
- V10 — MVP completion: persistent research memory, iterative research, living monitoring, signals, operations, security and final integration — complete

Patch releases and post-MVP product releases such as V4.1 and Publication Engine 1.1 do not consume a major-version slot.

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
- Observability dashboard / operational snapshot — V10 operational foundation

## Knowledge intelligence
- Semantic understanding — operational foundation
- Entity resolution + aliases/identifiers — foundation
- Event model/clustering — foundation
- Claim model — operational foundation
- Claim history/versioning — operational foundation
- Evidence graph — operational foundation
- Source independence/authority tiers — foundation
- Verification engine — operational foundation
- Contradiction engine — operational foundation; V10 surfaces structured disagreement in Brief results
- Knowledge graph — operational foundation
- Temporal validity — operational foundation
- Historical snapshots/state — operational foundation; V10 prior-state follow-up path
- Freshness engine — operational foundation
- Change detection/intelligence — operational foundation; V10 separates editorial change candidates from reader-facing observed changes
- Impact mapper — operational foundation
- Contextual importance — foundation
- Coverage-gap engine — operational foundation
- Topic authority scoring — foundation
- Quality evaluation — operational; V10 quality score/warnings on each Brief result
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
- Citation maintenance — operational foundation
- Freshness maintenance — operational foundation
- Internal-link intelligence — operational foundation
- Sensitive/high-risk manual routing — operational

## Brief Me product
- Minimal `Brief me on` homepage — operational
- Interactive Brief Me — operational
- BriefRequest → BriefPlan → BriefResult — operational
- Database-first Fast Path — V5 operational
- Verified fallback path — V5 operational
- Depth selector — operational foundation
- Perspective selector — operational; V7 automatically applies investor lens to finance queries unless explicitly overridden
- Reader-targeted Brief phrasing — Publication Engine 1.1 operational foundation; explicit perspectives shape the opening instead of writing to an undefined audience
- Evidence list — V5 operational
- Claim-level evidence counts — V6 operational foundation
- Evidence drawer/claim-level inspection — V8 operational
- Explicit knowledge cutoff — operational
- Research-needed state — operational
- Research request persistence — operational foundation
- Follow-up conversational context storage — operational; DB persistence when Postgres is configured; V10 evidence/prior-state follow-up intents
- Compare/query decomposition — operational foundation; comparison surface operational
- “What changed?” — operational foundation for finance/current queries; V10 tracked-subject refresh + observed-change persistence
- “Since I was here” — V8 operational foundation (local + DB-backed read state)
- Read/listen/export renderers — operational; visual/watch storyboard remains post-MVP expansion

## Research & discovery
- Question decomposition — V6 operational foundation
- Targeted external research orchestrator — V6 operational
- Keyless Wikipedia provider — V6 operational
- Keyless Wikidata structured provider — V6 operational
- Provider time budgets / failure isolation — operational; V10 provider health telemetry
- Source discovery/ranking — operational foundation; V10 safe discovered-page corroboration
- Source-family independence detection — V6 operational foundation
- Missing-evidence acquisition — operational; bounded multi-pass refinement
- Temporary research graph / staged findings — V6 operational
- Research-run/evidence/finding persistence — operational when Postgres is configured
- Persistent research memory — V10 operational when Postgres is configured; reviewed claim promotion remains editorially guarded
- Research context storage — operational foundation
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
- Emerging-topic detection — V10 operational foundation via observed-change Signals
- Velocity/trend engine — V10 operational foundation (7-day vs prior-window velocity)
- Briefs Signals — V10 operational foundation
- Briefs-owned Signals index — V10 operational foundation; external premium/proprietary datasets remain post-MVP integrations

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
- Daily personal digest generation — V8 operational foundation; V9 optional external email delivery operational
- Finite “you’re caught up” experience — V8 operational
- Conversation/turn persistence — V8 operational foundation
- Pro tier/premium data controls — post-MVP commercial layer; source-policy/entitlement hooks preserved

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
- Canonical public Brief URLs — V9 operational
- Structured data / citations / provenance — V9 operational foundation
- SEO and answer-engine readiness — V9 operational foundation
- RSS/news feeds/sitemaps — V9 operational
- Email briefings — V9 operational when email provider is configured
- Browser listen renderer — operational; generated audio/video media is post-MVP expansion
- Briefs public API v1 / Markdown, CSV, JSON exports — V9 operational foundation
- Enterprise/team workspaces — post-MVP expansion (not required for the completed consumer MVP)
- Security hardening / auditability — V10 operational foundation; large-scale load testing continues operationally after MVP

## V9 authority & distribution
- Public Brief index — operational
- Canonical public Brief renderer — operational
- Per-Brief dynamic metadata / canonical URLs — operational
- Article + breadcrumb JSON-LD — operational
- Organization + WebSite/SearchAction structured data — operational
- Claim-level public evidence links — operational
- Public methodology/trust page — operational
- App Router sitemap + robots metadata routes — operational
- RSS feed — operational
- News sitemap — operational for recent database-backed published Briefs
- llms.txt discoverability resource — operational informational surface
- Public API v1 — operational foundation with rate limiting
- Markdown / CSV / JSON exports — operational
- Browser speech-synthesis listen mode — operational foundation
- Digest email delivery adapter — operational when Resend credentials are configured
- Distribution delivery audit table — operational foundation
- Public API observation table — operational foundation
- Developer documentation surface — operational
- Ephemeral query/personal surfaces marked noindex — operational
- Dynamic social preview image — operational foundation

## V10 MVP completion
- V10 — MVP completion — complete
- Production readiness contract — operational (`DATABASE_URL`, `ADMIN_TOKEN`, `CRON_SECRET`, canonical base URL; optional market/email providers reported separately)
- Persistent research memory — operational with Postgres, freshness-aware TTLs
- Living research-state comparison — operational; changes persist to `observed_changes` without colliding with editorial `change_candidates`
- Bounded iterative research — operational with hard provider budgets, gap evaluation, no-progress stopping and maximum refinement passes
- Safe discovered-page corroboration — operational; only ranked public discovered URLs are fetched and private/local hosts are rejected
- Scholarly evidence discovery — operational via OpenAlex
- Current reporting discovery — operational via GDELT
- Finance specialization — operational via SEC + optional market quote provider
- Evidence and previous-state follow-up intents — operational foundation
- Per-Brief quality scoring / warnings — operational
- Structured contradiction surfacing — operational foundation
- Tracked-subject autonomous refresh — operational foundation in the daily engine
- Emerging-topic / velocity Signals — operational foundation
- Provider health + runtime observations — operational foundation
- Admin operations surface — operational and protected by the admin gate
- Security response headers — operational
- DB doctor / final architecture gate / production adversarial evaluation — operational
- Safe degraded mode remains a product requirement: missing DB/provider data never authorizes fabricated freshness or invented citations

## Publication Engine 1.1 — post-MVP publication intelligence
- Publication Engine 1.1 — operational foundation; post-MVP release, not V11
- Keyword Watcher — operational
- Story Opportunity Engine — operational foundation
- Reader Demand / Audience Engine — operational foundation
- Reader Contract — operational
- Authorial Voice Engine — operational
- Claim-grounded Article Composer — operational foundation
- Optional provider-neutral writer adapter — operational interface
- Source-language Originality Engine — operational foundation
- Internal-library similarity check — operational foundation
- Publication Quality Engine — operational
- Content Dependency Engine — operational foundation
- Publication Impact / affected-section detection — operational foundation
- Daily Revalidation Engine — operational
- Revision Intelligence Engine — operational foundation
- Publication Freshness Engine — operational
- Durable publication revalidation queue + stale lease recovery — operational
- Publication update proposals — operational
- Article version history — operational
- Public Briefings index + article renderer — operational
- Article evidence surface — operational
- AUTO / REVIEW / MANUAL publication routing — operational foundation
- Living Brief claim supersession path — operational foundation when strong revalidated claims are approved/auto-enabled
- Safe no-op revalidation — operational: unchanged knowledge does not rewrite prose or fake a substantial update
- Existing daily intelligence cron schedules publication work; bounded publication cron processes the queue in batches

V10 closes the ten-version MVP roadmap. Future work is normal post-MVP iteration, commercial integrations, scale work, or product expansion rather than another promised architecture version.

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

## V10.2 Reader Intelligence & Editorial Refinement — post-MVP
- Reader Intelligence Engine — operational foundation; infers reader goal, expertise, time budget and audience without forcing a questionnaire
- Answer Contract / Answer Planner — operational; defines objective, opening, evidence rules, uncertainty rules, required content and avoid-list before composition
- Grounded Reader Composer — operational; deterministic fallback plus optional provider-neutral answer writer bound to retrieved claim IDs
- Reader-aware fact selection — operational; changes information selection/order by investor, executive, developer, student, marketer and general-reader needs
- Answer Quality Engine — operational; directness, audience fit, grounding, clarity, uncertainty and specificity are scored separately from evidence quality
- Answer-quality telemetry — operational when Postgres is configured
- Story Angle Intelligence — operational; produces and ranks multiple evidence-bounded angles before drafting
- Publication Saturation Penalty — operational; reduces story score when recent Briefs already cover substantially similar territory
- Story Contract — operational; locks thesis, why-now, reader outcome, differentiator, supporting claims, counter-claims and cannot-claim rules before prose generation
- Audience Fit Grader 2 — operational; replaces the synthetic default audience score with semantic/heuristic fit scoring
- Briefs Voice 2 — operational; checks stock phrasing, repetitive cadence, repeated paragraph starts, label-colon constructions and weak-verb density
- Headline Evidence Gate — operational foundation
- Specificity Gate — operational foundation
- Factual-section grounding gate — operational; factual article sections require mapped research claim IDs
- Reader-specific Brief UI metadata — operational foundation
- Answer Quality Lab — operational foundation via V10.2 regression/evaluation harness
- Provider-neutral structured answer and article writer contracts — operational interfaces; deterministic safe fallbacks remain available
- V10.1 daily revalidation and update architecture remains preserved; V10.2 revisions preserve article meaning while improving reader/audience checks

## Publication Engine 1.2.1 — Global Importance + Daily Distinctiveness
- Global Event Discovery Engine — operational foundation; scans multiple world-news categories plus explicit regional sweeps before editorial selection
- Geographic Normalization — operational; records region and source-country breadth so global importance is not inferred from North American attention alone
- Global Event Clustering — operational; groups overlapping coverage into event candidates before scoring
- Global Importance Engine — operational; scores geographic reach, human consequence, economic consequence, political/institutional impact, long-term consequence, surprise/velocity, public attention and evidence breadth
- Daily Distinctiveness Engine — operational; compares each candidate with the prior 60 days of flagship selections and penalizes repeated event/entity/category territory
- Material Change Override — operational; permits continued coverage of the same world event when the underlying world-state materially changes
- Daily Flagship Ledger — operational; permanently records one editorial winner per UTC day, its rationale, scores, regions and links to research/article objects
- Global Flagship Research Bridge — operational; the winner enters the existing V10.2 deep-research, story-angle, Story Contract, originality, audience, voice and evidence gates rather than bypassing them
- Global Scope Rule — canonical; the daily question is “What is the single most consequential thing happening in the world today that an informed person should understand?” Popularity is a signal, not the editorial objective
- Distinctiveness Rule — canonical; different by default, continuous only when reality genuinely changes
- Hobby-safe Daily Automation — operational; one publication cron per day (18:30 UTC) performs global selection after much of the global news day has developed, then runs bounded publication maintenance

- Autonomous Daily Article Exclusivity — operational; scheduled watched-keyword research creates opportunities but does not draft competing articles, reserving the automatic daily writing slot for the global flagship
- Publishability Fallback — operational; if the highest-ranked world event fails deep research/article gates, up to two lower-ranked candidates may be attempted and the fallback reason is persisted
- Angle-form Distinctiveness — operational; recent Story Contract angle keys are penalized and deterministic section structure varies by angle so daily differentiation is not only topical

## Publication Engine 1.2.2 — Event Identity & Research Alignment
- Event Identity Engine — operational deterministic foundation; each global candidate carries an immutable event anchor with distinctive topic/entity terms, canonical action terms, geography and event time
- Cluster Coherence Gate — operational; broad regional similarity cannot by itself merge unrelated headlines into one event candidate
- Anchor-Preserving Retrieval — operational; research queries may broaden discovery but may not redefine the selected event
- Research Subject Alignment Engine — operational; every publication research source is scored against the selected event before source counts, family diversity, story scoring or writer context
- Negative Event-Match Penalty — operational foundation; unrelated event classes actively reduce relevance even when geography overlaps
- Temporal Alignment Gate — operational foundation; current/live research distinguishes current, aging and stale aligned evidence
- Alignment-First Source Diversity — canonical; source authority and independence are evaluated only after event relevance is established
- Graph Alignment Gate — operational; autonomous flagship drafting requires sufficient aligned sources, independent aligned families, coverage and an overall alignment score
- Bounded Alignment Repair — operational; failed first-pass alignment triggers at most two anchor-preserving repair queries and reranks the resulting graphs
- Alignment Provenance / Telemetry — operational through persisted research graph JSON; selected subject, anchor, attempted queries, per-source scores, rejected/stale IDs and aggregate metrics are retained
- Near-Miss Regression Suite — operational; explicitly guards against same-geography/wrong-event retrieval and broad-query collapse
- Canonical law — broad context can expand discovery, but it cannot redefine the event
- Canonical law — source authority and diversity are evaluated only after event relevance is established

## Publication Engine 1.2.2 — Deterministic Synthesis & Alignment Calibration
- Deterministic Synthesis Repair — operational; reporting headlines are treated as evidence inputs and are synthesized into independent prose rather than lightly substituted source language
- Domain-Aware Writing Layer — operational foundation; deterministic analysis, deck and watch sections distinguish Markets, Health, Policy, Technology, Business, Science, World and general contexts
- Event-Specific Watch Logic — operational foundation; forward-looking sections use observable follow-ups appropriate to the evidence domain rather than a universal health-style template
- Originality Diagnostics — operational; similarity checks retain the strongest matched source/article, exact phrase and match length without weakening originality thresholds
- Geography Calibration — operational; supporting headlines cannot inject incidental geography into the selected event unless geography is present in the subject or repeated across a majority of support titles
- Dynamic Alignment Dimensions — operational; absent action or geography dimensions are omitted from weighting instead of automatically scoring 100
- Market Movement Action Normalization — operational; verbs such as hit, reach, rise, fall, slide and climb map to the event action `move`
- Canonical law — originality failures are repaired in synthesis, never by lowering the originality gate

## Publication Engine 1.2.2 — Raw Evidence Alignment & Evidence Depth Repair
- Raw Evidence Alignment Gate — operational; a source must establish relevance from its own title/excerpt evidence, not from an assigned canonical finding subject
- Subject-Label Contamination Guard — operational; `finding.subject` is excluded from source-match evidence
- Pairwise Cluster Coherence — operational; clustered headlines must agree with one another, not merely share weak terms with a seed
- Eventhood Gate — operational; editorial framing cannot substitute for an observable change event
- Raw Distinctive-Term Minimum — operational; multi-term events require multiple anchor terms or a supported topic+action combination in raw source material
- Evidence Depth Gate — operational; every publishable article needs a dedicated claim-backed evidence section
- Factual Section Distribution Gate — operational; stories with three or more findings require at least two separately claim-backed factual sections
- Empty Evidence Placeholder Block — operational; “no distinct second factual section” style placeholders fail publication quality
- Canonical law — evidence relevance must be earned by the underlying source material; metadata assigned by Briefs cannot validate itself

## Publication Engine 1.2.2 — Discovery Candidate Integrity
- High-Signal Anchor Filter — operational; generic framing terms such as `piece`, `supply`, `chain`, `market`, and `industry` cannot establish event identity on their own
- Candidate Eventhood Gate — operational; eventhood is evaluated before a discovery candidate can reach deep research
- Candidate Pairwise Coherence — operational; source headlines must agree with one another, not merely with a broad seed
- High-Signal Support Count — operational; multi-source candidates require independent title-level support for distinctive event terms or a concrete action
- Discovery Integrity Score — operational; cluster coherence, eventhood, pairwise agreement, high-signal support, and anchor agreement are combined into an upstream integrity score
- Integrity-Aware Ranking — operational; discovery integrity adjusts final ranking before deep research
- No Unsafe Viability Fallback — operational; if no candidate passes integrity + global-importance viability gates, the daily pipeline fails closed instead of researching a weak fallback
- Dynamic Event Alignment Dimensions — operational; absent topic, action, or geography dimensions do not dilute event-match scores
- Action Coverage Telemetry Fix — operational; absent action terms now report 0 coverage while remaining neutral in the composite alignment score
- Canonical law — deep research is reserved for candidates that already demonstrate a coherent, observable event in discovery signals

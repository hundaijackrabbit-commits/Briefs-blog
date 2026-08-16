# V2 Implementation Status

Implemented in this ZIP:

- Expanded Postgres intelligence schema
- Source registry health fields and circuit breaker state
- Intelligence runs and durable job table
- Worker leases, heartbeats, retries, stale recovery and dead-letter state
- RSS/Atom source adapter with request timeout and retry
- Document normalization and SHA-256 deduplication
- Basic event clustering and importance scoring
- Entity matching/enrichment foundation
- Claim/evidence/verification schema and verification policy helpers
- Contradiction detection foundation
- Freshness scoring
- Impact mapping foundation
- Editorial automation policy (AUTO / REVIEW / MANUAL)
- Protected daily cron endpoint
- Protected worker endpoint
- Duplicate-run Postgres advisory lock
- Admin intelligence cockpit
- Living Brief rendering foundation
- Reliability failure-mode documentation
- Static repository/import check script

Deliberately extension-ready rather than falsely complete:

- Source-specific structured claim extractors
- LLM-assisted semantic extraction and clustering
- Human review mutation UI
- Transactional safe-publish worker
- Semantic/vector retrieval
- Personalized Brief Me
- Proprietary Signals/indexes

The pipeline fails closed: missing or weak evidence must not auto-publish a factual change.

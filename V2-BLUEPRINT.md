# Briefs.blog V2 Blueprint

## Goal
A daily-maintained information database with a publication on top. V2 prioritizes correctness, provenance, failure recovery, and editorial control over autonomous mass publishing.

## Daily flow
Scheduler → Intelligence Run → Source Jobs → Normalize → Dedupe → Event → Entity match → Candidate Claims → Verify → Compare → Freshness → Impact → Importance → Editorial policy → Review queue / safe publish → Change log → Run reconciliation.

## Publication modes
- AUTO: objective, strongly sourced, low-risk structured changes only.
- REVIEW: AI/system proposes; editor approves or rejects.
- MANUAL: sensitive, disputed, interpretive, medical, legal, political, allegations, and other high-risk material.

## Reliability
Jobs have leases, heartbeats, max attempts, exponential retry, dead-letter state, idempotency keys and per-source circuit-breaker state. Stale jobs can be recovered without replaying completed work.

## V3 hooks
Semantic clustering, embeddings, personalized watchlists, Brief Me retrieval, historical snapshots, proprietary Signals and indexes are deliberately left as extension points.

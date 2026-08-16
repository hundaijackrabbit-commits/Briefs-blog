# Briefs.blog V5 — Living Knowledge MVP

V5 is the first release where the product can answer a real Brief without requiring every future system to be complete.

## Product milestone
`Brief me on WW2` must return a sourced, evidence-backed briefing instead of a database configuration error.

## Runtime architecture
1. Brief request is normalized into `BriefRequest`.
2. Knowledge Store attempts the production database first.
3. If the database is unavailable or lacks the entity, the verified starter corpus is used.
4. Claims and evidence are composed into a deterministic `BriefResult`.
5. Coverage gaps return `researchNeeded=true`; with a database configured they are queued into `research_requests` for the V6 research engine.
6. The UI exposes source mode, confidence, evidence and knowledge cutoff.

## V5 systems
- Knowledge Store abstraction — implemented
- Database-first / verified-fallback routing — implemented
- Starter source packs — implemented
- Starter evergreen knowledge — implemented (WW2 + AI baseline)
- Evidence display — implemented
- Research request queue — implemented foundation
- Source pack tables — implemented
- Ingestion checkpoints — implemented
- DB bootstrap tooling — implemented
- Knowledge status endpoint — implemented
- Brief API no longer hard-fails when DATABASE_URL is absent — implemented
- V2 reliability, V3 graph/intelligence and V4 editorial systems — preserved

## Safety rule
The fallback corpus is curated and finite. Unknown topics become explicit coverage gaps. V5 never turns the fallback into an excuse to fabricate current facts.

## Next
V6 adds targeted external research, source discovery, question decomposition, evidence acquisition and reviewed insertion back into the knowledge graph.

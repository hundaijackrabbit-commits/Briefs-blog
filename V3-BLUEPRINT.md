# V3 Blueprint — Knowledge Intelligence

## Purpose

V2 made ingestion resilient. V3 makes the resulting information queryable as structured knowledge. The architecture is intentionally aimed at the future question: **“Brief me on ___.”**

## Knowledge path

Source document → event cluster → semantic frame → entity resolution → evidence graph → temporal claims → meaningful change → historical state → Brief plan → Brief result.

## Brief object

A Brief is no longer just a page. `BriefRequest` describes subject, time window, depth, perspective, source policy, freshness and output format. `BriefPlan` resolves the entities and identifies claims, changes and evidence gaps. `BriefResult` is a renderer-neutral answer object that later versions can display as web, chat, audio, email or API output.

## Two paths

### Fast path
Existing verified knowledge → current claims → recent changes → importance → Brief Composer.

### Research path
If entity resolution fails, verified claims are sparse, or evidence quality is weak, `researchNeeded=true`. V3 deliberately does not fabricate missing knowledge. A later research orchestrator can fill the gap and submit new evidence through the same verification path.

## Data additions

V3 adds entity identifiers, normalized event/entity links, semantic annotations, evidence independence/directness, claim versions, knowledge snapshots, brief sections and dependencies, Brief request/result persistence, coverage scores, quality evaluations and change candidates.

## Reliability inheritance

All V2 reliability rules remain: idempotent jobs, bounded retries, worker leases, stale-job recovery, source circuit breakers, duplicate suppression and failure isolation. New V3 stages use the same queue model.

## V4 handoff

V4 should build the autonomous editorial layer on top of these contracts:

1. domain-aware claim extractors,
2. evidence-aware change approval,
3. section dependencies,
4. old/new revision proposals,
5. editorial review actions,
6. transactional publishing,
7. rollback/corrections,
8. internal-link maintenance,
9. public change histories,
10. automatic freshness revalidation.

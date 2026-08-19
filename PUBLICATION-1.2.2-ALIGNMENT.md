# Publication Engine 1.2.2 — Event Identity & Research Alignment

This release closes a failure mode where a globally selected event could broaden into a topically adjacent but different research topic.

## Canonical laws

**Broad context can expand discovery, but it cannot redefine the event.**

**Source authority and diversity are evaluated only after event relevance is established.**

## Pipeline

Selected event
→ Event Anchor
→ Cluster Coherence Gate
→ Anchor-Preserving Query
→ Deep Research
→ Source Event-Match Scoring
→ Temporal / stale-state filtering
→ Research Subject Alignment Gate
→ bounded repair queries when needed
→ aligned evidence graph
→ existing Story Contract / originality / reader-ready / publication gates

## Event Anchor

Each global candidate now carries a deterministic event identity:
- selected subject
- distinctive topic/entity terms
- canonical action/event terms
- geography
- event time

Geography is deliberately weak evidence. A source cannot qualify merely because it mentions the same region.

## Cluster Coherence

Discovery still uses headline similarity as a signal, but titles must also match the event anchor. Broad regional clusters are split down to coherent members before global ranking. `clusterCoherence` is carried with the candidate and becomes part of the later research-alignment decision.

## Anchor-Preserving Retrieval

`researchQuery` is a search strategy, not the definition of the event. The selected subject remains immutable context.

If a query collapses into broad geography, Briefs reconstructs it from the event anchor. For example:

`middle east`

cannot stand in for:

`Middle East Banks Grow African Presence`

The anchored query retains distinctive terms such as `bank` and the canonical action `expand`.

## Source Alignment

Every retrieved source is scored against:
- event topic/entity overlap
- action/event overlap
- geography
- time
- independent corroboration
- negative event mismatch

A credible but unrelated source is rejected before source counts, family diversity, story scores, article claims, or writer context are calculated.

## Temporal alignment

Current/live publication research separates current, aging, and stale aligned sources. Old but topically similar material may remain useful elsewhere in Briefs, but it cannot establish the current state of a live flagship event.

## Graph Alignment Gate

For autonomous flagship publication research:
- overall subject-alignment score must be at least 70/100
- at least 3 sources must align to the selected event
- at least 2 independent aligned source families are required
- when six or more sources were retrieved, at least 45% must align
- discovery cluster coherence must remain at least 52/100 when supplied

Failure occurs **before article composition**.

## Bounded repair

If the first anchored research pass fails alignment, Briefs tries at most two additional anchor-preserving query variants in parallel and chooses the graph with the strongest alignment score.

This is deliberately bounded for Vercel/serverless reliability.

## Provenance

The persisted research graph now records:
- selected subject
- Event Anchor
- all attempted queries
- per-source alignment scores
- aligned source IDs
- rejected source IDs
- stale source IDs
- independent aligned-family count
- topic/entity coverage
- action coverage
- temporal alignment
- cluster coherence
- overall alignment score
- repair status
- failure reasons

## Regression cases

The 1.2.2 near-miss suite explicitly checks:
- same geography, correct event
- same geography, wrong trafficking event
- same geography, wrong military event
- broad-query collapse
- coherent cluster vs mixed regional cluster

No embedding provider or paid semantic service is required for this foundation. Semantic embeddings may become an additional signal later; they must not replace deterministic event identity and evidence gates.

# Briefs.blog V6 — Research & Source Discovery Engine

V6 changes the meaning of a coverage gap. V5 could identify that Briefs did not know enough. V6 attempts bounded external research, stages the evidence, and answers only when it can construct a defensible baseline.

## Acceptance test

`Brief me on Austin Powers`

Expected behavior:
1. Fast Path checks the production Knowledge Store and starter corpus.
2. The missing topic triggers V6 research automatically.
3. Question decomposition resolves the subject and intent.
4. Keyless Wikipedia and Wikidata providers run in parallel under hard time budgets.
5. Findings are normalized into a temporary research graph with provenance.
6. Source ranking and independence checks determine whether the answer is sufficient.
7. Brief Composer returns a researched baseline with evidence links.
8. If evidence is still weak, the answer is marked `Researched · verify`; Briefs never upgrades weak evidence into false certainty.
9. With Postgres configured, the research run, evidence, and staged findings are persisted for review and later promotion into the durable knowledge graph.

Austin Powers is intentionally **not** hard-coded into the starter corpus. It exercises the generic research path.

## V6 engines

- Question Decomposition Engine
- Targeted Research Orchestrator
- Wikipedia research provider
- Wikidata structured-entity provider
- Provider time-budget / graceful-degradation layer
- Source Discovery and ranking
- Source-family independence detection
- Temporary Research Graph
- Research persistence (`research_runs`, `research_evidence`, `research_findings`)
- Research Context storage foundation
- Evidence-aware Brief composition
- Research source mode in the public UI

## Safety behavior

V6 is intentionally conservative. Wikipedia/Wikidata can provide broad baseline coverage without API keys, but both belong to the Wikimedia source family. Briefs therefore does not pretend that two Wikimedia endpoints equal two independent confirmations. It can return a useful researched baseline at medium confidence while explicitly flagging the remaining corroboration gap.

Time-sensitive questions receive an additional freshness warning until primary/current source adapters corroborate them.

## What remains

V7 operationalizes continuous change intelligence: daily monitoring, emerging topics, velocity, impact, material-change detection, and continuously maintained Briefs. Later versions add personalization, distribution/authority, and production scale. `SYSTEMS.md` remains the canonical ledger through V10.

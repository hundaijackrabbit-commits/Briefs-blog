# Briefs V10 — MVP Completion

V10 closes the ten-version MVP roadmap. The public promise stays deliberately small: **Brief me on …**. The implementation underneath now has a complete safe path from query intent to evidence-backed answer, persistent memory, change monitoring, personal catch-up, public authority surfaces and production operations.

## V10 completion path

`query → context → intent → domain router → database/starter memory → iterative research → evidence policy → quality/disagreement checks → Brief → persistent research memory → living change comparison → tracked-subject refresh → personal catch-up / public Brief`

## What V10 adds

- Bounded multi-pass research with explicit stop reasons: sufficient, no-progress, provider limits or time budget.
- Safe external corroboration from ranked URLs discovered by trusted research providers; local/private-network targets and redirects are rejected.
- Keyless OpenAlex scholarly evidence discovery in addition to Wikipedia, Wikidata and GDELT.
- Persistent research memories in Postgres with freshness-aware expiry.
- Research-memory diffing into a reader-facing `observed_changes` stream. Editorial `change_candidates` remains a separate claim-level review queue.
- Evidence and previous-state follow-up intents.
- Per-Brief quality scoring, evidence/freshness/coverage warnings and structured disagreement surfacing.
- Autonomous tracked-subject refresh in the daily engine.
- Briefs Signals: 7-day observed-change velocity weighted by source diversity and importance.
- Provider health and runtime telemetry, production-readiness contract, admin operations page and DB doctor.
- Security response headers and final V10 architecture + production evaluation gates.

## Definition of MVP complete

The MVP is complete when a user can ask an evergreen, current, financial, cultural, comparison or follow-up question; receive the best eligible evidence the system can gather; see uncertainty instead of fabricated currentness; inspect sources; follow the subject; return to meaningful changes; and use public Brief/API/export surfaces. The product must remain available in a safe degraded mode if optional providers or the persistent database are unavailable.

Post-MVP work may improve scale, add licensed/proprietary datasets, billing, enterprise collaboration, native apps, languages, or generated video/audio. Those are expansions, not missing pieces of the consumer MVP.

# Briefs V10 competitive benchmark contract

**Benchmark date:** 2026-08-18

V10 is evaluated as an evidence-backed briefing product, not as a prose demo. Leading research assistants have established a bar around direct intent-following, iterative research, source visibility, current information, contextual follow-ups and safe uncertainty. Briefs adds a different design center: persistent claims/evidence/time/change state and finite catch-up.

## Final MVP capability bar

| Capability | V10 contract |
|---|---|
| Direct intent routing | Operational across finance, current, reference, comparison, evidence and prior-state follow-ups |
| Iterative research | Bounded refinement with gap detection, provider budgets and stop reasons |
| Current reporting | GDELT discovery plus explicit freshness requirements |
| Scholarly evidence | OpenAlex discovery path |
| General reference | Wikipedia + Wikidata + safe discovered-page corroboration |
| Finance | SEC primary evidence + optional specialist market quotes + reporting context |
| Persistent improvement | Postgres research memories with freshness TTL and state diffing |
| Citations/evidence | Claim-level inspection and source lists |
| Contradictions | Structured disagreement is surfaced, not silently collapsed |
| Historical Briefs memory | Prior snapshots/claim versions when the persistent DB has recorded them |
| Personal intelligence | Accounts, follows, packs, catch-up, change inbox and digests with DB; local safe fallback without DB |
| Living monitoring | Daily tracked-subject refresh and Signals |
| Authority/distribution | Canonical Briefs, structured data, feeds, API, exports, listen mode |
| Production operations | Readiness contract, provider/runtime telemetry, DB doctor, security headers, protected ops/admin |
| Graceful degradation | Missing DB/provider evidence never licenses invented facts, citations or freshness |

## V10 adversarial prompt suite

1. `WW2` — evergreen historical Brief, not fake breaking-news freshness.
2. `Austin Powers` — generic cultural research should not depend on a hard-coded starter topic.
3. `Apple stock` — market snapshot/investor routing; company history must not lead.
4. `Why did Apple stock move today?` — time-sensitive market-move routing; nearby headlines are context, not automatically causation.
5. `AAPL earnings` — primary SEC financial path.
6. `Latest Anthropic news` — current reporting; encyclopedia history cannot substitute for current evidence.
7. `Compare Nvidia vs AMD` — two-entity comparison.
8. `What changed in AI this week?` — current/change routing with a cleaned entity query.
9. `Explain quantum computing like I'm a marketer` — direct explanation and requested lens.
10. `What evidence supports that?` — contextual provenance follow-up.
11. `What did you previously believe about this?` — recorded prior state or an explicit “no prior state”; never reconstructed from model imagination.

`npm run eval:v10` executes the production smoke/evaluation contract against a deployed base URL.

# Briefs V8 competitive benchmark contract

V8 is measured against the user-visible expectations created by modern research assistants: direct intent handling, current evidence, source visibility, uncertainty, iterative research, follow-up context and useful persistence.

This file is a product benchmark, not a claim that Briefs reproduces proprietary model internals.

| Capability | V8 status |
|---|---|
| Intent-aware answer routing | Operational |
| Current/reporting research | Operational foundation |
| Primary finance evidence | Operational via SEC |
| Market quote adapter | Operational when configured |
| Source-policy controls | Operational |
| Claim-level evidence inspection | Operational |
| Explicit confidence/freshness gaps | Operational |
| Bounded iterative research | Operational foundation |
| Conversational follow-up context | Operational foundation |
| Multi-entity comparison surface | Operational foundation |
| Local follows without account | Operational |
| DB-backed accounts/sessions | Operational when Postgres is configured |
| Brief Packs | Operational when Postgres is configured |
| Since-last-read / caught-up state | Operational local + DB-backed |
| Change inbox | Operational when Postgres is configured |
| Exhaustive multi-agent deep research | V10 maturity target |
| Broad private-data connectors | V10 |
| Public exports/audio/API | V9 |
| Persistent claim/change history | Briefs differentiator; foundation operational |

## V8 prompt suite

- `Apple stock`
- `Why is Apple stock down today?`
- `AAPL earnings`
- `Austin Powers`
- `WW2`
- `Compare Nvidia vs AMD`
- `latest Anthropic news`
- follow-up: `what about its revenue?` after `Apple stock`
- Primary-only finance query
- News-only finance query

The deployed evaluator checks core routing and comparison/context regressions. Human review remains necessary for answer quality, causal reasoning and source relevance.

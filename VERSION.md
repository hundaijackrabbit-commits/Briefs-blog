# Briefs.blog version 0.7.0

**Core release:** V7 — Query Intelligence, Finance & Change Routing

V7 makes Briefs answer the *kind* of question the user asked, not just the subject noun. `Apple stock` now routes to an investor/market path instead of a generic Apple history lookup.

Key additions:
- Query Intent Engine with domain, task, entity query, freshness and effective perspective
- market-movement routing (`Why is Apple stock down today?`) with causal-inference guardrails
- bare-ticker recognition (`AAPL`) and stronger finance entity cleaning
- intent-specific Answer Contracts
- SEC public-company/ticker resolver
- SEC filings + XBRL financial-facts provider (Tier A primary evidence)
- optional Alpha Vantage quote adapter with explicit freshness/entitlement labeling
- recent-reporting discovery through GDELT
- current-query routing that prioritizes recent reporting and refuses to substitute encyclopedia history when current evidence is missing
- source-policy controls in Brief Me
- dated filing/reporting change candidates
- persistence for query-intent observations, market snapshots and change candidates when Postgres is connected
- competitive capability benchmark + deployed prompt evaluation harness
- visible routing badges for intent, lens and freshness

V7 preserves V1–V6. V8–V10 remain Personal Intelligence, Authority/Distribution, and production integration/scale/security respectively.

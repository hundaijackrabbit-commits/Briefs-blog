# Briefs V7 competitive benchmark contract

**Benchmark date:** 2026-08-16

This is a product-capability benchmark against publicly documented behavior from leading AI research products. It is **not** a claim that Briefs reproduces proprietary model internals, and the V7 artifact environment did not possess vendor API credentials for a direct paid API-vs-API bakeoff.

## Public competitive bar

Leading products set a high minimum:

- **ChatGPT search / deep research:** current web information, multi-step planning and synthesis, controllable sources, progress visibility, structured reports and citations/source links.
- **Claude web search / Research:** targeted current-web retrieval, agentic multi-search investigations, citations, and deeper investigations across internal/external sources.
- **Gemini Deep Research:** a revisable multi-step plan, iterative browsing/refinement, source visibility and comprehensive reports.
- **Perplexity Research:** iterative reasoning over many searches and sources, synthesis into a report, source-backed answers and exports.

Briefs should therefore be judged on more than whether it can produce fluent prose. Routing correctness, currentness, evidence quality, source independence, uncertainty, graceful degradation and whether the answer actually follows the user's intent are first-class metrics.

## V7 target matrix

| Capability | Competitive expectation | Briefs V7 |
|---|---|---|
| Direct answer follows query intent | Required | Operational Query Intent Engine + Answer Contracts |
| Current web/reporting path | Required | Operational foundation via GDELT reporting discovery |
| Primary-source finance path | Strong differentiator for finance | Operational via SEC EDGAR submissions + XBRL |
| Market quote path | Required for price-sensitive finance | Adapter operational; freshness depends on configured Alpha Vantage entitlement |
| Citations/source links | Required | Operational |
| Source-policy controls | Strong expectation | Operational |
| Explicit confidence/freshness gaps | Required for trust | Operational |
| Fast vs deep modes | Expected | Operational foundation |
| Multi-step iterative deep research | Leading products do this | V6 foundation; expands V8/V10 |
| Follow-up conversational memory | Expected | V8 |
| Files/private connectors | Expected in advanced products | V9/V10 |
| Visual reports/export | Expected in deep research | V9 |
| Living claim/change history | Not the primary design center of competitors | Briefs differentiator; foundation operational |
| Persistent knowledge that improves over time | Briefs strategic differentiator | Knowledge Store + staged research foundation |

## V7 prompt suite

1. `Apple stock` — must route to `market_snapshot`, investor lens, AAPL resolution, filing evidence and explicit quote freshness; must **not** lead with Apple corporate history.
2. `Why is Apple stock down today?` — must route to `market_move`, show time-sensitive evidence and avoid claiming a headline caused a move without corroboration.
3. `AAPL earnings` — must route to `financials` and prefer SEC primary evidence.
4. `AAPL` — should recognize a likely ticker and route to finance.
5. `Latest Anthropic news` — must route to `current_update` and prioritize eligible recent reporting over encyclopedia history.
6. `Austin Powers` — must retain the V6 generic research path.
7. `WW2` — must retain the V5 verified evergreen path.
8. `Compare Nvidia vs AMD` — comparison path remains preserved for later expansion.
9. `Apple stock` with Primary-only — ordinary news/quote sources must be excluded.
10. `Apple stock` with News-only — SEC-only financial metrics must not be presented as if supported by news.

The deployed `npm run eval:v7` harness records routing, confidence, source mode, source count and latency for a repeatable smoke benchmark. It also contains explicit anti-regression checks against the original `Apple stock → Apple history` failure.

## Competitive differentiation

V7 does not try to win by being a generic chatbot with another search box. Briefs is being built around a durable model of **claims, evidence, sources, time, changes and historical state**. The long-term advantage is that a current answer can be related to what Briefs previously believed, what changed, why the state changed, and which dependent Briefs should update.

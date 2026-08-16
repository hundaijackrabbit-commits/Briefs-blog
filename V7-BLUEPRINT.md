# Briefs.blog V7 — Query Intelligence, Finance & Change Routing

V7 fixes a core product weakness exposed by `Apple stock`: the engine must understand **what the user is asking for**, not merely resolve the noun.

## Acceptance examples
- `Apple stock` → investor/market snapshot, AAPL resolution, SEC fundamentals, recent filings/catalysts, market-data freshness. It must not default to Apple's corporate history.
- `Why is Apple stock down today?` → market-move intent, time-sensitive evidence and catalyst context without unsupported causal claims.
- `AAPL` → likely ticker recognition and finance routing.
- `AAPL earnings` → financials intent, SEC-first evidence.
- `latest Anthropic news` → current-update intent, recent reporting before encyclopedia context.
- `Austin Powers` → reference/research path from V6.
- `WW2` → verified evergreen path from V5.

## New operational layers
1. Query Intent Engine: domain + task + entity query + freshness + effective perspective.
2. Answer Contracts: finance/current/reference questions impose different evidence and composition rules.
3. SEC Public Company Resolver: keyless ticker/company resolution using official SEC data.
4. SEC Financial Facts Provider: filings and XBRL facts as Tier A primary evidence.
5. Market Data Adapter: optional Alpha Vantage quote adapter; missing quote is explicit, never invented.
6. Current Reporting Adapter: GDELT discovery of recent reporting with publisher-family diversity.
7. Source Policy UI: verified / primary / news / academic / all eligible.
8. Change Candidate Surface: recent filings and reporting become dated `What changed` items.
9. Competitive Evaluation Harness: repeatable prompt-level smoke tests against the capabilities expected from leading AI research products.

## Reliability contract
Every external provider is bounded by timeouts and failure isolation. SEC, market-data and news failures degrade independently. A missing quote does not destroy the filing-based investor Brief; a news outage does not destroy the SEC snapshot.

## V8–V10 preservation
V8 remains Personal Intelligence. V9 remains Authority/Distribution. V10 remains production integration/scale/security. All prior engines stay in `SYSTEMS.md` and cannot silently disappear.

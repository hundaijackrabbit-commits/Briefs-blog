# V7 validation

Validation performed for the V7 Query Intelligence, Finance & Change Routing package:

- `package.json` + `tsconfig.json` JSON parse — pass
- V7 architecture registry check (`node scripts/v7-check.mjs`) — pass (11 checks)
- Query-intent smoke suite — pass (7 cases), including:
  - `Apple stock` → `market_snapshot`
  - `Why is Apple stock down today?` → `market_move`
  - `AAPL earnings` → `financials`
  - bare `AAPL` → finance routing
  - `latest Anthropic news` → `current_update`
  - evergreen/reference regressions preserved
- V6 preservation check — pass
- V5 preservation check — pass
- legacy static repository check — pass
- V4 stabilization check — pass
- V4 architecture check — pass (version warning expected on V7)
- TypeScript project-code compile with temporary dependency shims — pass
- temporary validation shims removed after compile
- known Postgres `sql.json` typing regressions remain repaired
- SEC/GDELT/optional quote providers have bounded request timeouts and graceful fallbacks
- source-policy behavior is explicit in finance composition
- current-query composer refuses to replace missing current reporting with encyclopedia history
- V7 database migration/schema additions packaged
- `SYSTEMS.md` preserves the roadmap through the V10 maximum

## Competitive benchmark

`COMPETITIVE-BENCHMARK-V7.md` records the product-capability bar derived from public documentation for ChatGPT deep research, Claude Research/web search, Gemini Deep Research and Perplexity Research. This artifact does not claim a direct paid API-vs-API score because competitor API credentials were not available in the build environment.

The deployed `npm run eval:v7` suite is the repeatable product smoke benchmark. It records routing, source count, confidence, source mode and response latency and includes an anti-regression rule for the original `Apple stock → Apple history` failure.

## Final production validation still required

The artifact environment does not have this project's npm dependencies installed, so the full Next.js dependency-backed build must still be run on the Windows development machine before production push:

```bash
npm install
npm run typecheck
npm run v7check
npm run intentcheck
npm run build
```

After deployment, run `npm run eval:v7` against the Vercel URL.

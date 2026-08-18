# Briefs validation

## V9 local release gate
Run from the project root:

```bash
npm install
npm run typecheck
npm run check
npm run build
```

`npm run check` preserves the V4–V8 architecture checks and adds the V9 authority/distribution contract.

## V9 production gate
After deployment:

```powershell
$env:BRIEFS_EVAL_BASE_URL="https://briefs-blog.vercel.app"
npm run eval:v9
```

The deployed smoke suite checks health, API status, robots, sitemap, RSS, llms.txt, a canonical WW2 page, the public Brief API and Markdown export.

## Manual authority checks
- View page source on `/briefs/world-war-ii` and confirm Article + Breadcrumb JSON-LD.
- Confirm `/brief-me?q=WW2` is noindex while `/briefs/world-war-ii` is indexable.
- Expand a tracked claim and open its supporting evidence.
- Confirm the visible verification date comes from knowledge evidence, not merely request time.
- Confirm RSS and sitemap URLs use `BRIEFS_BASE_URL` in production.
- Confirm email delivery remains disabled without credentials and does not fail the daily intelligence run.

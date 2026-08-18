# Briefs.blog V10.2.1 — Global Editorial Refinement

Overlay patch for the **green V10.2 + Vercel hotfix** baseline.

## What this release does

- Makes the autonomous daily article begin with the world, not a keyword list.
- Global discovery sweeps World, Business, Markets, Technology, Science, Policy and Culture plus explicit regional discovery across Africa, the Middle East, South Asia, East Asia, Southeast Asia, Latin America, Europe and Oceania.
- Clusters overlapping coverage into events before scoring.
- Scores geographic reach, human consequence, economic consequence, political/institutional impact, long-term consequence, surprise/velocity, public attention and evidence breadth.
- Folds source authority into evidence breadth so many low-quality domains cannot win by volume alone.
- Compares candidates with the previous 60 days of daily flagships.
- Penalizes repeated event/category territory unless the underlying world-state materially changed.
- Penalizes recently reused Story Contract angle forms and varies deterministic article structure by angle.
- Gives the automatic daily writing slot to the global flagship. Scheduled watched-keyword refreshes stay research-only and generate opportunities without drafting competing autonomous articles.
- Deep-researches the winner through the existing V10.2 publication gates. If the top story cannot support a safe article, a bounded publishability fallback can try another ranked candidate while time remains.
- Adds a Global Desk to `/admin/publication` and a public Today's Brief hero on `/articles` when today's flagship is published.
- Keeps the Vercel Hobby cron valid: the publication job runs once daily at **18:30 UTC**.

## Apply on Windows

Extract this ZIP and copy the **contents of the extracted folder** over:

`C:\Users\tomes\Documents\briefs-blog`

Allow replacements. Do not delete `.git` or `node_modules`.

Then:

```powershell
cd C:\Users\tomes\Documents\briefs-blog
npm install
npm run typecheck
npm run global:check
npm run check
npm run build
```

## Database

The existing V10.2 refinement migration must already be applied. If you are unsure, both are additive/idempotent:

```powershell
npm run refinement:db
npm run global:db
```

## Optional auto-publish

The daily flagship **drafts into review by default**. This is intentional for a global news product.

Optional:

```text
PUBLICATION_FLAGSHIP_AUTO_PUBLISH=true
```

Even with that flag, World, Markets, Policy and Science remain review-gated. Lower-risk categories can auto-publish only after stricter quality, audience and originality thresholds.

## Test it

Log into `/admin/publication` and use **Run world selection**. The Global Desk will show the winner, runner-ups, component scores, regions, repeat penalty, and any material-change override.

## Push after green checks

```powershell
git add -A
git commit -m "Add global daily flagship intelligence"
git push origin main
```

Do not run `npm audit fix --force` as part of this patch.

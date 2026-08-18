# Briefs.blog V10.2 Vercel hotfix

This patch fixes the Vercel production build blocker caused by direct Postgres.js `RowList` → typed-array assertions, and makes the publication cron compatible with the Vercel Hobby plan.

Changed files:
- `src/lib/publication/angles.ts`
- `src/lib/publication/originality.ts`
- `src/lib/publication/research.ts`
- `src/lib/publication/revalidation.ts`
- `vercel.json`

The database result assertions now normalize through `unknown` before the explicit row shape, which matches TypeScript's requirement for structurally non-overlapping assertion types.

The publication cron is now once daily (`30 12 * * *`) instead of every six hours.

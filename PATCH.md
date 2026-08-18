# Briefs.blog V10 email delivery TypeScript patch

Fixes the Postgres template typing failure in `src/lib/distribution/email-delivery.ts` by normalizing optional Resend response fields to `string | null` before passing them to the SQL tagged template.

Overlay this patch onto the V10 project root, then run:

```powershell
npm run typecheck
npm run build
```

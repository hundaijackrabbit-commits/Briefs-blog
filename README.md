# Briefs.blog — V9

Briefs is a living knowledge and briefing platform. The public product stays intentionally simple — **Brief me on …** — while the backend maintains entities, claims, evidence, research, changes, freshness, query intent, editorial state and personal context.

V9 adds the authority/distribution layer: canonical public Brief pages, structured data, claim-level public evidence, sitemap/robots, RSS, news sitemap, a public API, exports, listen mode and optional digest email delivery.

## Validate
```bash
npm install
npm run typecheck
npm run check
npm run build
```

## Public surfaces
- `/briefs`
- `/methodology`
- `/developers`
- `/feed.xml`
- `/news-sitemap.xml`
- `/sitemap.xml`
- `/llms.txt`
- `/api/v1/brief?q=World%20War%20II`
- `/api/export?q=World%20War%20II&format=markdown`

## Production database
```bash
npm run db:bootstrap
```
The app still degrades to verified starter knowledge and live research when Postgres is not configured. Database-backed published Briefs, cross-device personal intelligence, delivery logs and accumulated change state require `DATABASE_URL`.

## Optional email
Set `RESEND_API_KEY` and `BRIEFS_FROM_EMAIL`. Without them, digest notifications continue to exist inside My Briefs and the email step is skipped safely.

## Evaluation
```powershell
$env:BRIEFS_EVAL_BASE_URL="https://briefs-blog.vercel.app"
npm run eval:v9
```

`SYSTEMS.md` is the canonical scope ledger through the V10 maximum.

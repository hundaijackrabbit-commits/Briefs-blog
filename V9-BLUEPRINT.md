# Briefs V9 — Authority & Distribution

V9 turns the intelligence system into a publishable, discoverable and reusable public knowledge product without changing the minimal `Brief me on…` front door.

## Product goals
1. Give every durable Brief a canonical public URL.
2. Make evidence, freshness and provenance legible to readers and machines.
3. Expose structured distribution surfaces: sitemap, RSS, news sitemap, API and exports.
4. Add a listen experience without requiring an external audio vendor.
5. Deliver personal digest email only when a provider is explicitly configured.
6. Preserve every V1–V8 engine in `SYSTEMS.md`.

## Public authority path
`Published Brief / verified starter topic → PublicBrief adapter → canonical page → Article/Breadcrumb structured data → claim evidence → sitemap/feed/API/export`

Public pages never use generation time as evidence of freshness. `last_verified_at`, `last_substantial_update_at`, or the starter corpus cutoff drives the visible verification date.

## Distribution surfaces
- `/briefs` public index
- `/briefs/[slug]` canonical Brief page
- `/sitemap.xml`
- `/robots.txt`
- `/feed.xml`
- `/news-sitemap.xml`
- `/llms.txt`
- `/api/v1/brief`
- `/api/v1/status`
- `/api/export`
- `/developers`
- `/methodology`

## Email
V9 uses an optional Resend HTTPS adapter with no new package dependency. If `RESEND_API_KEY` and `BRIEFS_FROM_EMAIL` are absent, the daily intelligence run continues normally and reports email delivery as not configured. Pending notifications retain `email_sent_at = null` until a successful send.

## V10 handoff
Generated audio/video, premium API keys, enterprise workspaces, deeper observability, mature Signals/datasets, security testing, performance budgets and full operational hardening remain V10 concerns.

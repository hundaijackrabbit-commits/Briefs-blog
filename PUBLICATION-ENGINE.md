# Briefs Publication Engine 1.1

This is a post-MVP product release. It does **not** create V11 or reopen the ten-version architecture roadmap.

## Permanent rule

> Briefs never writes an article because a keyword exists. Briefs writes an article because the keyword led it to something worth knowing.

## Publication funnel

Keyword watch → research plan → iterative research → evidence graph → story score → angle → reader contract → article draft → claim mapping → source-overlap originality check → Briefs voice check → publication quality gate → AUTO / REVIEW / MANUAL → publish → daily revalidation → revision or no-op.

### Originality

The system does not claim a mathematically impossible "100% plagiarism free" guarantee. Instead it:
- drafts from structured claims, not source prose;
- deliberately excludes source excerpts from the optional writing-model request;
- compares draft n-grams against source excerpts;
- compares draft n-grams against the Briefs publication library;
- flags long exact phrase matches;
- blocks publication when the originality gate fails.

### Audience

Every generated article has an explicit Reader Contract:
- smart generalist
- executive
- investor
- developer
- student
- marketer

This is intentionally separate from topic classification. The system knows who it is writing to before composition.

### Writer adapter

`PUBLICATION_WRITER_URL` is optional. When configured, Briefs sends only atomic structured claims and the Reader Contract to that endpoint. It does not send source prose. The writer must return structured sections and the claim IDs used by each factual section.

If it is absent or fails, Briefs uses its deterministic claim-grounded composer.

### Daily revalidation

The existing daily intelligence run now schedules:
- due keyword research;
- every published article whose `next_revalidate_at` is due;
- published Living Briefs older than the verification window.

A separate protected publication cron processes the durable revalidation queue in bounded batches throughout the day. This prevents one large publication library from causing the main daily intelligence function to time out.

States:
- `current`
- `revalidated`
- `update-available`
- `research-required`
- `disputed`
- `stale`

"No material change" means content is left alone. The system can update its verification state without pretending the prose changed.

### Article revision behavior

Articles preserve historical versions. When a tracked claim changes:
1. the affected sections are identified through claim dependencies;
2. those sections are redrafted from the new research graph;
3. originality, evidence, audience and voice gates rerun;
4. a proposal is created;
5. AUTO content may publish only under strict thresholds; REVIEW content waits in Admin.

Living Briefs are reverified daily. Automatic Brief text replacement is disabled by default. Set `PUBLICATION_BRIEF_AUTO_UPDATE=true` only if you want strongly corroborated changed claims to update the Brief answer automatically.


## Brief reader targeting

The publication Reader Contract also informs Brief composition. Explicit executive, investor, developer, student and marketer perspectives now shape the opening sentence so the answer is clearly speaking to someone rather than emitting neutral prose into an undefined audience.

## Admin

`/admin/publication`

The existing admin proxy protects this page. The API also accepts the signed admin cookie or `Authorization: Bearer $ADMIN_TOKEN`.

## Database

For an existing V10 database:

```powershell
npm run publication:db
```

For a fresh database, `npm run db:bootstrap` now applies the publication schema as well.

## Optional environment

```text
PUBLICATION_WRITER_URL
PUBLICATION_WRITER_TOKEN
PUBLICATION_BRIEF_AUTO_UPDATE=false
```

Required production variables remain:

```text
DATABASE_URL
ADMIN_TOKEN
CRON_SECRET
BRIEFS_BASE_URL
```

## Validation

```powershell
npm run typecheck
npm run publication:check
npm run check
npm run build
```

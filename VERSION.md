# Briefs.blog version 0.8.0

**Core release:** V8 — Personal Intelligence, Context & Evidence Inspection

V8 turns the V7 research/query engine into a more persistent product. It adds reader accounts, secure sessions, Brief Packs, local-first follows, a change inbox, since-last-read state, follow-up context, claim-level evidence inspection, a comparison surface, an iterative research-gap loop, and admin-page authentication.

Key additions:
- DB-backed reader registration/login with scrypt password hashing and hashed session tokens
- local-first follows that work even before Postgres is configured
- synced Brief Packs and reader preferences when Postgres is connected
- daily personal change-notification generation from tracked change candidates
- finite “You’re caught up” / “N things changed since you were here” state
- follow-up Brief Context that carries subject, claim and source context forward
- persisted conversation/turn foundation when Postgres is connected
- claim-level evidence drawers
- explicit multi-entity comparison cards
- iterative research-gap evaluation and a bounded second-pass refinement path
- protected `/admin/*` UI through a hashed HttpOnly admin session cookie
- V8 architecture/evaluation harnesses

V8 preserves V1–V7. V9 remains Authority & Distribution; V10 remains production integration, scale, security, observability and product completion.

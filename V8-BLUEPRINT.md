# Briefs V8 — Personal Intelligence, Context & Evidence Inspection

## Objective

V8 is the integration release between a capable research engine and a product people can return to. The front door remains `Brief me on…`; complexity appears only when it creates trust, continuity or useful personalization.

## Acceptance tests

1. `Apple stock` remains finance-routed and must not regress to Apple corporate history.
2. `Austin Powers` remains generic live research rather than a hard-coded topic.
3. `WW2` remains the verified evergreen path.
4. `Compare Nvidia vs AMD` renders distinct comparison cards.
5. A follow-up such as `what about its revenue?` carries the previous subject context.
6. A key fact can be expanded to inspect its supporting source links.
7. A reader can follow a subject locally with no database.
8. With Postgres configured, a reader can register, sign in, create Brief Packs and sync follows.
9. Returning to a Brief reports material changes since the previous read, or `You’re caught up`.
10. `/admin/editorial` no longer queries internal data before an admin session is established.
11. The daily intelligence run can generate personal change notifications without failing the core run if personalization fails.
12. No V1–V7 system disappears from `SYSTEMS.md`.

## Research loop

V8 does not pretend to equal the exhaustive multi-agent research loops of leading proprietary systems yet. It adds a bounded loop:

`initial research → evidence-gap evaluation → refinement decision → second pass when justified → evidence re-score → answer`

Current queries can trigger a refined reporting pass. Reference queries can retry against a canonicalized subject. Every unresolved gap stays visible.

## Personal model

Persistence is server-side and account-scoped when Postgres is connected:

`reader_accounts → reader_sessions → reader_preferences → brief_packs → brief_pack_items → reader_read_states → reader_notifications`

The public product remains useful without Postgres through local-first follows and the V5–V7 fallback/research paths.

## Security

- Passwords: scrypt + random salt.
- Reader sessions: random opaque token in Secure/HttpOnly cookie; only SHA-256 token hashes are stored.
- Admin UI: hashed HttpOnly cookie derived from `ADMIN_TOKEN`, enforced in `src/proxy.ts`.
- Internal mutation APIs keep explicit Bearer-token authorization.
- Personal DB queries are always scoped by `account_id`.

## V9 handoff

V9 should focus on authority/distribution: canonical public Brief URLs, structured data, sitemaps, feeds, email delivery, exports, audio and public API surfaces. It should not need to rebuild the V8 context/personalization core.

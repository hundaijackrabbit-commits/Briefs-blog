# Briefs.blog V3 — Knowledge Intelligence

Version: **0.3.0**

V3 changes the role of Briefs from a reliable ingestion pipeline into a time-aware knowledge system. It keeps all V2 reliability primitives and adds the data contracts and first working engines required for the future **Brief me on…** experience.

## Implemented in this package

- Semantic frame extraction foundation
- Entity resolution using canonical names, aliases and external identifiers
- Normalized event-to-entity links
- Knowledge graph relation helpers and bounded neighborhood traversal
- Evidence graph with source-independence keys and directness
- Evidence assessment that distinguishes corroboration from duplicated sourcing
- Claim version history and supersession
- Temporal “claims as of” queries
- Meaningful-change candidate detection and significance scoring
- Historical entity snapshots
- Context-sensitive importance scoring foundation
- Coverage / topic-authority scoring foundation
- Quality evaluation and publication blockers
- Modular `BriefRequest`, `BriefPlan`, and `BriefResult` contracts
- Fast-path Brief planner/composer API at `POST /api/brief`
- `/brief-me` product preview
- `/admin/knowledge` knowledge-layer dashboard
- V3 queue stages (`understand`, `resolve`, `temporal`, `snapshot`, `quality`)
- Worker integration from clustered events into semantic understanding and historical snapshots
- V3 database migration (`db/v3_migration.sql`) and fresh-install schema integration

## Intentional boundaries

V3 does **not** pretend generic rules can extract every domain fact correctly. Claim extraction remains adapter/domain driven, and uncertain material must flow through the evidence and editorial policy layers. V4 is where section-level editorial composition, approval, transactional publishing and rollback become the focus.

## Validation

`python scripts/static-check.py` passes.

A full Next.js dependency/type build could not be completed in the artifact environment because package installation timed out. No build-success claim is made. Run `npm install && npm run typecheck && npm run build` on a networked development machine before deployment.

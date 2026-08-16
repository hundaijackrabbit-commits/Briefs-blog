# Briefs.blog System Registry

This file is the canonical checklist for the product architecture. A system may be **implemented**, **foundation**, or **planned**. Future releases should update this registry instead of silently dropping scope.

## Reliability foundation
- Source registry — implemented
- Ingestion adapters — implemented/foundation
- Normalization/deduplication — implemented/foundation
- Durable intelligence runs — implemented
- Job queue, leases, heartbeat, retries — implemented
- Idempotency — implemented
- Circuit breaking — implemented
- Stale-job recovery — implemented
- Dead-job handling — implemented
- Observability/admin intelligence — implemented/foundation

## Knowledge intelligence
- Event clustering — implemented/foundation
- Semantic understanding — implemented/foundation
- Entity resolution — implemented/foundation
- Knowledge graph — implemented/foundation
- Claim model/history — implemented/foundation
- Evidence graph — implemented/foundation
- Verification — implemented/foundation
- Contradiction detection — implemented/foundation
- Temporal intelligence — implemented/foundation
- Historical state/snapshots — implemented/foundation
- Change intelligence — implemented/foundation
- Impact mapping — implemented/foundation
- Contextual importance — implemented/foundation
- Coverage gap/authority scoring — implemented/foundation
- Quality evaluation — implemented/foundation

## Editorial intelligence
- Editorial policy engine — implemented
- Section dependency mapping — implemented
- Revision proposal engine — implemented
- Brief Composer — implemented conservatively; AI adapter planned
- Editorial review queue — implemented
- Transactional publishing — implemented
- Approval/rejection — implemented
- Rollback — implemented
- Correction log — implemented
- Citation maintenance — implemented/foundation
- Freshness maintenance — implemented
- Internal-link intelligence — implemented/foundation
- Automatic safe updates — implemented conservatively
- Sensitive/high-risk manual routing — implemented

## Brief product
- BriefRequest / BriefPlan / BriefResult — implemented
- Fast-path briefing — implemented/foundation
- Research-path detection — implemented/foundation
- `Brief me on` homepage — implemented
- Depth/perspective rendering — foundation
- What Changed? — foundation
- Evidence drawer — planned
- Compare entities — planned
- Audio/watch/export renderers — planned

## Discovery/original intelligence (V5 target)
- Emerging-topic detection — planned
- Velocity/trend engine — planned
- Source discovery — planned
- Research-gap detection — planned
- Briefs Signals — planned
- Proprietary indexes/datasets — planned

## Conversational intelligence (V6 target)
- Public Brief Me conversation — planned
- Context object/follow-ups — planned
- Targeted research escalation — planned
- Grounded answer provenance — planned

## Personal intelligence (V7 target)
- Accounts/preferences — planned
- Watchlists/Brief Packs — planned
- Since I was here — planned
- Alerts/daily brief — planned
- Pro tier — planned

## Scale/commercial layer (V8+)
- API/data exports — planned
- Enterprise workspaces — planned
- Team intelligence monitors — planned
- Multi-language verticals — planned

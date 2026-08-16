# Briefs.blog version 0.5.0

**Core release:** V5 — Living Knowledge MVP

V5 turns the previously database-dependent Brief Me experience into a usable product surface. The production knowledge database remains the preferred source, but a small verified starter corpus provides safe degraded operation and demonstrates the complete retrieval → evidence → briefing path.

Key additions:
- database-first Knowledge Store with verified starter fallback
- working WW2 starter Brief with evidence
- starter AI baseline with live-research warning
- evidence/source rendering in Brief Me
- `research_requests` queue foundation
- source packs and ingestion checkpoints
- database bootstrap script
- `/api/knowledge/status`
- no hard `DATABASE_URL` requirement for normal Brief requests
- fixed Postgres JSON typing in queue/source/understanding

All V2 reliability, V3 knowledge/evidence/temporal, V4 editorial and V4.1 interactive Brief Me systems remain in scope.

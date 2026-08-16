# V4 Blueprint — Autonomous Editorial Foundation

V4 turns V3's knowledge/change layer into a controlled publication-maintenance system. The governing rule is: **evidence may trigger an editorial change; AI never gets unilateral authority to invent one.**

## Flow

`change_candidate → impact/dependencies → editorial proposal → policy → quality gate → approve/auto-safe → transactional publish → snapshot → correction/history → freshness/link reconciliation`

## Publication modes
- **auto**: objective, confirmed, Tier-A, normal-risk changes only. V4's automatic composer is intentionally conservative and updates structured sections rather than freeform essays.
- **review**: proposal is generated and held for an editor.
- **manual**: sensitive/high-risk/conflicted changes are never auto-published.

## Safety properties
- publication is transactional
- every published revision creates a prior-state snapshot
- rollback is first-class
- citations are persisted separately from prose
- change candidates are not treated as facts until accepted
- public pages continue serving the last published state if intelligence work fails

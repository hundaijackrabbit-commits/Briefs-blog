# Briefs.blog V10.2 — Reader Intelligence & Editorial Refinement

This is an **overlay patch** for the current Briefs.blog V10.1 / 1.1.x project. It does not replace `.git` and it does not reopen the ten-version MVP roadmap.

## What changes

V10.2 upgrades both the Brief answer engine and the publication engine:

- Reader Intelligence Engine: audience + reader-goal + expertise + time-budget inference.
- Answer Planner: objective, opening, evidence rules, uncertainty rules, required information and avoid-list are decided before prose.
- Grounded Reader Composer: reader-specific fact selection/order and optional provider-neutral structured answer writer.
- Separate Answer Quality score: directness, audience fit, grounding, clarity, uncertainty and specificity.
- Multi-angle Story Intelligence: up to five evidence-bounded angles are generated and scored before an article is drafted.
- Publication Saturation Penalty: repeated/over-covered topics lose story score.
- Story Contracts: thesis, why-now, reader outcome, differentiator, supporting claims, counter-claims and cannot-claim rules are locked before writing.
- Audience Fit Grader 2 and Briefs Voice 2.
- Stronger originality checks: exact phrase, distinctive-content shingles, vocabulary-pattern risk and internal-library overlap.
- Headline evidence gate, specificity gate, and factual-section grounding gate.
- Admin Publication Desk now exposes competing editorial angles and richer quality dimensions.
- Existing V10.1 daily revalidation stays intact and preserves the article's editorial meaning during updates.

## Apply on Windows

Extract this ZIP. Copy the **contents of the extracted folder** over:

`C:\Users\tomes\Documents\briefs-blog`

Allow Windows to replace matching files. Do not delete `.git` or `node_modules`.

Then run:

```powershell
cd C:\Users\tomes\Documents\briefs-blog
npm install
npm run typecheck
npm run publication:check
npm run refinement:check
npm run check
npm run build
```

## Database

If production `DATABASE_URL` is already configured, apply the new additive migration before relying on the V10.2 Publication Desk:

```powershell
npm run refinement:db
```

This adds story-angle candidates, Story Contracts, answer-quality observations, and the expanded publication-quality dimensions. The migration uses `create table if not exists` / `add column if not exists` and is designed to be additive.

## Optional grounded writers

The system works without these variables. If configured, writer endpoints receive **structured claims and contracts**, not source articles as writing templates.

```text
BRIEFS_ANSWER_WRITER_URL=
BRIEFS_ANSWER_WRITER_TOKEN=
PUBLICATION_WRITER_URL=
PUBLICATION_WRITER_TOKEN=
```

## Push

After all checks and the production build pass:

```powershell
git add -A
git commit -m "Refine Briefs reader and publication intelligence to V10.2"
git push origin main
```

## Production regression test

After Vercel deploys:

```powershell
$env:BRIEFS_EVAL_BASE_URL="https://briefs-blog.vercel.app"
npm run eval:v10.2
```

The V10.2 eval checks reader metadata, answer-quality output and grounded answer behavior across student, investor, executive/catch-up and technical/translation-style prompts.

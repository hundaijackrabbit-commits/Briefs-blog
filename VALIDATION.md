# Validation

V10 carries forward every preservation gate from V4 through V9 and adds a final MVP gate.

Local release gate:

```bash
npm install
npm run typecheck
npm run check
npm run db:doctor
npm run build
```

Production gate:

```bash
BRIEFS_EVAL_BASE_URL=https://briefs-blog.vercel.app npm run eval:v10
```

The V10 check verifies iterative research, persistent research memory, Signals, historical/evidence follow-ups, quality/disagreement surfaces, operational telemetry, security headers, schema separation between editorial and reader-facing change streams, and preservation of earlier systems.

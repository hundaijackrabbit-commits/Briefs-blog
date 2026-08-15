# Briefs.blog V1 scaffold

A working foundation for a living knowledge publication with structured claims, sources, freshness rules, review queues and a scheduled daily-engine entrypoint.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. With no `DATABASE_URL`, the UI uses clearly marked built-in demo data.

## Production database
Create a PostgreSQL database and execute `db/schema.sql` followed by `db/seed.sql`, then set `DATABASE_URL`. The current data adapter will automatically switch from demo data to Postgres.

## Daily engine
`vercel.json` schedules `/api/cron/daily` once daily. Set `CRON_SECRET` and send/allow `Authorization: Bearer <CRON_SECRET>`.

The V1 daily engine intentionally performs **no invented external updates** until real source adapters are configured. Its orchestration contract, clustering and scoring are implemented; persistence and specific source adapters are the next production milestone.

See `BLUEPRINT.md` for architecture, trust rules and roadmap.

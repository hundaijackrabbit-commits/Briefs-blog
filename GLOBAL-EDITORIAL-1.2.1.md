# Briefs.blog Publication Engine 1.2.1 — Global Importance + Daily Distinctiveness

This refinement makes the daily flagship article a world-level editorial decision rather than a keyword rotation.

## Editorial law

Each UTC day Briefs asks: **What is the single most consequential thing happening in the world today that an informed person should understand?**

Popularity is only a signal. The winner is ranked by geographic reach, human consequence, economic consequence, political/institutional impact, long-term consequence, surprise/velocity, public attention, and evidence breadth. Discovery spans World, Business, Markets, Technology, Science, Policy and Culture and records geographic region hints so the system does not silently equate "world" with North American media attention.

## Distinctiveness

Every candidate is compared with the previous 60 days of flagship selections. Repeating the same event, entity cluster, category or central question lowers the score. A materially changed world-state can override most of that repetition penalty. Examples include a ceasefire, invasion, signed agreement, verdict, resignation, default, launch, collapse or a large jump in source/geographic breadth.

The rule is: **different by default, continuous when reality genuinely changes.**

## Daily pipeline

`global discovery → event clustering → geographic normalization → importance scoring → 60-day distinctiveness → evidence gate → winner → deep research → V10.2 story angles → Story Contract → originality/audience/voice/evidence gates → review/publish`

The global engine does not bypass existing publication safety. It selects what deserves investigation; the existing research and quality engines decide what can responsibly be written. If the highest-ranked event cannot pass deep-research/article gates, Briefs may try another ranked candidate while the cron time budget remains healthy; the fallback reason is recorded in the daily rationale. A hard elapsed-time guard prevents fallback research from pushing the Hobby deployment past its function budget.

Watched keywords still refresh and create story opportunities in the background, but scheduled keyword maintenance runs in **research-only mode**. It cannot create a competing autonomous article. The daily autonomous writing slot belongs to the global flagship; manual admin drafting remains available.

## Automation

The Hobby-compatible `/api/cron/publication` job runs once daily at `18:30 UTC`. It performs the global selection first, then normal publication maintenance. The flagship draft defaults to **review**. Set `PUBLICATION_FLAGSHIP_AUTO_PUBLISH=true` only if you want low-risk categories to auto-publish after the stricter quality thresholds. World, Markets, Policy and Science remain review-gated even with that flag.

## Database

After deployment, with `DATABASE_URL` configured:

```powershell
npm run global:db
```

This creates global discovery runs, scored candidates and the permanent daily flagship history used by the distinctiveness engine.

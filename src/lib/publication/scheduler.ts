import { db } from "@/lib/db";
import { researchKeyword } from "@/lib/publication/pipeline";
import { revalidateArticle, revalidateBrief } from "@/lib/publication/revalidation";

export async function schedulePublicationMaintenance() {
  if (!process.env.DATABASE_URL) return { status: "disabled", reason: "DATABASE_URL not configured" };
  const sql = db();
  const run = (await sql`
    insert into publication_revalidation_runs(status) values('running') returning id
  `)[0];
  const runId = String(run.id);

  await sql`
    update publication_revalidation_queue
    set status='pending',locked_at=null,due_at=now(),updated_at=now(),
        last_error=coalesce(last_error,'')||' | recovered stale publication lease'
    where status='running' and locked_at<now()-interval '20 minutes'
  `;
  await sql`
    delete from publication_revalidation_queue
    where status='completed' and completed_at<now()-interval '30 days'
  `;

  const keywords = await sql`
    insert into publication_revalidation_queue(target_type,target_id,due_at,status)
    select 'keyword',id,now(),'pending'
    from publication_keywords
    where active=true and next_research_at<=now()
    on conflict do nothing
    returning id
  `;
  const articles = await sql`
    insert into publication_revalidation_queue(target_type,target_id,due_at,status)
    select 'article',id,now(),'pending'
    from publication_articles a
    where a.status='published' and a.next_revalidate_at<=now()
      and not exists(
        select 1 from publication_update_proposals p
        where p.target_type='article' and p.target_id=a.id and p.status='proposed'
      )
    on conflict do nothing
    returning id
  `;
  const briefs = await sql`
    insert into publication_revalidation_queue(target_type,target_id,due_at,status)
    select 'brief',id,now(),'pending'
    from briefs b
    where b.status='published'
      and coalesce(b.last_verified_at,b.updated_at,b.created_at)<now()-interval '20 hours'
      and not exists(
        select 1 from publication_update_proposals p
        where p.target_type='brief' and p.target_id=b.id and p.status='proposed'
      )
    on conflict do nothing
    returning id
  `;

  await sql`
    update publication_revalidation_runs
    set keywords_queued=${keywords.length},articles_queued=${articles.length},briefs_queued=${briefs.length},
        summary=${sql.json(JSON.parse(JSON.stringify({queued:keywords.length+articles.length+briefs.length})))},
        completed_at=now(),status='queued'
    where id=${runId}::uuid
  `;
  return { status: "queued", runId, keywords: keywords.length, articles: articles.length, briefs: briefs.length };
}

async function claimQueueItem() {
  const sql = db();
  const rows = await sql`
    with picked as (
      select id from publication_revalidation_queue
      where status='pending' and due_at<=now()
      order by due_at,created_at
      for update skip locked
      limit 1
    )
    update publication_revalidation_queue q
    set status='running',attempts=attempts+1,locked_at=now(),updated_at=now()
    from picked
    where q.id=picked.id
    returning q.id,q.target_type,q.target_id
  `;
  return rows[0] as { id: string; target_type: "keyword"|"article"|"brief"; target_id: string } | undefined;
}

export async function runPublicationWorker(maxItems = 8, budgetMs = 35_000) {
  if (!process.env.DATABASE_URL) return { status: "disabled", processed: 0, failed: 0 };
  const sql = db();
  let processed = 0, failed = 0;
  const started = Date.now();
  const results: Array<{ type: string; id: string; result?: unknown; error?: string }> = [];

  for (let i = 0; i < Math.max(1, Math.min(12, maxItems)); i++) {
    if (Date.now() - started > Math.max(5_000, budgetMs)) break;
    const item = await claimQueueItem();
    if (!item) break;
    try {
      const result = item.target_type === "keyword"
        ? await researchKeyword(String(item.target_id),{draft:false})
        : item.target_type === "article"
          ? await revalidateArticle(String(item.target_id))
          : await revalidateBrief(String(item.target_id));
      await sql`
        update publication_revalidation_queue
        set status='completed',completed_at=now(),updated_at=now()
        where id=${String(item.id)}::uuid
      `;
      processed++;
      results.push({ type: item.target_type, id: String(item.target_id), result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sql`
        update publication_revalidation_queue
        set status=case when attempts>=3 then 'failed' else 'pending' end,
            due_at=case when attempts>=3 then due_at else now()+interval '1 hour' end,
            last_error=${message},updated_at=now()
        where id=${String(item.id)}::uuid
      `;
      failed++;
      results.push({ type: item.target_type, id: String(item.target_id), error: message });
    }
  }
  return { status: failed ? "partial" : "completed", processed, failed, elapsedMs:Date.now()-started, results };
}

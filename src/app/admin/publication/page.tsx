import { db } from "@/lib/db";
import PublicationClient from "./publication-client";

export const dynamic = "force-dynamic";

export default async function PublicationAdmin() {
  if (!process.env.DATABASE_URL) {
    return <main className="section"><p className="eyebrow">BRIEFS · PUBLICATION ENGINE</p><h1>Publication desk</h1>
      <section className="card"><h2>Database required</h2><p>Connect Postgres and run the V10.1 publication migration before using the publication desk.</p></section></main>;
  }
  const sql = db();
  try {
    const [keywords, opportunities, articles, updates, queue] = await Promise.all([
      sql`select * from publication_keywords order by active desc,created_at desc limit 100`,
      sql`select o.*,k.keyword,k.category from publication_opportunities o join publication_keywords k on k.id=o.keyword_id order by o.created_at desc limit 100`,
      sql`select id,slug,title,category,status,editorial_mode,freshness_status,quality_score,published_at,last_revalidated_at,updated_at from publication_articles order by created_at desc limit 100`,
      sql`select id,target_type,target_id,status,review_mode,summary,reason,created_at from publication_update_proposals where status in ('proposed','approved') order by created_at desc limit 100`,
      sql`select target_type,status,count(*)::int count from publication_revalidation_queue group by target_type,status order by target_type,status`
    ]);
    return <PublicationClient initial={{
      keywords: keywords as any[], opportunities: opportunities as any[], articles: articles as any[],
      updates: updates as any[], queue: queue as any[]
    }}/>;
  } catch (error) {
    return <main className="section"><p className="eyebrow">BRIEFS · PUBLICATION ENGINE</p><h1>Publication desk</h1>
      <section className="card"><h2>Migration required</h2><p>{error instanceof Error ? error.message : "Publication database unavailable"}</p></section></main>;
  }
}

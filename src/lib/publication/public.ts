import { db } from "@/lib/db";

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  deck: string;
  category: string;
  articleType: string;
  audience: string;
  publishedAt: string | null;
  updatedAt: string;
  lastRevalidatedAt: string | null;
  lastSubstantialUpdateAt: string | null;
  freshnessStatus: string;
  qualityScore: number;
  sections: Array<{ key: string; heading: string; body: string }>;
  sources: Array<{ id: string; name: string; title: string; url: string; tier: string; kind: string }>;
};

export async function listPublishedArticles(limit = 60) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const sql = db();
    const rows = await sql`
      select slug,title,deck,category,article_type,audience_key,published_at,updated_at,
        last_revalidated_at,last_substantial_update_at,freshness_status,quality_score
      from publication_articles
      where status='published'
      order by published_at desc nulls last,updated_at desc
      limit ${Math.max(1,Math.min(200,limit))}
    `;
    return (rows as any[]).map(row => ({
      slug: String(row.slug), title: String(row.title), deck: String(row.deck || ""),
      category: String(row.category), articleType: String(row.article_type),
      audience: String(row.audience_key), publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
      updatedAt: new Date(row.updated_at).toISOString(),
      lastRevalidatedAt: row.last_revalidated_at ? new Date(row.last_revalidated_at).toISOString() : null,
      lastSubstantialUpdateAt: row.last_substantial_update_at ? new Date(row.last_substantial_update_at).toISOString() : null,
      freshnessStatus: String(row.freshness_status), qualityScore: Number(row.quality_score || 0)
    }));
  } catch (error) {
    console.error("Publication list degraded", error);
    return [];
  }
}

export async function getPublishedArticle(slug: string): Promise<PublicArticle | null> {
  if (!process.env.DATABASE_URL) return null;
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 120);
  if (!safe) return null;
  try {
    const sql = db();
    const article = (await sql`
      select id,slug,title,deck,category,article_type,audience_key,published_at,updated_at,
        last_revalidated_at,last_substantial_update_at,freshness_status,quality_score
      from publication_articles
      where slug=${safe} and status='published' limit 1
    `)[0] as any;
    if (!article) return null;
    const [sections, sources] = await Promise.all([
      sql`select section_key,heading,body from publication_article_sections where article_id=${String(article.id)}::uuid order by display_order`,
      sql`select source_id,name,title,url,tier,kind from publication_article_sources where article_id=${String(article.id)}::uuid order by tier,url`
    ]);
    return {
      id: String(article.id), slug: String(article.slug), title: String(article.title),
      deck: String(article.deck || ""), category: String(article.category),
      articleType: String(article.article_type), audience: String(article.audience_key),
      publishedAt: article.published_at ? new Date(article.published_at).toISOString() : null,
      updatedAt: new Date(article.updated_at).toISOString(),
      lastRevalidatedAt: article.last_revalidated_at ? new Date(article.last_revalidated_at).toISOString() : null,
      lastSubstantialUpdateAt: article.last_substantial_update_at ? new Date(article.last_substantial_update_at).toISOString() : null,
      freshnessStatus: String(article.freshness_status), qualityScore: Number(article.quality_score || 0),
      sections: (sections as any[]).map(s => ({ key: String(s.section_key), heading: String(s.heading), body: String(s.body) })),
      sources: (sources as any[]).map(s => ({ id: String(s.source_id), name: String(s.name), title: String(s.title || ""), url: String(s.url), tier: String(s.tier), kind: String(s.kind) }))
    };
  } catch (error) {
    console.error("Publication article degraded", error);
    return null;
  }
}

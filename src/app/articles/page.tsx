import type { Metadata } from "next";
import Link from "next/link";
import { getLatestPublishedFlagship, listPublishedArticles } from "@/lib/publication/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Briefings",
  description: "Original, evidence-backed Briefs reporting and analysis.",
  alternates: { canonical: "/articles" }
};

export default async function ArticlesPage() {
  const [articles,flagship] = await Promise.all([listPublishedArticles(),getLatestPublishedFlagship()]);
  const remaining=flagship?articles.filter(article=>article.slug!==flagship.slug):articles;
  return <main className="section public-index">
    <p className="eyebrow">BRIEFS · BRIEFINGS</p>
    <h1>What changed, and what is worth knowing.</h1>
    <p className="lede">Original reporting and analysis built from verified claims, explicit evidence, global importance, and daily revalidation.</p>
    <div className="rule"/>
    {flagship&&<section className="card">
      <p className="eyebrow">TODAY'S BRIEF · GLOBAL FLAGSHIP · {flagship.category.toUpperCase()}</p>
      <h2><Link href={`/articles/${flagship.slug}`}>{flagship.title}</Link></h2>
      <p>{flagship.deck}</p>
      <p className="muted">Chosen from the global candidate set: importance {flagship.importanceScore}/100 · distinctiveness {flagship.distinctivenessScore}/100 · final {flagship.finalScore}/100{flagship.materialChangeOverride?" · material world-state change":""}</p>
      {flagship.regions.length>0&&<small>Regions in the event signal: {flagship.regions.join(" · ")}</small>}
    </section>}
    {remaining.length === 0 ? <section className="card"><h2>The desk is getting ready.</h2><p>No other published Briefings yet. Living Briefs remain available in <Link href="/briefs">Explore Briefs</Link>.</p></section> :
      <div className="public-grid">{remaining.map(article => <Link className="card public-card" href={`/articles/${article.slug}`} key={article.slug}>
        <span className="pill">{article.category} · {article.freshnessStatus.toUpperCase()}</span>
        <h2>{article.title}</h2><p>{article.deck}</p>
        <small>{article.lastRevalidatedAt ? `Checked ${new Date(article.lastRevalidatedAt).toLocaleDateString()}` : article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleDateString()}` : "Publication pending"}</small>
      </Link>)}</div>}
    <div className="rule"/><p><Link href="/briefs">Explore Living Briefs →</Link></p>
  </main>;
}

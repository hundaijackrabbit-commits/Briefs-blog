import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedArticles } from "@/lib/publication/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Briefings",
  description: "Original, evidence-backed Briefs reporting and analysis.",
  alternates: { canonical: "/articles" }
};

export default async function ArticlesPage() {
  const articles = await listPublishedArticles();
  return <main className="section public-index">
    <p className="eyebrow">BRIEFS · BRIEFINGS</p>
    <h1>What changed, and what is worth knowing.</h1>
    <p className="lede">Original reporting and analysis built from verified claims, explicit evidence, and daily revalidation.</p>
    <div className="rule"/>
    {articles.length === 0 ? <section className="card"><h2>The desk is getting ready.</h2><p>No published Briefings yet. Living Briefs remain available in <Link href="/briefs">Explore Briefs</Link>.</p></section> :
      <div className="public-grid">{articles.map(article => <Link className="card public-card" href={`/articles/${article.slug}`} key={article.slug}>
        <span className="pill">{article.category} · {article.freshnessStatus.toUpperCase()}</span>
        <h2>{article.title}</h2><p>{article.deck}</p>
        <small>{article.lastRevalidatedAt ? `Checked ${new Date(article.lastRevalidatedAt).toLocaleDateString()}` : article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleDateString()}` : "Publication pending"}</small>
      </Link>)}</div>}
    <div className="rule"/><p><Link href="/briefs">Explore Living Briefs →</Link></p>
  </main>;
}

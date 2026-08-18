import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticle } from "@/lib/publication/public";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

export const dynamic = "force-dynamic";
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };
  const canonical = `${briefsBaseUrl()}/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.deck.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      type: "article", title: article.title, description: article.deck, url: canonical, siteName: "Briefs",
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.lastSubstantialUpdateAt || article.updatedAt
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) { notFound(); throw new Error("Article not found"); }
  const canonical = `${briefsBaseUrl()}/articles/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.deck,
    datePublished: article.publishedAt,
    dateModified: article.lastSubstantialUpdateAt || article.updatedAt,
    author: { "@type": "Organization", name: "Briefs" },
    publisher: { "@type": "Organization", name: "Briefs", url: briefsBaseUrl() },
    mainEntityOfPage: canonical,
    citation: article.sources.map(s => s.url),
    isAccessibleForFree: true
  };
  return <main className="section brief public-brief">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
    <nav className="breadcrumb"><Link href="/articles">Briefings</Link><span>→</span><span>{article.category}</span></nav>
    <header className="public-brief-head"><div><p className="eyebrow">{article.category} · {article.articleType.toUpperCase()}</p><h1>{article.title}</h1><p className="lede">{article.deck}</p></div></header>
    <div className="brief-authority-meta">
      <span>{article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleDateString()}` : "Published"}</span>
      <span>{article.lastRevalidatedAt ? `Checked ${new Date(article.lastRevalidatedAt).toLocaleDateString()}` : "Revalidation pending"}</span>
      <span>{article.freshnessStatus.replace(/-/g," ")}</span>
    </div>
    <div className="rule"/>
    {article.sections.map(section => <section key={section.key}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
    <div className="rule"/>
    <section><h2>Evidence</h2><p className="muted">{article.sources.length} source{article.sources.length === 1 ? "" : "s"} in the current evidence set.</p>
      <div className="brief-sources">{article.sources.map(source => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
        <strong>{source.name}</strong><span>Tier {source.tier} · {source.kind}</span>{source.title && <small>{source.title}</small>}
      </a>)}</div></section>
    <footer className="brief-meta">Canonical: {canonical} · This article is revalidated against its tracked knowledge dependencies.</footer>
  </main>;
}

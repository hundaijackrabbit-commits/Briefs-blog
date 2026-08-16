import { notFound } from "next/navigation";
import { getBriefBySlug, getClaimsByIds, getSourcesByIds } from "@/lib/db";

export default async function BriefPage({ params }:{ params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const brief = await getBriefBySlug(slug); if (!brief) notFound();
  const [sources, claims] = await Promise.all([getSourcesByIds(brief.sourceIds), getClaimsByIds(brief.claimIds)]);
  return <main className="shell">
    <section className="briefHeader"><div className="kicker">{brief.category} · Living Brief</div><h1>{brief.title}</h1><p>{brief.deck}</p><div className="meta"><span className="pill"><span className="dot"/> {brief.freshnessScore}% current</span><span className="pill">Verified {new Date(brief.lastVerifiedAt).toLocaleString("en-CA")}</span><span className="pill">{sources.length} sources</span></div></section>
    <div className="briefLayout">
      <article className="article">
        <div className="kicker">The answer</div><p className="answer">{brief.answer}</p>
        <h2>Why it matters</h2><p>{brief.whyItMatters}</p>
        <h2>The context</h2><p>{brief.context}</p>
        <h2>What to watch next</h2><ul>{brief.watchNext.map((x)=><li key={x}>{x}</li>)}</ul>
        <h2>Verified claims</h2>{claims.map((claim)=><div key={claim.id} className="source"><strong>{claim.key.replaceAll("_"," ")}</strong><br/>{claim.value}<div className="meta"><span>{claim.confidence} confidence</span><span>{claim.freshnessClass}</span><span>verified {new Date(claim.lastVerifiedAt).toLocaleDateString("en-CA")}</span></div></div>)}
      </article>
      <aside className="side">
        <div className="panel"><h3>Freshness</h3><strong style={{fontSize:34}}>{brief.freshnessScore}%</strong><p>Last substantial update<br/><strong>{new Date(brief.lastSubstantialUpdateAt).toLocaleDateString("en-CA")}</strong></p></div>
        <div className="panel"><h3>Sources</h3>{sources.map((s)=><div className="source" key={s.id}><a href={s.url} target="_blank" rel="noreferrer"><strong>{s.name}</strong></a><br/>Tier {s.tier} · {s.sourceType}</div>)}</div>
        <div className="panel"><h3>Editorial promise</h3><p>We distinguish sourced facts from analysis, record meaningful changes, and do not change dates just to simulate freshness.</p></div>
      </aside>
    </div>
  </main>
}

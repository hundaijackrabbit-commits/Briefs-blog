import Link from "next/link";
import { getBriefs } from "@/lib/db";

export default async function Home() {
  const briefs = await getBriefs();
  return <main className="shell">
    <section className="hero">
      <div className="kicker">Living intelligence, without the overload</div>
      <h1>Know what changed. Understand why it matters.</h1>
      <p>Briefs turns important developments into concise, sourced, continuously maintained explanations. We publish, verify, and keep the knowledge current.</p>
      <div className="meta"><span className="pill"><span className="dot"/> Daily freshness engine</span><span className="pill">Claim-level sourcing</span><span className="pill">Living briefs</span></div>
    </section>

    <section className="section" id="today">
      <div className="sectionTitle"><h2>Today’s Briefs</h2><p>V1 launches with a narrow, high-authority technology and business layer before expanding topic-by-topic.</p></div>
      <div className="grid">{briefs.map((brief)=><Link className="card" href={`/brief/${brief.slug}`} key={brief.id}>
        <div><div className="kicker">{brief.category}</div><h3>{brief.title}</h3><p>{brief.deck}</p></div>
        <div className="meta"><span>{brief.readingMinutes} min</span><span>Freshness {brief.freshnessScore}%</span><span>Verified {new Date(brief.lastVerifiedAt).toLocaleDateString("en-CA")}</span></div>
      </Link>)}</div>
    </section>

    <section className="section" id="living">
      <div className="sectionTitle"><h2>Publish and maintain.</h2></div>
      <div className="grid">
        <div className="card"><div><div className="kicker">01 · Sources</div><h3>Evidence first.</h3><p>Primary sources, trusted reporting and specialist material are tracked separately by source tier.</p></div></div>
        <div className="card"><div><div className="kicker">02 · Claims</div><h3>Facts have lifespans.</h3><p>Claims carry source IDs, confidence, freshness class and last-verification time.</p></div></div>
        <div className="card"><div><div className="kicker">03 · Review</div><h3>Automation has boundaries.</h3><p>Objective updates can be automated; interpretation and sensitive claims are routed to editorial review.</p></div></div>
      </div>
    </section>
  </main>
}

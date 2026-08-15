import { getBriefs, getReviewQueue } from "@/lib/db";

export default async function Admin() {
  const [briefs, queue] = await Promise.all([getBriefs(),getReviewQueue()]);
  const avg = briefs.length ? Math.round(briefs.reduce((a,b)=>a+b.freshnessScore,0)/briefs.length) : 100;
  return <main className="shell"><section className="adminHead"><div className="kicker">Internal preview</div><h2 style={{fontSize:52,margin:"10px 0"}}>Briefs Intelligence</h2><p>Freshness and editorial review dashboard.</p></section>
    <div className="stats"><div className="stat"><span>Living briefs</span><strong>{briefs.length}</strong></div><div className="stat"><span>Average freshness</span><strong>{avg}%</strong></div><div className="stat"><span>Open review items</span><strong>{queue.length}</strong></div><div className="stat"><span>Engine status</span><strong className="status-good">Ready</strong></div></div>
    <div className="queue"><div className="queueRow"><strong>Review item</strong><strong>Confidence</strong><strong>Mode</strong><strong>Detected</strong></div>{queue.map((item)=><div className="queueRow" key={item.id}><div><strong>{item.title}</strong><br/><span style={{color:"var(--muted)"}}>{item.reason}</span></div><span>{item.confidence}</span><span className={item.mode==="manual"?"status-bad":"status-warn"}>{item.mode}</span><span>{new Date(item.detectedAt).toLocaleString("en-CA")}</span></div>)}</div>
  </main>
}

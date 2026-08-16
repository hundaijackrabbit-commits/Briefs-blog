import { db } from "@/lib/db";
export const dynamic='force-dynamic';

export default async function EditorialAdmin(){
  let rows:any[]=[]; let unavailable='';
  try{const sql=db();rows=await sql`select er.id,er.status,er.review_mode,er.risk_class,er.rationale,er.before_body,er.proposed_body,er.quality_score,er.quality_blockers,er.created_at,b.title,bs.heading from editorial_revisions er join briefs b on b.id=er.brief_id join brief_sections bs on bs.id=er.section_id order by case er.status when 'proposed' then 0 when 'approved' then 1 else 2 end,er.created_at desc limit 100`;}
  catch(e){unavailable=e instanceof Error?e.message:'Database unavailable';}
  return <main className="shell"><section className="hero"><p className="eyebrow">BRIEFS INTELLIGENCE · V4</p><h1>Editorial cockpit</h1><p className="lede">Evidence-backed changes stop here before publication unless the policy engine classifies them as objective, confirmed, Tier-A, and normal-risk.</p></section>{unavailable?<section className="card"><h2>Database not connected</h2><p>{unavailable}</p></section>:<section className="grid">{rows.length===0?<article className="card"><h2>Queue clear</h2><p>No editorial revisions are waiting.</p></article>:rows.map(r=><article className="card" key={r.id}><p className="eyebrow">{r.status} · {r.review_mode} · {r.risk_class}</p><h2>{r.title} — {r.heading}</h2><p>{r.rationale}</p><p><strong>Quality:</strong> {r.quality_score ?? 'not scored'} {r.quality_blockers?.length?`· blocked: ${r.quality_blockers.join(', ')}`:''}</p><details><summary>Compare revision</summary><p><strong>Before</strong></p><pre>{r.before_body}</pre><p><strong>Proposed</strong></p><pre>{r.proposed_body}</pre></details><code>{r.id}</code></article>)}</section>}</main>;
}

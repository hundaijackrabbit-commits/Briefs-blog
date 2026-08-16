import { db } from "@/lib/db";
export const dynamic='force-dynamic';
export default async function KnowledgeAdmin(){
  let stats:any={entities:0,claims:0,evidence:0,snapshots:0,changes:0};
  try{const sql=db();const [r]=await sql`select (select count(*)::int from entities) entities,(select count(*)::int from claims) claims,(select count(*)::int from claim_evidence) evidence,(select count(*)::int from knowledge_snapshots) snapshots,(select count(*)::int from change_candidates where status='open') changes`;stats=r;}catch{}
  return <main className="shell"><p className="eyebrow">ADMIN · KNOWLEDGE</p><h1>Knowledge Intelligence</h1><div className="metrics"><div><strong>{stats.entities}</strong><span>entities</span></div><div><strong>{stats.claims}</strong><span>claims</span></div><div><strong>{stats.evidence}</strong><span>evidence links</span></div><div><strong>{stats.snapshots}</strong><span>snapshots</span></div><div><strong>{stats.changes}</strong><span>open changes</span></div></div><section className="card"><h2>V3 foundation</h2><p>Entity resolution, evidence independence, temporal claims, change candidates, historical snapshots, Brief Request/Plan/Result objects, coverage scoring and quality gates are now represented in the application layer.</p></section></main>;
}

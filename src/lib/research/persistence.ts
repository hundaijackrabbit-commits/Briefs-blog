import { db } from "@/lib/db";
import type { ResearchGraph } from "@/lib/research/types";

export async function persistResearchGraph(graph:ResearchGraph){
  if(!process.env.DATABASE_URL) return null;
  try{
    const sql=db();
    const rows=await sql`insert into research_runs(subject,status,query_plan,source_count,finding_count,started_at,completed_at) values(${graph.plan.normalized},'completed',${sql.json(JSON.parse(JSON.stringify(graph.plan)))},${graph.sources.length},${graph.findings.length},${graph.generatedAt},now()) returning id`;
    const runId=String(rows[0]?.id||"");
    if(!runId) return null;
    const evidenceMap=new Map<string,string>();
    for(const source of graph.sources){
      const result=await sql`insert into research_evidence(run_id,provider,source_name,title,url,tier,kind,retrieved_at,content_excerpt,metadata) values(${runId}::uuid,${source.provider},${source.name},${source.title},${source.url},${source.tier},${source.kind},${source.retrievedAt},${source.excerpt},${sql.json(JSON.parse(JSON.stringify(source.metadata||{})))}) returning id`;
      evidenceMap.set(source.id,String(result[0]?.id||""));
    }
    for(const finding of graph.findings){
      const evidenceIds=finding.sourceIds.map(id=>evidenceMap.get(id)).filter((id):id is string=>Boolean(id));
      await sql`insert into research_findings(run_id,finding_key,subject,predicate,value_text,statement,confidence,verification_status,evidence_ids,status) values(${runId}::uuid,${finding.id},${finding.subject},${finding.predicate},${finding.valueText},${finding.statement},${finding.confidence},${finding.verificationStatus},${evidenceIds}::uuid[],'staged') on conflict(run_id,finding_key) do nothing`;
    }
    return runId;
  }catch(error){
    console.error("Unable to persist V6 research graph",error);
    return null;
  }
}

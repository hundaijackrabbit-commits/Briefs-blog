import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { ResearchGraph } from "@/lib/research/types";

function fingerprint(value:string){return createHash("sha256").update(value).digest("hex");}
function memoryTtlMs(graph:ResearchGraph){
  if(graph.plan.freshness==="live") return 60*60*1000;
  if(graph.plan.freshness==="historical") return 30*24*60*60*1000;
  return 24*60*60*1000;
}
function changeImportance(predicate:string){return /price|revenue|earnings|ceo|president|release|status|availability|funding|rate/i.test(predicate)?82:68;}

export async function loadResearchMemory(memoryKey:string):Promise<ResearchGraph|null>{
  if(!process.env.DATABASE_URL) return null;
  try{
    const sql=db();
    const rows=await sql`select graph from research_memories where memory_key=${memoryKey} and expires_at>now() limit 1`;
    const graph=rows[0]?.graph as ResearchGraph|undefined;
    return graph&&typeof graph==="object"?graph:null;
  }catch{return null;}
}

async function persistLivingMemory(sql:any,memoryKey:string,graph:ResearchGraph){
  const previousRows=await sql`select graph from research_memories where memory_key=${memoryKey} limit 1`;
  const previous=previousRows[0]?.graph as ResearchGraph|undefined;
  if(previous?.findings?.length){
    const old=new Map<string,ResearchGraph["findings"][number]>();
    for(const oldFinding of previous.findings) old.set(`${oldFinding.subject.toLowerCase()}|${oldFinding.predicate.toLowerCase()}`,oldFinding);
    for(const finding of graph.findings){
      const key=`${finding.subject.toLowerCase()}|${finding.predicate.toLowerCase()}`;const before=old.get(key);
      if(!before||before.valueText.trim().toLowerCase()===finding.valueText.trim().toLowerCase())continue;
      const id=fingerprint(`${graph.canonicalSubject}|${finding.predicate}|${before.valueText}|${finding.valueText}`);
      await sql`insert into observed_changes(subject,change_type,summary,source_url,source_family,event_at,importance,fingerprint,metadata)
        values(${graph.canonicalSubject},'research-state-change',${`${finding.predicate}: ${before.valueText} → ${finding.valueText}`},${graph.sources.find(s=>finding.sourceIds.includes(s.id))?.url??null},${graph.sources.find(s=>finding.sourceIds.includes(s.id))?.independenceFamily??null},${graph.knowledgeCutoff},${changeImportance(finding.predicate)},${id},${sql.json(JSON.parse(JSON.stringify({predicate:finding.predicate,before:before.valueText,after:finding.valueText})))}) on conflict(fingerprint) do nothing`;
    }
  }
  const expiresAt=new Date(Date.now()+memoryTtlMs(graph));
  await sql`insert into research_memories(memory_key,subject,canonical_subject,freshness,graph,knowledge_cutoff,expires_at)
    values(${memoryKey},${graph.plan.normalized},${graph.canonicalSubject},${graph.plan.freshness},${sql.json(JSON.parse(JSON.stringify(graph)))},${graph.knowledgeCutoff},${expiresAt})
    on conflict(memory_key) do update set canonical_subject=excluded.canonical_subject,freshness=excluded.freshness,graph=excluded.graph,knowledge_cutoff=excluded.knowledge_cutoff,expires_at=excluded.expires_at,updated_at=now()`;
}

export async function persistResearchGraph(graph:ResearchGraph,memoryKey?:string){
  if(!process.env.DATABASE_URL) return {runId:null,memory:false};
  try{
    const sql=db();
    const rows=await sql`insert into research_runs(subject,status,query_plan,source_count,finding_count,started_at,completed_at) values(${graph.plan.normalized},'completed',${sql.json(JSON.parse(JSON.stringify(graph.plan)))},${graph.sources.length},${graph.findings.length},${graph.generatedAt},now()) returning id`;
    const runId=String(rows[0]?.id||"");
    if(!runId) return {runId:null,memory:false};
    const evidenceMap=new Map<string,string>();
    for(const source of graph.sources){
      const result=await sql`insert into research_evidence(run_id,provider,source_name,title,url,tier,kind,retrieved_at,content_excerpt,metadata) values(${runId}::uuid,${source.provider},${source.name},${source.title},${source.url},${source.tier},${source.kind},${source.retrievedAt},${source.excerpt},${sql.json(JSON.parse(JSON.stringify(source.metadata||{})))}) returning id`;
      evidenceMap.set(source.id,String(result[0]?.id||""));
    }
    for(const finding of graph.findings){
      const evidenceIds=finding.sourceIds.map(id=>evidenceMap.get(id)).filter((id):id is string=>Boolean(id));
      await sql`insert into research_findings(run_id,finding_key,subject,predicate,value_text,statement,confidence,verification_status,evidence_ids,status) values(${runId}::uuid,${finding.id},${finding.subject},${finding.predicate},${finding.valueText},${finding.statement},${finding.confidence},${finding.verificationStatus},${evidenceIds}::uuid[],'staged') on conflict(run_id,finding_key) do nothing`;
    }
    for(const item of graph.iterations||[]){
      await sql`insert into research_iterations(run_id,iteration,gap_kind,reason,next_query) values(${runId}::uuid,${item.iteration},${item.gapKind},${item.reason},${item.nextQuery})`;
    }
    if(memoryKey) await persistLivingMemory(sql,memoryKey,graph);
    return {runId,memory:Boolean(memoryKey)};
  }catch(error){
    console.error("Unable to persist V10 research graph",error);
    return {runId:null,memory:false};
  }
}

import { db } from "@/lib/db";
import { resolveEntities } from "@/lib/engine/entity-resolution";
import type { BriefRequest } from "@/lib/types";
import { findStarterTopic } from "@/lib/knowledge/starter";
import { researchSubject } from "@/lib/research/research-engine";
import { classifyQuery } from "@/lib/intelligence/query-intent";
import { researchFinance } from "@/lib/research/finance-engine";

export type KnowledgeClaim={
  id:string; predicate:string; valueText:string; text:string; confidence:"high"|"medium"|"low";
  verificationStatus:string; lastVerifiedAt:string|null; sourceIds:string[];
};
export type KnowledgeChange={id:string;summary:string;changedAt:string;importance:number};
export type KnowledgeSource={id:string;name:string;url:string;tier:"A"|"B"|"C"|"D";kind:string};
export type KnowledgeBundle={
  subject:string; entityIds:string[]; description:string; whyItMatters:string; claims:KnowledgeClaim[];
  changes:KnowledgeChange[]; sources:KnowledgeSource[]; watchItems:string[]; knowledgeCutoff:string;
  researchNeeded:boolean; missingEvidence:string[]; mode:"database"|"starter"|"research"|"empty"; dynamic:boolean;
};

function depthLimit(depth:BriefRequest["depth"]){return depth==="flash"?2:depth==="quick"?4:depth==="standard"?8:20;}

async function loadDatabaseKnowledge(request:BriefRequest):Promise<KnowledgeBundle|null>{
  if(!process.env.DATABASE_URL) return null;
  const sql=db();
  const resolved=request.entityIds?.length?request.entityIds:(await resolveEntities(request.subject)).map(x=>x.entityId);
  if(!resolved.length) return null;
  const entityRows=await sql`select id,name,coalesce(description,'') as description from entities where id=any(${resolved}::text[]) order by array_position(${resolved}::text[],id)`;
  const limit=depthLimit(request.depth);
  const claimRows=await sql`select id,entity_id,predicate,value_text,verification_status,confidence,last_verified_at from claims where entity_id=any(${resolved}::text[]) and valid_to is null and verification_status<>'retracted' order by coalesce(last_verified_at,created_at) desc limit ${Math.max(limit*3,20)}`;
  const claimIds=claimRows.map((row:any)=>row.id);
  const evidenceRows=claimIds.length?await sql`
    select ce.claim_id,s.id as source_id,s.name,s.url,s.tier,s.source_type
    from claim_evidence ce
    join source_documents d on d.id=ce.document_id
    join sources s on s.id=d.source_id
    where ce.claim_id=any(${claimIds}::uuid[]) and ce.stance='supports'
  `:[];
  const sourceByClaim=new Map<string,string[]>();
  const sourceMap=new Map<string,KnowledgeSource>();
  for(const row of evidenceRows as any[]){
    sourceByClaim.set(row.claim_id,[...(sourceByClaim.get(row.claim_id)||[]),row.source_id]);
    if(!sourceMap.has(row.source_id)) sourceMap.set(row.source_id,{id:row.source_id,name:row.name,url:row.url,tier:row.tier,kind:row.source_type});
  }
  const from=request.timeRange?.from?new Date(request.timeRange.from):new Date(Date.now()-7*86400000);
  const changes=await sql`select id,summary,changed_at from change_log where entity_id=any(${resolved}::text[]) and changed_at>=${from} order by changed_at desc limit 25`;
  const claims:KnowledgeClaim[]=claimRows.map((row:any)=>({id:String(row.id),predicate:row.predicate,valueText:row.value_text,text:`${row.predicate}: ${row.value_text}`,confidence:row.confidence,verificationStatus:row.verification_status,lastVerifiedAt:row.last_verified_at?new Date(row.last_verified_at).toISOString():null,sourceIds:sourceByClaim.get(String(row.id))||[]}));
  const verified=claims.filter(c=>["confirmed","corroborated"].includes(c.verificationStatus));
  const missingEvidence=claims.filter(c=>!c.sourceIds.length||!["confirmed","corroborated"].includes(c.verificationStatus)).map(c=>`${c.predicate}:${c.id}`);
  const cutoff=claims.map(c=>c.lastVerifiedAt).filter(Boolean).sort().at(-1) || new Date().toISOString();
  const first=entityRows[0];
  return {subject:first?.name||request.subject,entityIds:resolved,description:first?.description||"",whyItMatters:"",claims,changes:changes.map((c:any)=>({id:String(c.id),summary:c.summary,changedAt:new Date(c.changed_at).toISOString(),importance:70})),sources:[...sourceMap.values()],watchItems:[],knowledgeCutoff:cutoff,researchNeeded:verified.length===0||missingEvidence.length>Math.max(3,claims.length*.4),missingEvidence,mode:"database",dynamic:true};
}

function loadStarterKnowledge(request:BriefRequest):KnowledgeBundle{
  const topic=findStarterTopic(request.subject);
  if(!topic) return {subject:request.subject,entityIds:[],description:`Briefs does not yet have enough verified knowledge to summarize ${request.subject}.`,whyItMatters:"",claims:[],changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date().toISOString(),researchNeeded:true,missingEvidence:["No matching verified starter topic"],mode:"empty",dynamic:true};
  const limit=depthLimit(request.depth);
  const summary=request.depth==="flash"?topic.flashSummary:request.depth==="quick"?topic.quickSummary:topic.summary;
  return {subject:topic.name,entityIds:[topic.id],description:summary,whyItMatters:topic.whyItMatters,claims:topic.facts.slice(0,limit).map(f=>({id:f.id,predicate:f.label,valueText:f.value,text:f.text,confidence:f.confidence,verificationStatus:"corroborated",lastVerifiedAt:topic.knowledgeCutoff,sourceIds:f.sourceIds})),changes:[],sources:topic.sources,watchItems:topic.watchItems,knowledgeCutoff:topic.knowledgeCutoff,researchNeeded:topic.dynamic,missingEvidence:topic.dynamic?["Live-source refresh recommended for time-sensitive claims"]:[],mode:"starter",dynamic:topic.dynamic};
}

function researchBundle(graph:Awaited<ReturnType<typeof researchSubject>>,request:BriefRequest):KnowledgeBundle{
  const sourceIds=new Set(graph.sources.map(s=>s.id));
  return {
    subject:graph.canonicalSubject,
    entityIds:[],
    description:graph.description||`Briefs researched ${request.subject}, but the available evidence was too thin to summarize safely.`,
    whyItMatters:"",
    claims:graph.findings.map(f=>({id:f.id,predicate:f.predicate,valueText:f.valueText,text:f.statement,confidence:f.confidence,verificationStatus:f.verificationStatus,lastVerifiedAt:graph.knowledgeCutoff,sourceIds:f.sourceIds.filter(id=>sourceIds.has(id))})),
    changes:graph.plan.intent==="current"?graph.sources.filter(s=>s.kind==="reporting"&&s.publishedAt).slice(0,7).map((s,index)=>({id:`research-change-${s.id}`,summary:s.title,changedAt:s.publishedAt as string,importance:65-index*3})):[],
    sources:graph.sources.map(s=>({id:s.id,name:`${s.name} — ${s.title}`,url:s.url,tier:s.tier,kind:s.kind})),
    watchItems:graph.plan.intent==="current"?["New primary-source confirmations","Material follow-up reporting from independent outlets","Whether the reported change persists or is superseded"]:[],
    knowledgeCutoff:graph.knowledgeCutoff,
    researchNeeded:!graph.sufficient||graph.missingEvidence.length>0,
    missingEvidence:graph.missingEvidence,
    mode:graph.sufficient?"research":"empty",
    dynamic:graph.plan.freshness!=="historical"
  };
}

export async function loadKnowledge(request:BriefRequest):Promise<KnowledgeBundle>{
  const intent=classifyQuery(request);
  if(intent.domain==="finance"){
    try{
      const finance=await researchFinance(request,intent);
      if(finance) return finance;
    }catch(error){
      console.error("Briefs V7 finance research fallback",error);
    }
  }
  if(process.env.DATABASE_URL){
    try{
      const database=await loadDatabaseKnowledge(request);
      if(database&&(!database.researchNeeded||database.claims.length>0)) return database;
    }catch(error){
      console.error("Briefs database knowledge fallback",error);
    }
  }
  const starter=loadStarterKnowledge(request);
  const shouldResearch=intent.domain==="current"||starter.mode==="empty"||(starter.researchNeeded&&request.depth==="research");
  if(!shouldResearch) return starter;
  try{
    const graph=await researchSubject(request);
    if(graph.sufficient) return researchBundle(graph,request);
  }catch(error){
    console.error("Briefs V6 research fallback",error);
  }
  return starter;
}

import { db } from "@/lib/db";
import { resolveEntities } from "@/lib/engine/entity-resolution";
import type { BriefRequest } from "@/lib/types";
import { findStarterTopic } from "@/lib/knowledge/starter";
import { researchSubject } from "@/lib/research/research-engine";
import { classifyQuery,type QueryIntentResult } from "@/lib/intelligence/query-intent";
import { researchFinance } from "@/lib/research/finance-engine";

export type KnowledgeClaim={id:string;predicate:string;valueText:string;text:string;confidence:"high"|"medium"|"low";verificationStatus:string;lastVerifiedAt:string|null;sourceIds:string[]};
export type KnowledgeChange={id:string;summary:string;changedAt:string;importance:number};
export type KnowledgeSource={id:string;name:string;url:string;tier:"A"|"B"|"C"|"D";kind:string};
export type KnowledgeBundle={
  subject:string;entityIds:string[];description:string;whyItMatters:string;claims:KnowledgeClaim[];changes:KnowledgeChange[];sources:KnowledgeSource[];watchItems:string[];knowledgeCutoff:string;
  researchNeeded:boolean;missingEvidence:string[];mode:"database"|"starter"|"research"|"empty";dynamic:boolean;
  comparison?:{subject:string;summary:string;factCount:number;sourceCount:number}[];
  researchMeta?:{iterations:number;stopReason?:string;persisted:boolean;independentSources:number};
};

function depthLimit(depth:BriefRequest["depth"]){return depth==="flash"?2:depth==="quick"?4:depth==="standard"?8:20;}

async function resolveForRequest(request:BriefRequest,intent?:QueryIntentResult){
  if(request.entityIds?.length)return request.entityIds;
  return (await resolveEntities(intent?.entityQuery||request.subject)).map(x=>x.entityId);
}

async function loadPreviousState(request:BriefRequest,intent:QueryIntentResult):Promise<KnowledgeBundle|null>{
  if(!process.env.DATABASE_URL)return null;const sql=db();const resolved=await resolveForRequest(request,intent);if(!resolved.length)return null;
  const entity=(await sql`select id,name from entities where id=any(${resolved}::text[]) order by array_position(${resolved}::text[],id) limit 1`)[0] as any;if(!entity)return null;
  const snapshots=await sql`select snapshot_at,state from knowledge_snapshots where entity_id=${String(entity.id)} order by snapshot_at desc limit 2`;
  const prior=(snapshots.length>1?snapshots[1]:snapshots[0]) as any;
  if(prior?.state?.claims?.length){
    const rows=(prior.state.claims as any[]).slice(0,depthLimit(request.depth));
    const claims:KnowledgeClaim[]=rows.map((c:any,index)=>({id:String(c.id||`snapshot-${index}`),predicate:String(c.predicate||"Recorded fact"),valueText:String(c.value||""),text:`${String(c.predicate||"Recorded fact")}: ${String(c.value||"")}`,confidence:["high","medium","low"].includes(String(c.confidence))?c.confidence:"medium",verificationStatus:String(c.verification||"reported"),lastVerifiedAt:new Date(prior.snapshot_at).toISOString(),sourceIds:[]}));
    return {subject:`${entity.name} — previous recorded state`,entityIds:[String(entity.id)],description:`At ${new Date(prior.snapshot_at).toISOString()}, Briefs recorded: ${claims.slice(0,6).map(c=>`${c.predicate}: ${c.valueText}`).join("; ")}.`,whyItMatters:"This is Briefs’ historical knowledge state, not a statement that those values are still current.",claims,changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date(prior.snapshot_at).toISOString(),researchNeeded:false,missingEvidence:[],mode:"database",dynamic:false};
  }
  const versions=await sql`select cv.id,c.predicate,cv.value_text,cv.verification_status,cv.confidence,cv.recorded_at from claim_versions cv join claims c on c.id=cv.claim_id where c.entity_id=${String(entity.id)} order by cv.recorded_at desc limit ${depthLimit(request.depth)}`;
  if(versions.length){
    const claims:KnowledgeClaim[]=(versions as any[]).map(v=>({id:String(v.id),predicate:String(v.predicate),valueText:String(v.value_text),text:`${v.predicate}: ${v.value_text}`,confidence:v.confidence,verificationStatus:v.verification_status,lastVerifiedAt:new Date(v.recorded_at).toISOString(),sourceIds:[]}));
    return {subject:`${entity.name} — previous recorded state`,entityIds:[String(entity.id)],description:`Briefs’ claim history previously recorded: ${claims.slice(0,6).map(c=>`${c.predicate}: ${c.valueText}`).join("; ")}.`,whyItMatters:"This reconstructs stored historical state rather than re-researching the web and pretending it represents prior Briefs knowledge.",claims,changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date(versions[0].recorded_at).toISOString(),researchNeeded:false,missingEvidence:[],mode:"database",dynamic:false};
  }
  return {subject:`${entity.name} — previous recorded state`,entityIds:[String(entity.id)],description:`Briefs does not yet have an earlier stored snapshot for ${entity.name}.`,whyItMatters:"Briefs will not invent a prior belief when no historical state was recorded.",claims:[],changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date().toISOString(),researchNeeded:false,missingEvidence:["No prior stored snapshot or claim version exists for this entity"],mode:"database",dynamic:false};
}

async function loadDatabaseKnowledge(request:BriefRequest,intent?:QueryIntentResult):Promise<KnowledgeBundle|null>{
  if(!process.env.DATABASE_URL)return null;const sql=db();const resolved=await resolveForRequest(request,intent);if(!resolved.length)return null;
  const entityRows=await sql`select id,name,coalesce(description,'') as description from entities where id=any(${resolved}::text[]) order by array_position(${resolved}::text[],id)`;
  const limit=depthLimit(request.depth);
  const claimRows=await sql`select id,entity_id,predicate,value_text,verification_status,confidence,last_verified_at from claims where entity_id=any(${resolved}::text[]) and valid_to is null and verification_status<>'retracted' order by coalesce(last_verified_at,created_at) desc limit ${Math.max(limit*3,20)}`;
  const claimIds=claimRows.map((row:any)=>row.id);
  const evidenceRows=claimIds.length?await sql`select ce.claim_id,s.id source_id,s.name,s.url,s.tier,s.source_type from claim_evidence ce join source_documents d on d.id=ce.document_id join sources s on s.id=d.source_id where ce.claim_id=any(${claimIds}::uuid[]) and ce.stance='supports'`:[];
  const sourceByClaim=new Map<string,string[]>();const sourceMap=new Map<string,KnowledgeSource>();
  for(const row of evidenceRows as any[]){sourceByClaim.set(String(row.claim_id),[...(sourceByClaim.get(String(row.claim_id))||[]),String(row.source_id)]);if(!sourceMap.has(String(row.source_id)))sourceMap.set(String(row.source_id),{id:String(row.source_id),name:String(row.name),url:String(row.url),tier:row.tier,kind:String(row.source_type)});}
  const from=request.timeRange?.from?new Date(request.timeRange.from):new Date(Date.now()-7*86400000);
  const changes=await sql`select id,summary,changed_at from change_log where entity_id=any(${resolved}::text[]) and changed_at>=${from} order by changed_at desc limit 25`;
  const claims:KnowledgeClaim[]=claimRows.map((row:any)=>({id:String(row.id),predicate:String(row.predicate),valueText:String(row.value_text),text:`${row.predicate}: ${row.value_text}`,confidence:row.confidence,verificationStatus:String(row.verification_status),lastVerifiedAt:row.last_verified_at?new Date(row.last_verified_at).toISOString():null,sourceIds:sourceByClaim.get(String(row.id))||[]}));
  const verified=claims.filter(c=>["confirmed","corroborated"].includes(c.verificationStatus));const missingEvidence=claims.filter(c=>!c.sourceIds.length||!["confirmed","corroborated"].includes(c.verificationStatus)).map(c=>`${c.predicate}:${c.id}`);
  const cutoff=claims.map(c=>c.lastVerifiedAt).filter((x):x is string=>Boolean(x)).sort().at(-1)||new Date(0).toISOString();const first=entityRows[0];
  return {subject:first?.name||intent?.entityQuery||request.subject,entityIds:resolved,description:first?.description||"",whyItMatters:"",claims,changes:(changes as any[]).map(c=>({id:String(c.id),summary:String(c.summary),changedAt:new Date(c.changed_at).toISOString(),importance:70})),sources:[...sourceMap.values()],watchItems:[],knowledgeCutoff:cutoff,researchNeeded:verified.length===0||missingEvidence.length>Math.max(3,claims.length*.4),missingEvidence,mode:"database",dynamic:true};
}

function loadStarterKnowledge(request:BriefRequest):KnowledgeBundle{
  const topic=findStarterTopic(request.subject);if(!topic)return {subject:request.subject,entityIds:[],description:`Briefs does not yet have enough verified knowledge to summarize ${request.subject}.`,whyItMatters:"",claims:[],changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date(0).toISOString(),researchNeeded:true,missingEvidence:["No matching verified starter topic"],mode:"empty",dynamic:true};
  const limit=depthLimit(request.depth);const summary=request.depth==="flash"?topic.flashSummary:request.depth==="quick"?topic.quickSummary:topic.summary;
  return {subject:topic.name,entityIds:[topic.id],description:summary,whyItMatters:topic.whyItMatters,claims:topic.facts.slice(0,limit).map(f=>({id:f.id,predicate:f.label,valueText:f.value,text:f.text,confidence:f.confidence,verificationStatus:"corroborated",lastVerifiedAt:topic.knowledgeCutoff,sourceIds:f.sourceIds})),changes:[],sources:topic.sources,watchItems:topic.watchItems,knowledgeCutoff:topic.knowledgeCutoff,researchNeeded:topic.dynamic,missingEvidence:topic.dynamic?["Live-source refresh recommended for time-sensitive claims"]:[],mode:"starter",dynamic:topic.dynamic};
}

function researchBundle(graph:Awaited<ReturnType<typeof researchSubject>>,request:BriefRequest):KnowledgeBundle{
  const ids=new Set(graph.sources.map(s=>s.id));const families=new Set(graph.sources.map(s=>s.independenceFamily));
  return {subject:graph.canonicalSubject,entityIds:[],description:graph.description||`Briefs researched ${request.subject}, but the available evidence was too thin to summarize safely.`,whyItMatters:"",claims:graph.findings.map(f=>({id:f.id,predicate:f.predicate,valueText:f.valueText,text:f.statement,confidence:f.confidence,verificationStatus:f.verificationStatus,lastVerifiedAt:graph.knowledgeCutoff,sourceIds:f.sourceIds.filter(id=>ids.has(id))})),changes:graph.plan.intent==="current"?graph.sources.filter(s=>(s.kind==="reporting"||s.kind==="primary")&&s.publishedAt).slice(0,7).map((s,index)=>({id:`research-change-${s.id}`,summary:s.title,changedAt:s.publishedAt as string,importance:70-index*3})):[],sources:graph.sources.map(s=>({id:s.id,name:`${s.name} — ${s.title}`,url:s.url,tier:s.tier,kind:s.kind})),watchItems:graph.plan.intent==="current"?["New primary-source confirmations","Material follow-up reporting from independent outlets","Whether the reported change persists or is superseded"]:[],knowledgeCutoff:graph.knowledgeCutoff,researchNeeded:!graph.sufficient||graph.missingEvidence.length>0,missingEvidence:graph.missingEvidence,mode:graph.sufficient?"research":"empty",dynamic:graph.plan.freshness!=="historical",comparison:graph.comparison,researchMeta:{iterations:graph.iterations?.length||0,stopReason:graph.stopReason,persisted:Boolean(graph.persisted),independentSources:families.size}};
}

function mergeKnowledge(base:KnowledgeBundle,research:KnowledgeBundle,intent:QueryIntentResult):KnowledgeBundle{
  const sourceMap=new Map([...base.sources,...research.sources].map(s=>[s.id,s] as const));const claimMap=new Map<string,KnowledgeClaim>();
  for(const claim of [...research.claims,...base.claims]){const key=`${claim.predicate.toLowerCase()}|${claim.valueText.toLowerCase()}`;if(!claimMap.has(key))claimMap.set(key,claim);}
  const changes=[...research.changes,...base.changes].sort((a,b)=>b.changedAt.localeCompare(a.changedAt)).slice(0,12);
  return {...research,entityIds:base.entityIds,description:intent.freshness==="live"&&research.description?research.description:base.description||research.description,whyItMatters:research.whyItMatters||base.whyItMatters,claims:[...claimMap.values()],changes,sources:[...sourceMap.values()],watchItems:[...new Set([...research.watchItems,...base.watchItems])],knowledgeCutoff:[base.knowledgeCutoff,research.knowledgeCutoff].sort().at(-1)||research.knowledgeCutoff,researchNeeded:base.researchNeeded&&research.researchNeeded,missingEvidence:[...new Set([...base.missingEvidence,...research.missingEvidence])],mode:"research"};
}

export async function loadKnowledge(request:BriefRequest):Promise<KnowledgeBundle>{
  const intent=classifyQuery(request);const lookupRequest:BriefRequest={...request,subject:intent.entityQuery||request.subject};
  if(intent.intent==="evidence"&&request.context?.sourceHints?.length){
    const facts=request.context.factHints||[];
    return {subject:intent.entityQuery,entityIds:request.entityIds||request.context.entityHints||[],description:request.context.lastSummary||`Evidence attached to the previous Brief on ${intent.entityQuery}.`,whyItMatters:"This provenance comes directly from the previous Brief context; Briefs does not substitute a new narrative for the evidence you asked to inspect.",claims:facts.map(f=>({id:f.id,predicate:f.predicate,valueText:f.value,text:f.text,confidence:"medium",verificationStatus:"reported",lastVerifiedAt:request.context?.knowledgeCutoff||null,sourceIds:f.sourceIds})),changes:[],sources:request.context.sourceHints.map(s=>({id:s.id,name:s.name,url:s.url,tier:s.tier,kind:s.kind})),watchItems:[],knowledgeCutoff:request.context.knowledgeCutoff||new Date(0).toISOString(),researchNeeded:false,missingEvidence:[],mode:"research",dynamic:false};
  }
  if(intent.intent==="previous_state")return (await loadPreviousState(lookupRequest,intent))||{subject:intent.entityQuery,entityIds:[],description:`Briefs does not have a persistent database connected, so it cannot reconstruct what it previously believed about ${intent.entityQuery}.`,whyItMatters:"Prior-state answers come from recorded Briefs history, never model guesswork.",claims:[],changes:[],sources:[],watchItems:[],knowledgeCutoff:new Date(0).toISOString(),researchNeeded:false,missingEvidence:["Persistent knowledge history is unavailable"],mode:"empty",dynamic:false};
  if(intent.domain==="finance"){
    try{const finance=await researchFinance(lookupRequest,intent);if(finance)return finance;}catch(error){console.error("Briefs finance research fallback",error);}
  }
  let database:KnowledgeBundle|null=null;
  if(process.env.DATABASE_URL){try{database=await loadDatabaseKnowledge(lookupRequest,intent);if(database&&!database.researchNeeded&&request.depth!=="research"&&intent.freshness!=="live")return database;}catch(error){console.error("Briefs database knowledge fallback",error);}}
  const starter=loadStarterKnowledge(lookupRequest);
  if(!database&&starter.mode!=="empty"&&!starter.researchNeeded&&request.depth!=="deep"&&request.depth!=="research"&&intent.domain!=="current")return starter;
  const baseline=database||starter;
  const shouldResearch=intent.domain==="current"||baseline.mode==="empty"||baseline.researchNeeded||request.depth==="deep"||request.depth==="research"||intent.intent==="evidence";
  if(!shouldResearch)return baseline;
  try{const graph=await researchSubject({...lookupRequest,freshnessRequirement:intent.freshness==="live"?"recent":lookupRequest.freshnessRequirement});const researched=researchBundle(graph,lookupRequest);if(graph.sufficient)return baseline.mode==="empty"?researched:mergeKnowledge(baseline,researched,intent);}catch(error){console.error("Briefs research fallback",error);}
  return baseline;
}

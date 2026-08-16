import { db } from "@/lib/db";
import { resolveEntities } from "@/lib/engine/entity-resolution";
import type { BriefPlan, BriefRequest, BriefResult } from "@/lib/types";

function confidenceFromClaims(claims:any[]):"high"|"medium"|"low"{
  if(!claims.length) return "low";
  const strong=claims.filter(c=>c.confidence==='high'&&['confirmed','corroborated'].includes(c.verification_status)).length/claims.length;
  return strong>.7?'high':strong>.35?'medium':'low';
}

export async function planBrief(request:BriefRequest):Promise<BriefPlan>{
  const sql=db(); const resolved=request.entityIds?.length?request.entityIds:(await resolveEntities(request.subject)).map(x=>x.entityId);
  const claims=resolved.length?await sql`select id,entity_id,predicate,value_text,verification_status,confidence,last_verified_at from claims where entity_id=any(${resolved}::text[]) and valid_to is null and verification_status not in ('retracted') order by coalesce(last_verified_at,created_at) desc limit 100`:[];
  const from=request.timeRange?.from?new Date(request.timeRange.from):new Date(Date.now()-7*86400000);
  const changes=resolved.length?await sql`select id,entity_id,summary,changed_at from change_log where entity_id=any(${resolved}::text[]) and changed_at>=${from} order by changed_at desc limit 50`:[];
  const missingEvidence=claims.filter((c:any)=>!['confirmed','corroborated'].includes(c.verification_status)).map((c:any)=>`${c.predicate}:${c.id}`);
  return {subject:request.subject,resolvedEntityIds:resolved,requiredClaimIds:claims.map((c:any)=>c.id),recentChangeIds:changes.map((c:any)=>c.id),missingEvidence,researchNeeded:resolved.length===0||claims.length===0||missingEvidence.length>Math.max(3,claims.length*.35),depth:request.depth,perspective:request.perspective};
}

export async function composeBrief(request:BriefRequest):Promise<{plan:BriefPlan;result:BriefResult}>{
  const sql=db(); const plan=await planBrief(request);
  const claims=plan.requiredClaimIds.length?await sql`select * from claims where id=any(${plan.requiredClaimIds}::uuid[])`:[];
  const changes=plan.recentChangeIds.length?await sql`select * from change_log where id=any(${plan.recentChangeIds}::uuid[]) order by changed_at desc`:[];
  const entities=plan.resolvedEntityIds.length?await sql`select id,name,description from entities where id=any(${plan.resolvedEntityIds}::text[])`:[];
  const subject=entities[0]?.name||request.subject;
  const core=claims.slice(0,request.depth==='flash'?2:request.depth==='quick'?4:request.depth==='standard'?8:20);
  const summary=entities[0]?.description || (core.length?`${subject}: ${core.slice(0,3).map((c:any)=>`${c.predicate} is ${c.value_text}`).join('; ')}.`:`Briefs does not yet have enough verified knowledge to summarize ${subject}.`);
  const keyNumbers=claims.filter((c:any)=>/\d/.test(c.value_text)).slice(0,5).map((c:any)=>({label:c.predicate,value:c.value_text,claimId:c.id}));
  const result:BriefResult={subject,summary,keyChanges:changes.slice(0,7).map((c:any)=>({summary:c.summary,changedAt:new Date(c.changed_at).toISOString(),importance:70})),whyItMatters:changes.length?`There ${changes.length===1?'is':'are'} ${changes.length} recorded change${changes.length===1?'':'s'} in the selected period.`:'No material change is recorded for the selected period.',keyNumbers,watchItems:[],claimIds:claims.map((c:any)=>c.id),evidenceIds:[],confidence:confidenceFromClaims(claims),generatedAt:new Date().toISOString(),knowledgeCutoff:new Date().toISOString(),researchNeeded:plan.researchNeeded};
  return {plan,result};
}

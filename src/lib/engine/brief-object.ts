import { loadKnowledge } from "@/lib/knowledge/store";
import type { BriefPlan, BriefRequest, BriefResult } from "@/lib/types";

function confidenceFromClaims(claims:{confidence:string;verificationStatus:string}[]):"high"|"medium"|"low"{
  if(!claims.length) return "low";
  const strong=claims.filter(c=>c.confidence==="high"&&["confirmed","corroborated"].includes(c.verificationStatus)).length/claims.length;
  return strong>.7?"high":strong>.35?"medium":"low";
}

export async function composeBrief(request:BriefRequest):Promise<{plan:BriefPlan;result:BriefResult}>{
  const knowledge=await loadKnowledge(request);
  const plan:BriefPlan={subject:request.subject,resolvedEntityIds:knowledge.entityIds,requiredClaimIds:knowledge.claims.map(c=>c.id),recentChangeIds:knowledge.changes.map(c=>c.id),missingEvidence:knowledge.missingEvidence,researchNeeded:knowledge.researchNeeded,depth:request.depth,perspective:request.perspective};
  const keyNumbers=knowledge.claims.filter(c=>/\d/.test(c.valueText)).slice(0,6).map(c=>({label:c.predicate,value:c.valueText,claimId:c.id}));
  const keyFacts=knowledge.claims.slice(0,request.depth==="flash"?2:request.depth==="quick"?4:8).map(c=>({label:c.predicate,value:c.valueText,text:c.text,claimId:c.id}));
  const sourceIds=new Set<string>();
  for(const claim of knowledge.claims) for(const id of claim.sourceIds) sourceIds.add(id);
  const sources=knowledge.sources.filter(s=>sourceIds.size===0||sourceIds.has(s.id));
  const why=knowledge.whyItMatters || (knowledge.changes.length?`There ${knowledge.changes.length===1?"is":"are"} ${knowledge.changes.length} recorded change${knowledge.changes.length===1?"":"s"} in the selected period.`:"No material change is recorded for the selected period.");
  const result:BriefResult={subject:knowledge.subject,summary:knowledge.description,keyChanges:knowledge.changes.slice(0,7),whyItMatters:why,keyNumbers,keyFacts,watchItems:knowledge.watchItems,claimIds:knowledge.claims.map(c=>c.id),evidenceIds:sources.map(s=>s.id),sources,confidence:confidenceFromClaims(knowledge.claims),generatedAt:new Date().toISOString(),knowledgeCutoff:knowledge.knowledgeCutoff,researchNeeded:knowledge.researchNeeded,sourceMode:knowledge.mode};
  return {plan,result};
}

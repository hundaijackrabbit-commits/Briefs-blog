import { loadKnowledge } from "@/lib/knowledge/store";
import type { BriefPlan,BriefRequest,BriefResult } from "@/lib/types";
import { classifyQuery } from "@/lib/intelligence/query-intent";
import { persistQueryIntent } from "@/lib/intelligence/persistence";
import { contextualizeRequest,nextBriefContext } from "@/lib/intelligence/brief-context";

function confidenceFromClaims(claims:{confidence:string;verificationStatus:string}[]):"high"|"medium"|"low"{
  if(!claims.length)return "low";const strong=claims.filter(c=>c.confidence==="high"&&["confirmed","corroborated"].includes(c.verificationStatus)).length/claims.length;const usable=claims.filter(c=>["high","medium"].includes(c.confidence)&&!["unverified","retracted"].includes(c.verificationStatus)).length/claims.length;return strong>.7?"high":usable>.55?"medium":"low";
}
function contradictionSummary(claims:Array<{predicate:string;valueText:string;sourceIds:string[]}>){
  const generic=/^(overview|context \d+|recent reporting|external context|research evidence)$/i;const groups=new Map<string,typeof claims>();
  for(const claim of claims){if(generic.test(claim.predicate))continue;const key=claim.predicate.toLowerCase();groups.set(key,[...(groups.get(key)||[]),claim]);}
  const out:{predicate:string;values:string[];sourceIds:string[]}[]=[];
  for(const rows of groups.values()){const values=[...new Set(rows.map(r=>r.valueText.trim()).filter(Boolean))];if(values.length<2)continue;out.push({predicate:rows[0].predicate,values:values.slice(0,4),sourceIds:[...new Set(rows.flatMap(r=>r.sourceIds))]});}
  return out.slice(0,6);
}
function qualityScore(input:{claims:number;sourced:number;sources:number;cutoff:string;live:boolean;researchNeeded:boolean;contradictions:number;depth:BriefRequest["depth"]}){
  const target=input.depth==="flash"?2:input.depth==="quick"?4:input.depth==="standard"?6:10;
  const evidence=input.claims?Math.round((input.sourced/input.claims)*100):0;const coverage=Math.min(100,Math.round((input.claims/target)*100));
  const cutoffMs=Date.parse(input.cutoff);const age=Number.isFinite(cutoffMs)?Date.now()-cutoffMs:Number.POSITIVE_INFINITY;const freshness=input.live?(age<=6*3600000?100:age<=24*3600000?80:age<=7*86400000?55:25):(age<=90*86400000?100:80);
  const warnings:string[]=[];if(evidence<60)warnings.push("limited claim-level evidence");if(input.live&&freshness<70)warnings.push("time-sensitive evidence may be stale");if(input.sources<2)warnings.push("limited source diversity");if(input.contradictions)warnings.push("conflicting structured claims detected");if(input.researchNeeded)warnings.push("evidence gaps remain");
  const score=Math.max(0,Math.min(100,Math.round(evidence*.35+freshness*.3+coverage*.2+Math.min(100,input.sources*25)*.15-input.contradictions*8)));
  return {score,evidence,freshness,coverage,warnings};
}

export async function composeBrief(request:BriefRequest):Promise<{plan:BriefPlan;result:BriefResult}>{
  const contextual=contextualizeRequest(request);const intent=classifyQuery(contextual);void persistQueryIntent(intent,contextual);
  const knowledge=await loadKnowledge({...contextual,perspective:intent.effectivePerspective});
  const plan:BriefPlan={subject:request.subject,resolvedEntityIds:knowledge.entityIds,requiredClaimIds:knowledge.claims.map(c=>c.id),recentChangeIds:knowledge.changes.map(c=>c.id),missingEvidence:knowledge.missingEvidence,researchNeeded:knowledge.researchNeeded,depth:request.depth,perspective:intent.effectivePerspective};
  const keyNumbers=knowledge.claims.filter(c=>/\d/.test(c.valueText)).slice(0,6).map(c=>({label:c.predicate,value:c.valueText,claimId:c.id}));
  const factLimit=request.depth==="flash"?2:request.depth==="quick"?4:request.depth==="standard"?8:14;
  const keyFacts=knowledge.claims.slice(0,factLimit).map(c=>({label:c.predicate,value:c.valueText,text:c.text,claimId:c.id,sourceIds:c.sourceIds}));
  const sourceIds=new Set<string>();for(const claim of knowledge.claims)for(const id of claim.sourceIds)sourceIds.add(id);const sources=knowledge.sources.filter(s=>sourceIds.size===0||sourceIds.has(s.id));
  const contradictions=contradictionSummary(knowledge.claims);const sourced=knowledge.claims.filter(c=>c.sourceIds.length).length;
  let summary=knowledge.description;let why=knowledge.whyItMatters||(knowledge.changes.length?`There ${knowledge.changes.length===1?"is":"are"} ${knowledge.changes.length} recorded change${knowledge.changes.length===1?"":"s"} in the selected period.`:(request.timeRange||request.freshnessRequirement==="recent"?"No material change is recorded for the selected period.":""));
  if(intent.intent==="evidence"){
    summary=sources.length?`Briefs currently supports ${knowledge.subject} with ${sources.length} eligible source${sources.length===1?"":"s"} tied to ${sourced} of ${knowledge.claims.length} retrieved claim${knowledge.claims.length===1?"":"s"}. Expand Key facts to inspect claim-level evidence, or open the Evidence section for the source set.`:`Briefs does not currently have inspectable source evidence for ${knowledge.subject}. It will not manufacture citations.`;
    why="This answer reports the provenance already attached to the Brief instead of generating a new narrative and presenting it as evidence.";
  }
  if(contradictions.length){why=`${why?why+" ":""}Briefs detected ${contradictions.length} structured disagreement${contradictions.length===1?"":"s"}; conflicting values remain visible instead of being silently averaged away.`;}
  let confidence=confidenceFromClaims(knowledge.claims);if(knowledge.researchNeeded&&confidence==="high")confidence="medium";if(contradictions.length&&confidence==="high")confidence="medium";
  const quality=qualityScore({claims:knowledge.claims.length,sourced,sources:sources.length,cutoff:knowledge.knowledgeCutoff,live:intent.freshness==="live",researchNeeded:knowledge.researchNeeded,contradictions:contradictions.length,depth:request.depth});
  const result:BriefResult={subject:knowledge.subject,summary,keyChanges:knowledge.changes.slice(0,7),whyItMatters:why,keyNumbers,keyFacts,watchItems:knowledge.watchItems,claimIds:knowledge.claims.map(c=>c.id),evidenceIds:sources.map(s=>s.id),sources,confidence,generatedAt:new Date().toISOString(),knowledgeCutoff:knowledge.knowledgeCutoff,researchNeeded:knowledge.researchNeeded,sourceMode:knowledge.mode,intent:intent.intent,lens:intent.effectivePerspective,freshnessStatus:intent.freshness,comparison:knowledge.comparison,quality,research:knowledge.researchMeta,contradictions};
  result.context=nextBriefContext(request,result);return {plan,result};
}

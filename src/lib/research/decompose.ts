import type { BriefRequest } from "@/lib/types";
import type { ResearchIntent, ResearchQueryPlan } from "@/lib/research/types";

function splitComparison(subject:string){
  const vs=subject.split(/\s+(?:vs\.?|versus)\s+/i).map(x=>x.trim()).filter(Boolean);
  if(vs.length===2) return vs;
  const compare=subject.match(/^compare\s+(.+?)\s+(?:and|with)\s+(.+)$/i);
  return compare?[compare[1].trim(),compare[2].trim()]:[subject.trim()];
}

function inferIntent(subject:string,parts:string[]):ResearchIntent{
  if(parts.length===2) return "compare";
  if(/\b(today|latest|current|now|this week|recent)\b/i.test(subject)) return "current";
  if(/\b(history|historical|origin|timeline|war|ancient|century)\b/i.test(subject)) return "history";
  if(/\b(company|organization|organisation|foundation|agency|university)\b/i.test(subject)) return "organization";
  if(/\b(movie|film|book|album|series|show|game|novel)\b/i.test(subject)) return "work";
  if(/^who (?:is|was)\b/i.test(subject)) return "person";
  if(/^what (?:is|was|are|were)\b/i.test(subject)) return "explain";
  return "general";
}

export function decomposeResearchRequest(request:BriefRequest):ResearchQueryPlan{
  const normalized=request.subject.replace(/\s+/g," ").trim().slice(0,200);
  const subjects=splitComparison(normalized).slice(0,2);
  const intent=inferIntent(normalized,subjects);
  const freshness=request.freshnessRequirement==="historical"||intent==="history"?"historical":request.freshnessRequirement==="recent"||intent==="current"?"live":"current";
  const maxSources=request.depth==="research"?10:request.depth==="deep"?8:6;
  return {original:request.subject,normalized,intent,subjects,freshness,maxSources};
}

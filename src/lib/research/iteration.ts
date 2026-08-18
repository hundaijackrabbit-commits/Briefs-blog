import type { BriefRequest } from "@/lib/types";
import type { ResearchFinding, ResearchSource } from "@/lib/research/types";
import { sourceDiversity } from "@/lib/research/rank";

export type ResearchGap={kind:"coverage"|"independence"|"freshness"|"primary";query:string;reason:string};

export function evaluateResearchGaps(request:BriefRequest,sources:ResearchSource[],findings:ResearchFinding[]):ResearchGap[]{
  const gaps:ResearchGap[]=[];
  const subject=request.subject.replace(/\s+/g," ").trim();
  if(findings.length<4) gaps.push({kind:"coverage",query:subject,reason:"Too few evidence-backed findings for a robust Brief"});
  if(sourceDiversity(sources)<2) gaps.push({kind:"independence",query:subject,reason:"Independent corroboration is limited"});
  if((request.freshnessRequirement==="recent"||/\b(today|latest|current|now|this week|news)\b/i.test(subject))&&!sources.some(s=>s.kind==="reporting"||s.kind==="primary")) gaps.push({kind:"freshness",query:subject,reason:"Time-sensitive request lacks current reporting or primary evidence"});
  if(request.sourcePolicy==="primary-only"&&!sources.some(s=>s.kind==="primary")) gaps.push({kind:"primary",query:subject,reason:"Primary-only policy has no eligible primary evidence"});
  return gaps;
}

export function shouldIterate(request:BriefRequest,gaps:ResearchGap[]){
  return gaps.length>0&&(request.depth==="deep"||request.depth==="research"||request.freshnessRequirement==="recent");
}

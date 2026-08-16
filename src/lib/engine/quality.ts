import { db } from "@/lib/db";
export interface QualityInput {evidence:number;freshness:number;clarity:number;coverage:number;originality:number;unsupportedClaims?:number;conflicts?:number;}
export function evaluateQuality(input:QualityInput){
  const blockers:string[]=[],warnings:string[]=[];
  if((input.unsupportedClaims??0)>0) blockers.push("unsupported-claims");
  if((input.conflicts??0)>0) blockers.push("unresolved-conflicts");
  if(input.evidence<50) warnings.push("weak-evidence");
  if(input.freshness<60) warnings.push("stale-information");
  const overall=Math.round(input.evidence*.3+input.freshness*.25+input.clarity*.15+input.coverage*.15+input.originality*.15);
  return {overall,blockers,warnings,publishable:blockers.length===0&&overall>=70};
}
export async function persistQuality(target:{briefId?:string;resultId?:string},input:QualityInput){
  const sql=db();const q=evaluateQuality(input);
  await sql`insert into quality_evaluations(brief_id,result_id,evidence_score,freshness_score,clarity_score,coverage_score,originality_score,overall_score,blockers,warnings) values(${target.briefId??null}::uuid,${target.resultId??null}::uuid,${input.evidence},${input.freshness},${input.clarity},${input.coverage},${input.originality},${q.overall},${q.blockers},${q.warnings})`;
  return q;
}

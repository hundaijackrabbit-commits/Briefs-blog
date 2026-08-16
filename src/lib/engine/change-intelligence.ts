import { db } from "@/lib/db";
import { detectClaimConflict } from "@/lib/engine/contradictions";

function normalize(v:string){return v.toLowerCase().replace(/\s+/g,' ').trim();}
export function changeSignificance(predicate:string,before:string|null,after:string){
  if(before===null) return 55;
  if(normalize(before)===normalize(after)) return 0;
  const p=predicate.toLowerCase();
  if(/ceo|president|status|availability|acquired|owner/.test(p)) return 90;
  if(/revenue|price|users|market|funding|headcount|rate/.test(p)) return 78;
  return 60;
}

export async function detectMeaningfulChange(input:{runId?:string;entityId:string;predicate:string;proposedValue:string;normalizedValue?:unknown;documentIds?:string[]}){
  const sql=db(); const conflict=await detectClaimConflict(input.entityId,input.predicate,input.proposedValue);
  const current=conflict.existing[0]??null;
  const significance=changeSignificance(input.predicate,current?.value_text??null,input.proposedValue);
  if(significance===0) return {changed:false,significance,previous:current};
  const rows=await sql`insert into change_candidates(run_id,entity_id,predicate,previous_claim_id,proposed_value,proposed_normalized_value,significance,evidence_document_ids) values(${input.runId??null}::uuid,${input.entityId},${input.predicate},${current?.id??null}::uuid,${input.proposedValue},${input.normalizedValue===undefined?null:sql.json(input.normalizedValue as any)},${significance},${input.documentIds??[]}::uuid[]) returning id`;
  return {changed:true,significance,previous:current,changeCandidateId:rows[0]?.id,conflict:conflict.conflict};
}

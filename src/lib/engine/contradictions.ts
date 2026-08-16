import { db } from "@/lib/db";
export async function detectClaimConflict(entityId:string,predicate:string,valueText:string){
  const sql=db(); const active=await sql`select id,value_text,verification_status,confidence from claims where entity_id=${entityId} and predicate=${predicate} and valid_to is null and verification_status not in ('retracted') order by created_at desc limit 5`;
  const conflicts=active.filter((c:any)=>c.value_text.trim().toLowerCase()!==valueText.trim().toLowerCase());
  return {conflict:conflicts.length>0,existing:active,conflicts};
}

import { db } from "@/lib/db";

export async function recordClaimVersion(claimId:string){
  const sql=db(); const [c]=await sql`select * from claims where id=${claimId}::uuid`; if(!c) throw new Error("Claim not found");
  const [v]=await sql`select coalesce(max(version_no),0)+1 as n from claim_versions where claim_id=${claimId}::uuid`;
  const evidence=await sql`select id from claim_evidence where claim_id=${claimId}::uuid`;
  await sql`insert into claim_versions(claim_id,version_no,value_text,normalized_value,verification_status,confidence,valid_from,valid_to,evidence_ids) values(${claimId}::uuid,${v.n},${c.value_text},${c.normalized_value},${c.verification_status},${c.confidence},${c.valid_from},${c.valid_to},${evidence.map((x:any)=>x.id)}::uuid[]) on conflict(claim_id,version_no) do nothing`;
  return v.n as number;
}

export async function supersedeClaim(previousClaimId:string,newClaimId:string,effectiveAt=new Date()){
  const sql=db();
  await recordClaimVersion(previousClaimId);
  await sql.begin(async (tx:any)=>{
    await tx`update claims set valid_to=${effectiveAt} where id=${previousClaimId}::uuid and valid_to is null`;
    await tx`update claims set supersedes_claim_id=${previousClaimId}::uuid,valid_from=coalesce(valid_from,${effectiveAt}) where id=${newClaimId}::uuid`;
  });
}

export async function claimsAsOf(entityId:string,asOf:Date){
  const sql=db();
  return await sql`select * from claims where entity_id=${entityId} and coalesce(valid_from,created_at)<=${asOf} and (valid_to is null or valid_to>${asOf}) and verification_status not in ('retracted') order by predicate,coalesce(last_verified_at,created_at) desc`;
}

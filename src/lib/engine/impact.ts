import { db } from "@/lib/db";
export async function impactedBriefs(entityId:string,claimId?:string){
  const sql=db();
  const direct=claimId?await sql`select distinct b.id,b.slug,b.title,b.risk_class from briefs b join brief_claims bc on bc.brief_id=b.id where bc.claim_id=${claimId}::uuid`:[];
  const entityClaims=await sql`select id from claims where entity_id=${entityId}`; const ids=entityClaims.map((x:any)=>x.id);
  const via=ids.length?await sql`select distinct b.id,b.slug,b.title,b.risk_class from briefs b join brief_claims bc on bc.brief_id=b.id where bc.claim_id=any(${ids}::uuid[])`:[];
  const map=new Map([...direct,...via].map((b:any)=>[b.id,b])); return [...map.values()];
}

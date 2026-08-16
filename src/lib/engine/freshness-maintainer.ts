import { db } from "@/lib/db";

const limits:{[k:string]:number}={live:1,current:14,slow:90,static:365};
export async function recalculateBriefFreshness(briefId:string){
  const sql=db();
  const claims=await sql`select c.freshness_class,c.last_verified_at,c.verification_status from claims c join brief_claims bc on bc.claim_id=c.id where bc.brief_id=${briefId}::uuid and c.valid_to is null`;
  if(!claims.length){await sql`update briefs set freshness_score=60,updated_at=now() where id=${briefId}::uuid`;return 60;}
  const now=Date.now();
  const scores=claims.map((c:any)=>{
    const max=limits[c.freshness_class]??30;
    const age=c.last_verified_at?(now-new Date(c.last_verified_at).getTime())/86400000:max*2;
    const time=Math.max(0,100-(age/max)*50);
    const verified=['confirmed','corroborated'].includes(c.verification_status)?100:['reported','estimated'].includes(c.verification_status)?70:35;
    return time*.65+verified*.35;
  });
  const score=Math.max(0,Math.min(100,Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length)));
  await sql`update briefs set freshness_score=${score},last_verified_at=case when ${score}>=80 then now() else last_verified_at end,updated_at=now() where id=${briefId}::uuid`;
  return score;
}

import { db } from "@/lib/db";
import { researchSubject } from "@/lib/research/research-engine";

export async function refreshTrackedSubjects(maxSubjects=6){
  if(!process.env.DATABASE_URL)return {status:"database-not-configured",subjects:0,refreshed:0};
  const sql=db();
  const rows=await sql`
    select subject,max(weight)::int weight from (
      select i.subject,100 weight from brief_pack_items i
      union all
      select subject,70 weight from query_intent_observations where created_at>now()-interval '7 days' and freshness='live'
      union all
      select title subject,50 weight from briefs where status='published' and freshness_score<80
    ) q group by subject order by weight desc limit ${maxSubjects}`;
  const subjects:string[]=rows.map((r:any)=>String(r.subject)).filter((subject:string)=>Boolean(subject));let refreshed=0;
  const results=await Promise.allSettled(subjects.map(subject=>researchSubject({subject,depth:"quick",perspective:"general",sourcePolicy:"verified",freshnessRequirement:"recent",format:"api"})));
  for(const result of results)if(result.status==="fulfilled")refreshed++;
  return {status:refreshed===subjects.length?"completed":"partial",subjects:subjects.length,refreshed};
}

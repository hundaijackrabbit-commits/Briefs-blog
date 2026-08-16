import { db } from "@/lib/db";
import { reconcileEditorialRun } from "@/lib/engine/editorial-intelligence";
import { approveRevision,publishRevision } from "@/lib/engine/publisher";

export async function runEditorialCycle(runId:string){
  const sql=db();
  const reconciled=await reconcileEditorialRun(runId);
  const auto=await sql`select id from editorial_revisions where status='proposed' and review_mode='auto' and (quality_blockers is null or cardinality(quality_blockers)=0) order by created_at limit 50`;
  let published=0,held=0;
  for(const row of auto){
    try{const a=await approveRevision(String(row.id),'briefs-auto');if(a.approved){const p=await publishRevision(String(row.id),'briefs-auto');if(p.published)published++;}else held++;}
    catch{held++;}
  }
  return {...reconciled,autoCandidates:auto.length,published,held};
}

import { claim, complete, fail, heartbeat, enqueue } from "@/lib/engine/queue";
import { clusterRecentSource } from "@/lib/engine/events";
import { understandEvent } from "@/lib/engine/understanding";
import { snapshotEntity } from "@/lib/engine/historical";
import { runEditorialCycle } from "@/lib/engine/v4";
import { approveRevision,publishRevision } from "@/lib/engine/publisher";
import { db } from "@/lib/db";

export async function processOne(workerId:string){
  const job=await claim(workerId); if(!job)return {status:'idle'};
  const timer=setInterval(()=>heartbeat(job.id).catch(()=>{}),30000);
  try{
    let result:unknown={skipped:true};
    if(job.job_type==='cluster'){
      result=await clusterRecentSource(job.payload.sourceId);
      const sql=db(); const events=await sql`select e.id from events e join source_documents d on d.id=any(e.document_ids) where d.source_id=${job.payload.sourceId} and e.updated_at>now()-interval '2 days' order by e.updated_at desc limit 100`;
      for(const e of events) await enqueue(job.run_id,'understand',{eventId:e.id},['understand',e.id]);
    } else if(job.job_type==='understand'){
      result=await understandEvent(job.payload.eventId);
      const data=result as any;
      for(const entity of data.resolvedEntities||[]) await enqueue(job.run_id,'snapshot',{entityId:entity.entityId},['snapshot',entity.entityId]);
    } else if(job.job_type==='snapshot') result=await snapshotEntity(job.payload.entityId,job.run_id);
    else if(job.job_type==='reconcile') result=await runEditorialCycle(String(job.run_id));
    else if(job.job_type==='review' && job.payload.revisionId) result=await approveRevision(String(job.payload.revisionId),'queue-worker');
    else if(job.job_type==='publish' && job.payload.revisionId) result=await publishRevision(String(job.payload.revisionId),'queue-worker');
    // Claim extraction remains adapter-driven. Domain extractors can enqueue verify/compare/impact
    // without bypassing evidence, review policy, or publication transactions.
    await complete(job.id); return {status:'completed',jobId:job.id,type:job.job_type,result};
  }catch(e){await fail(job.id,e);return {status:'failed',jobId:job.id,error:e instanceof Error?e.message:String(e)};}
  finally{clearInterval(timer);}
}

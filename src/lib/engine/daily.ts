import { db } from "@/lib/db";
import { collectSource, dueSources, persistDocuments } from "@/lib/engine/source";
import { enqueue, recoverStale } from "@/lib/engine/queue";
import { processOne } from "@/lib/engine/worker";
import { runPersonalDigest } from "@/lib/personal/digest";
import { deliverPendingDigestEmails } from "@/lib/distribution/email-delivery";
import { refreshTrackedSubjects } from "@/lib/intelligence/monitor";
import { computeSignals } from "@/lib/intelligence/signals";
import { runPublicationWorker, schedulePublicationMaintenance } from "@/lib/publication/scheduler";

export async function runDailyEngine(){
  const sql=db();
  const lock=(await sql`select pg_try_advisory_lock(hashtext('briefs:daily-intelligence')) as ok`)[0]?.ok;
  if(!lock) return {status:"already-running"};
  let runId:string|undefined;
  try{
    await recoverStale();
    const run=(await sql`insert into intelligence_runs(run_type,status) values('daily','running') returning id`)[0];
    runId=String(run.id); const activeRunId=runId;
    const sources=await dueSources();
    let failed=0,docs=0;
    for(const source of sources){
      try{
        const collected=await collectSource(source); const inserted=await persistDocuments(collected); docs+=inserted;
        await enqueue(activeRunId,"cluster",{sourceId:source.id},["cluster",source.id]);
      }catch{failed++;}
    }
    await enqueue(activeRunId,'reconcile',{scope:'editorial'},['reconcile','editorial']);
    const workerId=`daily-${runId}`; let jobsProcessed=0;
    for(let i=0;i<25;i++){const r=await processOne(workerId);if(r.status==='idle')break;jobsProcessed++;}
    const monitoring=await refreshTrackedSubjects().catch(()=>({status:"failed",subjects:0,refreshed:0}));
    const signals=await computeSignals().catch(()=>[]);
    const publicationSchedule=await schedulePublicationMaintenance().catch(error=>({
      status:"failed",error:error instanceof Error?error.message:String(error)
    }));
    const publication=await runPublicationWorker(2).catch(error=>({
      status:"failed",processed:0,failed:1,error:error instanceof Error?error.message:String(error)
    }));
    const personal=await runPersonalDigest().catch(()=>({status:"failed",accounts:0,notifications:0}));
    const email=await deliverPendingDigestEmails().catch(()=>({status:"failed",accounts:0,delivered:0,failed:1}));
    await sql`update intelligence_runs set sources_attempted=${sources.length},sources_failed=${failed},documents_collected=${docs},status=${failed===sources.length&&sources.length>0?'partial':'completed'},completed_at=now() where id=${runId}::uuid`;
    return {status:failed?"partial":"completed",runId,sources:sources.length,failed,documents:docs,jobsProcessed,monitoring,signals:signals.slice(0,10),publicationSchedule,publication,personal,email};
  }catch(e){
    if(runId) await sql`update intelligence_runs set status='failed',completed_at=now(),error_summary=${e instanceof Error?e.message:String(e)} where id=${runId}::uuid`;
    throw e;
  }finally{await sql`select pg_advisory_unlock(hashtext('briefs:daily-intelligence'))`;}
}

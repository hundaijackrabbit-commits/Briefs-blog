import { claim, complete, fail, heartbeat } from "@/lib/engine/queue";
import { clusterRecentSource } from "@/lib/engine/events";
export async function processOne(workerId:string){
  const job=await claim(workerId); if(!job)return {status:'idle'};
  const timer=setInterval(()=>heartbeat(job.id).catch(()=>{}),30000);
  try{
    let result:unknown={skipped:true};
    if(job.job_type==='cluster') result=await clusterRecentSource(job.payload.sourceId);
    // extract/verify/compare/impact/review/publish jobs intentionally pass through until source-specific claim extractors are registered.
    await complete(job.id); return {status:'completed',jobId:job.id,type:job.job_type,result};
  }catch(e){await fail(job.id,e);return {status:'failed',jobId:job.id,error:e instanceof Error?e.message:String(e)};}
  finally{clearInterval(timer);}
}

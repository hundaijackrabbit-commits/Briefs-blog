import { db } from "@/lib/db";
import type { JobType } from "@/lib/types";
import { stableKey } from "@/lib/reliability";
export async function enqueue(runId:string,type:JobType,payload:Record<string,unknown>,keyParts:(string|number)[],maxAttempts=3){
  const sql=db(); const key=stableKey(runId,type,...keyParts);
  await sql`insert into jobs(run_id,job_type,idempotency_key,payload,max_attempts) values(${runId}::uuid,${type},${key},${sql.json(JSON.parse(JSON.stringify(payload)))},${maxAttempts}) on conflict(idempotency_key) do nothing`;
}
export async function claim(worker:string,type?:JobType){
  const sql=db(); const rows=await sql`select * from briefs_claim_job(${worker},${type??null})`; return rows[0]??null;
}
export async function heartbeat(id:string){const sql=db();await sql`update jobs set heartbeat_at=now(),lease_expires_at=now()+interval '2 minutes',updated_at=now() where id=${id}::uuid and status='running'`;}
export async function complete(id:string){const sql=db();await sql`update jobs set status='completed',completed_at=now(),lease_expires_at=null,updated_at=now() where id=${id}::uuid`;}
export async function fail(id:string,error:unknown){
  const sql=db(); const msg=error instanceof Error?error.message:String(error);
  await sql`update jobs set status=case when attempts>=max_attempts then 'dead' else 'retrying' end,available_at=case when attempts>=max_attempts then available_at else now()+(least(300,power(2,attempts)::int*5)||' seconds')::interval end,last_error=${msg},lease_expires_at=null,updated_at=now() where id=${id}::uuid`;
}
export async function recoverStale(){const sql=db();const rows=await sql`update jobs set status=case when attempts>=max_attempts then 'dead' else 'retrying' end,available_at=now(),locked_by=null,lease_expires_at=null,last_error=coalesce(last_error,'')||' | recovered stale lease',updated_at=now() where status='running' and lease_expires_at<now() returning id`;return rows.length;}

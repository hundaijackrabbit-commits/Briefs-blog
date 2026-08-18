import { db } from "@/lib/db";

type Status="ok"|"degraded"|"error";
type Metric={name:string;status:Status;durationMs?:number;metadata?:Record<string,unknown>;at:string};
const memory:Metric[]=[];

export async function recordMetric(name:string,status:Status,durationMs?:number,metadata:Record<string,unknown>={}){
  const metric:Metric={name,status,durationMs,metadata,at:new Date().toISOString()};
  memory.push(metric);if(memory.length>250)memory.splice(0,memory.length-250);
  if(!process.env.DATABASE_URL) return;
  try{
    const sql=db();
    await sql`insert into system_observations(metric,status,duration_ms,metadata) values(${name},${status},${durationMs??null},${sql.json(JSON.parse(JSON.stringify(metadata)))})`;
  }catch{}
}

export function recentMemoryMetrics(){return [...memory].reverse().slice(0,50);}

export async function operationalSnapshot(){
  const snapshot:{database:string;queue?:Record<string,number>;research?:Record<string,number>;sources?:Record<string,number>;recent:Metric[]}={database:process.env.DATABASE_URL?"configured":"not-configured",recent:recentMemoryMetrics()};
  if(!process.env.DATABASE_URL) return snapshot;
  try{
    const sql=db();
    const jobs=await sql`select status,count(*)::int n from jobs group by status`;
    snapshot.queue=Object.fromEntries(jobs.map((r:any)=>[String(r.status),Number(r.n)]));
    const research=await sql`select status,count(*)::int n from research_runs where started_at>now()-interval '24 hours' group by status`;
    snapshot.research=Object.fromEntries(research.map((r:any)=>[String(r.status),Number(r.n)]));
    const [sources]=await sql`select count(*) filter(where is_active)::int active,count(*) filter(where consecutive_failures>0)::int failing,count(*) filter(where circuit_open_until>now())::int circuit_open from sources`;
    snapshot.sources={active:Number(sources?.active||0),failing:Number(sources?.failing||0),circuitOpen:Number(sources?.circuit_open||0)};
  }catch{snapshot.database="unavailable";}
  return snapshot;
}

export async function recordProviderHealth(provider:string,ok:boolean,latencyMs:number,error?:unknown){
  void recordMetric(`provider.${provider}`,ok?"ok":"error",latencyMs,error?{error:error instanceof Error?error.message:String(error)}:{});
  if(!process.env.DATABASE_URL)return;
  try{
    const sql=db();
    if(ok) await sql`insert into provider_health(provider,status,consecutive_failures,last_latency_ms,last_success_at,last_error) values(${provider},'healthy',0,${latencyMs},now(),null) on conflict(provider) do update set status='healthy',consecutive_failures=0,last_latency_ms=excluded.last_latency_ms,last_success_at=now(),last_error=null,updated_at=now()`;
    else await sql`insert into provider_health(provider,status,consecutive_failures,last_latency_ms,last_failure_at,last_error) values(${provider},'degraded',1,${latencyMs},now(),${error instanceof Error?error.message:String(error||"provider failure")}) on conflict(provider) do update set status=case when provider_health.consecutive_failures+1>=3 then 'down' else 'degraded' end,consecutive_failures=provider_health.consecutive_failures+1,last_latency_ms=excluded.last_latency_ms,last_failure_at=now(),last_error=excluded.last_error,updated_at=now()`;
  }catch{}
}

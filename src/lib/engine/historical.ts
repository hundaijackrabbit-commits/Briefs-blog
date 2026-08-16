import { db } from "@/lib/db";
import { claimsAsOf } from "@/lib/engine/temporal";
import { neighborhood } from "@/lib/engine/knowledge-graph";

export async function snapshotEntity(entityId:string,runId?:string,at=new Date()){
  const sql=db(); const claims=await claimsAsOf(entityId,at); const graph=await neighborhood(entityId,1);
  const state={claims:claims.map((c:any)=>({id:c.id,predicate:c.predicate,value:c.value_text,verification:c.verification_status,confidence:c.confidence,validFrom:c.valid_from,validTo:c.valid_to})),relations:graph.edges.map((e:any)=>({from:e.from_entity_id,relation:e.relation_type,to:e.to_entity_id,confidence:e.confidence}))};
  const bucket=new Date(at); bucket.setUTCMinutes(0,0,0);
  await sql`insert into knowledge_snapshots(entity_id,snapshot_at,state,source_run_id) values(${entityId},${bucket},${sql.json(state)},${runId??null}::uuid) on conflict(entity_id,snapshot_at) do update set state=excluded.state,source_run_id=excluded.source_run_id`;
  return state;
}

export async function snapshotBefore(entityId:string,asOf:Date){const sql=db();const rows=await sql`select * from knowledge_snapshots where entity_id=${entityId} and snapshot_at<=${asOf} order by snapshot_at desc limit 1`;return rows[0]??null;}

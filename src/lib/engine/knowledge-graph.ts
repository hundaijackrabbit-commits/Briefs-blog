import { db } from "@/lib/db";

export interface GraphEdge {from:string;relation:string;to:string;confidence:"high"|"medium"|"low";validFrom?:Date|null;validTo?:Date|null;}

export async function upsertRelation(edge:GraphEdge){
  if(edge.from===edge.to) return null;
  const sql=db();
  const existing=await sql`select id from entity_relations where from_entity_id=${edge.from} and relation_type=${edge.relation} and to_entity_id=${edge.to} and valid_to is null limit 1`;
  if(existing[0]) return existing[0].id;
  const rows=await sql`insert into entity_relations(from_entity_id,relation_type,to_entity_id,confidence,valid_from,valid_to) values(${edge.from},${edge.relation},${edge.to},${edge.confidence},${edge.validFrom??null},${edge.validTo??null}) returning id`;
  return rows[0]?.id??null;
}

export async function neighborhood(entityId:string,depth=1){
  const sql=db(); const seen=new Set([entityId]); let frontier=[entityId]; const edges:any[]=[];
  for(let i=0;i<Math.max(1,Math.min(depth,3));i++){
    if(!frontier.length) break;
    const rows=await sql`select * from entity_relations where from_entity_id=any(${frontier}::text[]) or to_entity_id=any(${frontier}::text[])`;
    const next:string[]=[];
    for(const e of rows){edges.push(e);for(const id of [e.from_entity_id,e.to_entity_id])if(!seen.has(id)){seen.add(id);next.push(id);}}
    frontier=next;
  }
  return {entityIds:[...seen],edges};
}

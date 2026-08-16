import { db } from "@/lib/db";
import type { ResolvedEntity } from "@/lib/types";

function norm(v:string){return v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim();}
function containsPhrase(text:string,phrase:string){const t=` ${norm(text)} `,p=` ${norm(phrase)} `;return p.trim().length>1&&t.includes(p);}

export async function resolveEntities(text:string,identifiers:{namespace:string;identifier:string}[]=[]):Promise<ResolvedEntity[]>{
  const sql=db();
  const rows=await sql`select id,name,entity_type,aliases from entities`;
  const byId=new Map<string,ResolvedEntity>();
  if(identifiers.length){
    for(const item of identifiers){
      const found=await sql`select e.id,e.name,e.entity_type from entity_identifiers i join entities e on e.id=i.entity_id where lower(i.namespace)=lower(${item.namespace}) and lower(i.identifier)=lower(${item.identifier}) limit 1`;
      if(found[0]) byId.set(found[0].id,{entityId:found[0].id,name:found[0].name,entityType:found[0].entity_type,confidence:1,matchedBy:"identifier"});
    }
  }
  for(const row of rows){
    if(byId.has(row.id)) continue;
    if(containsPhrase(text,row.name)) byId.set(row.id,{entityId:row.id,name:row.name,entityType:row.entity_type,confidence:0.98,matchedBy:"exact"});
    else if((row.aliases||[]).some((a:string)=>containsPhrase(text,a))) byId.set(row.id,{entityId:row.id,name:row.name,entityType:row.entity_type,confidence:0.91,matchedBy:"alias"});
  }
  return [...byId.values()].sort((a,b)=>b.confidence-a.confidence);
}

export async function attachResolvedEntities(eventId:string,text:string){
  const sql=db(); const resolved=await resolveEntities(text);
  for(const r of resolved){
    await sql`insert into event_entities(event_id,entity_id,role,confidence) values(${eventId}::uuid,${r.entityId},'mentioned',${r.confidence}) on conflict(event_id,entity_id,role) do update set confidence=greatest(event_entities.confidence,excluded.confidence)`;
  }
  await sql`update events set entity_ids=${resolved.map(r=>r.entityId)},updated_at=now() where id=${eventId}::uuid`;
  return resolved;
}

import { db } from "@/lib/db";
export async function matchEntities(text:string){
  const sql=db(); const entities=await sql`select id,name,aliases from entities`;
  const hay=` ${text.toLowerCase()} `; const found:string[]=[];
  for(const e of entities){const names=[e.name,...(e.aliases||[])].map((x:string)=>x.toLowerCase()).filter(Boolean);if(names.some((n:string)=>hay.includes(n)))found.push(e.id);}
  return found;
}
export async function enrichEventEntities(eventId:string){
  const sql=db(); const [ev]=await sql`select * from events where id=${eventId}::uuid`; if(!ev)return [];
  const entities=await matchEntities(`${ev.title} ${ev.summary||''}`);
  await sql`update events set entity_ids=${entities},updated_at=now() where id=${eventId}::uuid`; return entities;
}

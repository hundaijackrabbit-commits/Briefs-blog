import { db } from "@/lib/db";
import { semanticFrame } from "@/lib/engine/semantic";
import { attachResolvedEntities } from "@/lib/engine/entity-resolution";

export async function understandEvent(eventId:string){
  const sql=db(); const [event]=await sql`select * from events where id=${eventId}::uuid`; if(!event) throw new Error("Event not found");
  const docs=event.document_ids?.length?await sql`select id,title,excerpt,body from source_documents where id=any(${event.document_ids}::uuid[])`:[];
  const text=[event.title,event.summary,...docs.map((d:any)=>`${d.title} ${d.excerpt||''} ${d.body||''}`)].join("\n").slice(0,50000);
  const frame=semanticFrame(text);
  for(const d of docs) await sql`insert into semantic_annotations(document_id,frame,extractor_version) values(${d.id}::uuid,${sql.json(JSON.parse(JSON.stringify(frame)))},'rules-v3.1') on conflict(document_id,extractor_version) do nothing`;
  const entities=await attachResolvedEntities(eventId,text);
  await sql`update events set topic_tags=${frame.concepts},confidence=case when ${entities.length}>0 then confidence else 'low' end,updated_at=now() where id=${eventId}::uuid`;
  return {eventId,frame,resolvedEntities:entities};
}

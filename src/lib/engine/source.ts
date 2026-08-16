import { db } from "@/lib/db";
import { ingestRss } from "@/lib/adapters/rss";
import type { NormalizedDocument, SourceRecord } from "@/lib/types";

export async function dueSources():Promise<SourceRecord[]>{
  const sql=db();
  return await sql<SourceRecord[]>`select * from sources where is_active=true and (circuit_open_until is null or circuit_open_until < now()) and (last_checked_at is null or last_checked_at + make_interval(mins => poll_interval_minutes) <= now()) order by tier, coalesce(last_checked_at,to_timestamp(0))`;
}
export async function collectSource(source:SourceRecord):Promise<NormalizedDocument[]>{
  try{
    let docs:NormalizedDocument[]=[];
    if(source.ingestion_method==="rss") docs=await ingestRss(source);
    else throw new Error(`Adapter ${source.ingestion_method} not implemented`);
    const sql=db();
    await sql`update sources set last_checked_at=now(),last_success_at=now(),consecutive_failures=0,circuit_open_until=null,updated_at=now() where id=${source.id}`;
    return docs;
  }catch(e){
    const sql=db();
    const msg=e instanceof Error?e.message:String(e);
    await sql`update sources set last_checked_at=now(),consecutive_failures=consecutive_failures+1,circuit_open_until=case when consecutive_failures+1>=3 then now()+interval '30 minutes' else circuit_open_until end,updated_at=now() where id=${source.id}`;
    throw new Error(`${source.id}: ${msg}`);
  }
}
export async function persistDocuments(docs:NormalizedDocument[]){
  const sql=db(); let inserted=0;
  for(const d of docs){
    const rows=await sql`insert into source_documents(source_id,external_key,canonical_url,title,excerpt,body,authors,language,published_at,retrieved_at,content_hash,metadata) values(${d.sourceId},${d.externalKey},${d.canonicalUrl},${d.title},${d.excerpt},${d.body},${d.authors},${d.language},${d.publishedAt},${d.retrievedAt},${d.contentHash},${sql.json(JSON.parse(JSON.stringify(d.metadata)))}) on conflict(source_id,content_hash) do nothing returning id`;
    inserted+=rows.length;
  }
  return inserted;
}

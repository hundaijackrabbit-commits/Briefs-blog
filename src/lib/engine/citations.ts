import { db } from "@/lib/db";

export async function syncRevisionCitations(revisionId:string){
  const sql=db();
  const [rev]=await sql`select evidence_document_ids from editorial_revisions where id=${revisionId}::uuid`;
  if(!rev) throw new Error('Revision not found');
  let inserted=0;
  for(const documentId of rev.evidence_document_ids ?? []){
    const [doc]=await sql`select d.id,d.canonical_url,d.title,d.published_at,s.id as source_id,s.name as source_name,s.tier from source_documents d join sources s on s.id=d.source_id where d.id=${documentId}::uuid`;
    if(!doc) continue;
    const rows=await sql`insert into editorial_revision_citations(revision_id,document_id,source_id,url,title,source_name,source_tier,published_at) values(${revisionId}::uuid,${doc.id}::uuid,${doc.source_id},${doc.canonical_url},${doc.title},${doc.source_name},${doc.tier},${doc.published_at}) on conflict(revision_id,document_id) do nothing returning id`;
    inserted+=rows.length;
  }
  return {inserted};
}

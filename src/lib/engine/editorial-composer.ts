import { db } from "@/lib/db";
import { evaluateQuality } from "@/lib/engine/quality";

export async function evaluateRevision(revisionId:string){
  const sql=db();
  const [r]=await sql`
    select er.*, b.freshness_score,
      (select count(*)::int from editorial_revision_citations c where c.revision_id=er.id) as citation_count
    from editorial_revisions er join briefs b on b.id=er.brief_id
    where er.id=${revisionId}::uuid`;
  if(!r) throw new Error('Revision not found');
  const unsupported=(r.evidence_document_ids?.length ?? 0)===0?1:0;
  const q=evaluateQuality({
    evidence:unsupported?35:Math.min(100,70+(r.evidence_document_ids?.length ?? 0)*5),
    freshness:Math.max(50,r.freshness_score ?? 70),clarity:90,coverage:75,originality:70,
    unsupportedClaims:unsupported,conflicts:r.review_mode==='manual'?1:0
  });
  await sql`update editorial_revisions set quality_score=${q.overall},quality_blockers=${q.blockers},updated_at=now() where id=${revisionId}::uuid`;
  return q;
}

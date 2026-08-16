import { db } from "@/lib/db";
import { evaluateRevision } from "@/lib/engine/editorial-composer";
import { syncRevisionCitations } from "@/lib/engine/citations";
import { recalculateBriefFreshness } from "@/lib/engine/freshness-maintainer";
import { suggestInternalLinks } from "@/lib/engine/internal-links";

export async function approveRevision(id:string,actor='editor'){
  const q=await evaluateRevision(id);
  if(!q.publishable) return {approved:false,quality:q};
  const sql=db();
  await syncRevisionCitations(id);
  const rows=await sql`update editorial_revisions set status='approved',reviewed_by=${actor},reviewed_at=now(),updated_at=now() where id=${id}::uuid and status='proposed' returning id,review_mode`;
  return {approved:rows.length===1,quality:q,mode:rows[0]?.review_mode};
}

export async function rejectRevision(id:string,actor='editor',reason='Rejected by editor'){
  const sql=db();
  const rows=await sql`update editorial_revisions set status='rejected',reviewed_by=${actor},reviewed_at=now(),resolution_note=${reason},updated_at=now() where id=${id}::uuid and status in ('proposed','approved') returning id`;
  return {rejected:rows.length===1};
}

export async function publishRevision(id:string,actor='editor'){
  const sql=db();
  return sql.begin(async (tx:any)=>{
    const [rev]=await tx`select er.*, bs.body as current_body,bs.heading,bs.section_key,b.slug,b.title from editorial_revisions er join brief_sections bs on bs.id=er.section_id join briefs b on b.id=er.brief_id where er.id=${id}::uuid for update`;
    if(!rev) throw new Error('Revision not found');
    if(!['approved','proposed'].includes(rev.status)) throw new Error(`Revision cannot publish from status ${rev.status}`);
    if(rev.status==='proposed' && rev.review_mode!=='auto') throw new Error('Human approval required before publishing');
    if((rev.quality_blockers?.length ?? 0)>0) throw new Error('Quality blockers must be resolved before publishing');
    const [snapshot]=await tx`insert into publication_snapshots(brief_id,revision_id,state,created_by) values(${rev.brief_id}::uuid,${id}::uuid,${tx.json({sectionId:rev.section_id,sectionKey:rev.section_key,heading:rev.heading,body:rev.current_body,briefSlug:rev.slug,briefTitle:rev.title})},${actor}) returning id`;
    await tx`update brief_sections set body=${rev.proposed_body},generated_from='ai-assisted',last_verified_at=now(),updated_at=now() where id=${rev.section_id}::uuid`;
    await tx`update editorial_revisions set status='published',after_body=${rev.proposed_body},published_by=${actor},published_at=now(),snapshot_id=${snapshot.id},updated_at=now() where id=${id}::uuid`;
    await tx`update change_candidates set status='accepted' where id=${rev.change_candidate_id}::uuid`;
    await tx`insert into change_log(run_id,brief_id,change_type,summary,before_value,after_value) values(null,${rev.brief_id}::uuid,'editorial_revision',${rev.rationale},${rev.current_body},${rev.proposed_body})`;
    return {published:true,briefId:String(rev.brief_id),snapshotId:String(snapshot.id)};
  }).then(async (result:any)=>{await recalculateBriefFreshness(result.briefId);await suggestInternalLinks(result.briefId);return result;});
}

export async function rollbackRevision(id:string,actor='editor',reason='Rollback'){
  const sql=db();
  return sql.begin(async (tx:any)=>{
    const [rev]=await tx`select * from editorial_revisions where id=${id}::uuid for update`;
    if(!rev?.snapshot_id) throw new Error('No snapshot is available for this revision');
    const [snap]=await tx`select state from publication_snapshots where id=${rev.snapshot_id}::uuid`;
    if(!snap) throw new Error('Snapshot not found');
    const state=snap.state as any;
    await tx`update brief_sections set body=${state.body},updated_at=now() where id=${state.sectionId}::uuid`;
    await tx`update editorial_revisions set status='rolled_back',resolution_note=${reason},updated_at=now() where id=${id}::uuid`;
    await tx`insert into corrections(brief_id,revision_id,correction_type,summary,before_value,after_value,created_by) values(${rev.brief_id}::uuid,${id}::uuid,'rollback',${reason},${rev.after_body},${state.body},${actor})`;
    return {rolledBack:true,briefId:String(rev.brief_id)};
  }).then(async (result:any)=>{await recalculateBriefFreshness(result.briefId);return result;});
}

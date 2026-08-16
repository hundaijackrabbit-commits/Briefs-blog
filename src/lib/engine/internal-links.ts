import { db } from "@/lib/db";
export async function suggestInternalLinks(briefId:string){
  const sql=db();
  const rows=await sql`
    select distinct target.id as target_brief_id,target.slug,target.title,r.relation_type
    from brief_claims bc
    join claims c on c.id=bc.claim_id
    join entity_relations r on r.from_entity_id=c.entity_id or r.to_entity_id=c.entity_id
    join claims related on related.entity_id=case when r.from_entity_id=c.entity_id then r.to_entity_id else r.from_entity_id end
    join brief_claims tbc on tbc.claim_id=related.id
    join briefs target on target.id=tbc.brief_id
    where bc.brief_id=${briefId}::uuid and target.id<>${briefId}::uuid and target.status='published'
    limit 20`;
  for(const row of rows){await sql`insert into internal_link_suggestions(brief_id,target_brief_id,reason,status) values(${briefId}::uuid,${row.target_brief_id}::uuid,${`Related via ${row.relation_type}`},'suggested') on conflict(brief_id,target_brief_id) do update set reason=excluded.reason,updated_at=now()`;}
  return rows;
}

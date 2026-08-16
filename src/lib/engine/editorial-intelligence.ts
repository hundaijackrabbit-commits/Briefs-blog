import { db } from "@/lib/db";
import { reviewMode } from "@/lib/engine/policy";

function objectivePredicate(predicate:string){
  return /^(ceo|president|founded|revenue|price|users|employees|headcount|availability|release date|market cap|funding|rate|status)$/i.test(predicate.trim());
}

export async function affectedBriefSections(entityId:string,predicate:string){
  const sql=db();
  return sql`
    select distinct b.id as brief_id,b.slug,b.title,b.risk_class,s.id as section_id,s.section_key,s.heading,s.body
    from briefs b
    left join brief_claims bc on bc.brief_id=b.id
    left join claims c on c.id=bc.claim_id
    left join brief_sections s on s.brief_id=b.id
    left join brief_section_claims bsc on bsc.section_id=s.id
    left join claims sc on sc.id=bsc.claim_id
    where b.status='published'
      and (c.entity_id=${entityId} or sc.entity_id=${entityId})
      and (sc.predicate=${predicate} or c.predicate=${predicate} or s.section_key in ('what_changed','key_numbers','answer'))
    order by b.title,s.display_order nulls last`;
}

export async function proposeRevision(changeCandidateId:string){
  const sql=db();
  const [change]=await sql`
    select cc.*, e.name as entity_name, c.value_text as previous_value,
           c.verification_status,c.confidence,
           coalesce((select min(ce.source_tier) from claim_evidence ce where ce.claim_id=c.id),'D') as source_tier,
           exists(select 1 from claims x where x.entity_id=cc.entity_id and x.predicate=cc.predicate and x.valid_to is null and x.value_text<>cc.proposed_value) as conflict
    from change_candidates cc
    join entities e on e.id=cc.entity_id
    left join claims c on c.id=cc.previous_claim_id
    where cc.id=${changeCandidateId}::uuid`;
  if(!change) throw new Error("Change candidate not found");
  const sections=await affectedBriefSections(change.entity_id,change.predicate);
  if(!sections.length) return {created:0,reason:'no-affected-briefs'};

  let created=0;
  for(const section of sections){
    const verification=change.verification_status ?? 'unverified';
    const sourceTier=(change.source_tier ?? 'D') as 'A'|'B'|'C'|'D';
    const mode=reviewMode({verification,sourceTier,risk:section.risk_class,objective:objectivePredicate(change.predicate),conflict:!!change.conflict});
    const proposedBody=composeConservativeSection({
      sectionKey:section.section_key,
      entityName:change.entity_name,
      predicate:change.predicate,
      before:change.previous_value ?? null,
      after:change.proposed_value,
      existingBody:section.body ?? ''
    });
    const rows=await sql`
      insert into editorial_revisions(
        change_candidate_id,brief_id,section_id,status,review_mode,risk_class,
        rationale,before_body,proposed_body,claim_ids,evidence_document_ids
      ) values(
        ${change.id}::uuid,${section.brief_id}::uuid,${section.section_id}::uuid,'proposed',${mode},${section.risk_class},
        ${`${change.entity_name}: ${change.predicate} changed from ${change.previous_value ?? 'unknown'} to ${change.proposed_value}.`},
        ${section.body ?? ''},${proposedBody},
        ${change.previous_claim_id?[change.previous_claim_id]:[]}::uuid[],${change.evidence_document_ids ?? []}::uuid[]
      ) on conflict(change_candidate_id,section_id) do nothing returning id`;
    created+=rows.length;
  }
  return {created};
}

function composeConservativeSection(input:{sectionKey:string;entityName:string;predicate:string;before:string|null;after:string;existingBody:string}){
  const fact=`${input.entityName}: ${input.predicate} is now ${input.after}${input.before?` (previously ${input.before})`:''}.`;
  if(input.sectionKey==='what_changed') return fact;
  if(input.sectionKey==='key_numbers') return `${input.existingBody.trim()}\n\n${fact}`.trim();
  return input.existingBody.trim() || fact;
}

export async function reconcileEditorialRun(runId:string){
  const sql=db();
  const changes=await sql`select id from change_candidates where status='open' and (run_id=${runId}::uuid or run_id is null) order by significance desc,detected_at asc limit 200`;
  let proposals=0;
  for(const row of changes){const r=await proposeRevision(String(row.id)); proposals+=r.created;}
  return {changes:changes.length,proposals};
}

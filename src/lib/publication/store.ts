import { db } from "@/lib/db";
import type { ArticleDraft, EditorialMode, PublicationAudience, PublicationQualityReport, StoryAngle, StoryContract } from "@/lib/publication/types";
import type { ResearchGraph } from "@/lib/research/types";

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || `brief-${Date.now()}`;
}

export async function persistResearchSnapshot(args: {
  keywordId: string;
  opportunityId?: string | null;
  graph: ResearchGraph;
  primarySourceCount: number;
  independentFamilies: number;
}) {
  const sql = db();
  const rows = await sql`
    insert into publication_research_snapshots(
      opportunity_id,keyword_id,subject,graph,source_count,primary_source_count,
      independent_source_families,confidence,sufficient,knowledge_cutoff
    )
    values(
      ${args.opportunityId ?? null}::uuid,${args.keywordId}::uuid,${args.graph.canonicalSubject},
      ${sql.json(json(args.graph))},${args.graph.sources.length},${args.primarySourceCount},
      ${args.independentFamilies},${args.graph.confidence},${args.graph.sufficient},
      ${args.graph.knowledgeCutoff}::timestamptz
    )
    returning id
  `;
  return String(rows[0].id);
}

export async function createOpportunity(args: {
  keywordId: string;
  subject: string;
  angle: string;
  story: number;
  evidence: number;
  novelty: number;
  audience: number;
  freshness: number;
  rationale: string[];
  snapshotId: string;
}) {
  const sql = db();
  const rows = await sql`
    insert into publication_opportunities(
      keyword_id,subject,suggested_angle,story_score,evidence_score,novelty_score,
      audience_score,freshness_score,rationale,research_snapshot_id
    )
    values(
      ${args.keywordId}::uuid,${args.subject},${args.angle},${args.story},${args.evidence},
      ${args.novelty},${args.audience},${args.freshness},${args.rationale.join("; ")},${args.snapshotId}::uuid
    )
    returning id
  `;
  return String(rows[0].id);
}


export async function persistAngleCandidates(args:{opportunityId:string;keywordId:string;snapshotId:string;angles:StoryAngle[]}){
  const sql=db();
  await sql`delete from publication_angle_candidates where opportunity_id=${args.opportunityId}::uuid`;
  for(let i=0;i<args.angles.length;i++){const angle=args.angles[i];await sql`insert into publication_angle_candidates(opportunity_id,keyword_id,research_snapshot_id,angle_key,title,thesis,score,evidence_score,novelty_score,audience_score,risk_score,claim_ids,selected,rationale) values(${args.opportunityId}::uuid,${args.keywordId}::uuid,${args.snapshotId}::uuid,${angle.key},${angle.title},${angle.thesis},${angle.score},${angle.evidenceScore},${angle.noveltyScore},${angle.audienceScore},${angle.riskScore},${sql.json(json(angle.claimIds))},${i===0},${sql.json(json(angle.rationale))})`;}
}

export async function persistStoryContract(opportunityId:string,contract:StoryContract){
  const sql=db();
  await sql`insert into publication_story_contracts(opportunity_id,audience_key,angle_key,angle,thesis,why_now,reader_outcome,differentiator,strongest_claim_ids,counter_claim_ids,cannot_claim) values(${opportunityId}::uuid,${contract.audience},${contract.angleKey},${contract.angle},${contract.thesis},${contract.whyNow},${contract.readerOutcome},${contract.differentiator},${sql.json(json(contract.strongestClaimIds))},${sql.json(json(contract.counterClaimIds))},${sql.json(json(contract.cannotClaim))}) on conflict(opportunity_id) do update set audience_key=excluded.audience_key,angle_key=excluded.angle_key,angle=excluded.angle,thesis=excluded.thesis,why_now=excluded.why_now,reader_outcome=excluded.reader_outcome,differentiator=excluded.differentiator,strongest_claim_ids=excluded.strongest_claim_ids,counter_claim_ids=excluded.counter_claim_ids,cannot_claim=excluded.cannot_claim,updated_at=now()`;
}
export async function saveArticle(args: {
  opportunityId: string;
  keyword: string;
  draft: ArticleDraft;
  graph: ResearchGraph;
  mode: EditorialMode;
  quality: PublicationQualityReport;
  primarySourceCount: number;
  independentFamilies: number;
  autoPublish: boolean;
}) {
  const sql = db();
  const baseSlug = slugify(args.draft.title);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  const status = args.autoPublish ? "published" : "review";
  const rows = await sql`
    insert into publication_articles(
      opportunity_id,primary_keyword,slug,title,deck,category,audience_key,voice_key,
      article_type,editorial_mode,status,quality_score,source_count,primary_source_count,
      independent_source_families,published_at,last_revalidated_at,last_substantial_update_at,next_revalidate_at
    )
    values(
      ${args.opportunityId}::uuid,${args.keyword},${slug},${args.draft.title},${args.draft.deck},
      ${args.draft.category},${args.draft.audience},'briefs',${args.draft.articleType},${args.mode},${status},
      ${args.quality.totalScore},${args.graph.sources.length},${args.primarySourceCount},${args.independentFamilies},
      ${args.autoPublish ? new Date().toISOString() : null}::timestamptz,${args.graph.knowledgeCutoff}::timestamptz,
      ${args.autoPublish ? new Date().toISOString() : null}::timestamptz,now()+interval '1 day'
    )
    returning id,slug
  `;
  const articleId = String(rows[0].id);

  await sql`
    insert into publication_article_versions(article_id,version_no,title,deck,sections,reason)
    values(${articleId}::uuid,1,${args.draft.title},${args.draft.deck},${sql.json(json(args.draft.sections))},'initial verified draft')
  `;

  for (let i = 0; i < args.draft.sections.length; i++) {
    const section = args.draft.sections[i];
    await sql`
      insert into publication_article_sections(article_id,section_key,heading,body,display_order,claim_ids)
      values(${articleId}::uuid,${section.key},${section.heading},${section.body},${i},${sql.json(json(section.claimIds))})
    `;
    for (const claimId of section.claimIds) {
      await sql`
        insert into publication_content_dependencies(target_type,target_id,dependency_type,dependency_key,section_key)
        values('article',${articleId}::uuid,'claim',${claimId},${section.key})
        on conflict do nothing
      `;
    }
  }

  for (const finding of args.graph.findings) {
    await sql`
      insert into publication_article_claims(
        article_id,claim_id,subject,predicate,value_text,confidence,verification_status,source_ids
      )
      values(
        ${articleId}::uuid,${finding.id},${finding.subject},${finding.predicate},${finding.valueText},
        ${finding.confidence},${finding.verificationStatus},${sql.json(json(finding.sourceIds))}
      )
      on conflict(article_id,claim_id) do update set
        value_text=excluded.value_text,confidence=excluded.confidence,
        verification_status=excluded.verification_status,source_ids=excluded.source_ids
    `;
  }

  for (const source of args.graph.sources) {
    await sql`
      insert into publication_article_sources(
        article_id,source_id,name,title,url,tier,kind,source_family,excerpt,retrieved_at,published_at
      )
      values(
        ${articleId}::uuid,${source.id},${source.name},${source.title},${source.url},${source.tier},${source.kind},
        ${source.independenceFamily},${source.excerpt || ""},${source.retrievedAt}::timestamptz,
        ${source.publishedAt ?? null}::timestamptz
      )
      on conflict(article_id,source_id) do update set
        title=excluded.title,url=excluded.url,tier=excluded.tier,kind=excluded.kind,
        source_family=excluded.source_family,excerpt=excluded.excerpt,retrieved_at=excluded.retrieved_at,
        published_at=excluded.published_at
    `;
  }

  await sql`
    insert into publication_content_dependencies(target_type,target_id,dependency_type,dependency_key,section_key)
    values('article',${articleId}::uuid,'keyword',${args.keyword},null)
    on conflict do nothing
  `;

  await sql`
    update publication_opportunities
    set status=${args.autoPublish ? "published" : "drafted"},updated_at=now()
    where id=${args.opportunityId}::uuid
  `;
  return { articleId, slug, status };
}

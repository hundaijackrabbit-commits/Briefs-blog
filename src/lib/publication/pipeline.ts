import { db } from "@/lib/db";
import type { EditorialMode, PublicationAudience } from "@/lib/publication/types";
import { researchForPublication } from "@/lib/publication/research";
import { composePublicationArticle } from "@/lib/publication/writer";
import { originalityReport } from "@/lib/publication/originality";
import { evaluatePublicationQuality } from "@/lib/publication/quality";
import { createOpportunity, persistResearchSnapshot, saveArticle } from "@/lib/publication/store";

function angleFor(subject: string, intent: string) {
  if (intent === "current") return `What changed in ${subject} — and what matters now`;
  if (intent === "finance") return `${subject}: the numbers that change the story`;
  if (intent === "compare") return `${subject}: the difference that matters`;
  return `${subject}: what is actually worth knowing`;
}

export async function researchKeyword(keywordId: string) {
  const sql = db();
  const row = (await sql`
    select id,keyword,category,audience_key,editorial_mode,min_sources,require_primary,
      freshness_hours,min_story_score
    from publication_keywords where id=${keywordId}::uuid and active=true
  `)[0] as any;
  if (!row) throw new Error("Publication keyword not found or inactive");

  const researched = await researchForPublication(
    String(row.keyword),
    String(row.audience_key),
    Number(row.freshness_hours)
  );
  const snapshotId = await persistResearchSnapshot({
    keywordId,
    graph: researched.graph,
    primarySourceCount: researched.primarySourceCount,
    independentFamilies: researched.independentFamilies
  });
  const opportunityId = await createOpportunity({
    keywordId,
    subject: researched.graph.canonicalSubject,
    angle: angleFor(researched.graph.canonicalSubject, researched.graph.plan.intent),
    story: researched.opportunity.story,
    evidence: researched.opportunity.evidence,
    novelty: researched.opportunity.novelty,
    audience: researched.opportunity.audience,
    freshness: researched.opportunity.freshness,
    rationale: researched.opportunity.rationale,
    snapshotId
  });
  await sql`
    update publication_keywords
    set last_researched_at=now(),
        next_research_at=now()+(${Number(row.freshness_hours)}||' hours')::interval,
        updated_at=now()
    where id=${keywordId}::uuid
  `;

  if (String(row.editorial_mode) !== "manual" && researched.opportunity.story >= Number(row.min_story_score)) {
    const draft = await draftOpportunity(opportunityId);
    return { opportunityId, ...draft };
  }
  return { opportunityId, status: "candidate", storyScore: researched.opportunity.story };
}

export async function draftOpportunity(opportunityId: string) {
  const sql = db();
  const row = (await sql`
    select o.id,o.subject,o.story_score,o.research_snapshot_id,
      k.keyword,k.category,k.audience_key,k.editorial_mode,k.min_sources,k.require_primary,k.min_story_score,
      r.graph
    from publication_opportunities o
    join publication_keywords k on k.id=o.keyword_id
    join publication_research_snapshots r on r.id=o.research_snapshot_id
    where o.id=${opportunityId}::uuid
  `)[0] as any;
  if (!row) throw new Error("Publication opportunity not found");

  const graph = row.graph as import("@/lib/research/types").ResearchGraph;
  const draft = await composePublicationArticle(
    graph,
    String(row.audience_key) as PublicationAudience,
    String(row.category)
  );
  const sourceExcerpts = graph.sources.map(s => s.excerpt || "").filter(Boolean);
  const originality = await originalityReport(
    [draft.title, draft.deck, ...draft.sections.map(s => s.body)].join("\n\n"),
    sourceExcerpts
  );
  const primarySources = graph.sources.filter(s => s.kind === "primary").length;
  const families = new Set(graph.sources.map(s => s.independenceFamily || s.provider)).size;
  const quality = evaluatePublicationQuality({
    draft,
    graph,
    originality,
    minSources: Number(row.min_sources),
    requirePrimary: Boolean(row.require_primary),
    minStoryScore: Number(row.min_story_score),
    storyScore: Number(row.story_score),
    independentFamilies: families,
    primarySources
  });

  await sql`
    insert into publication_similarity_checks(opportunity_id,max_source_overlap,max_library_overlap,longest_matching_words,passed,details)
    values(
      ${opportunityId}::uuid,${originality.maxSourceOverlap},${originality.maxLibraryOverlap},
      ${originality.longestMatchingWords},${originality.passed},
      ${sql.json(JSON.parse(JSON.stringify({warnings:originality.warnings})))}
    )
  `;
  await sql`
    insert into publication_quality_results(
      opportunity_id,total_score,evidence_coverage,evidence_diversity,originality_score,
      audience_score,voice_score,freshness_score,unsupported_facts,blockers,warnings,passed
    )
    values(
      ${opportunityId}::uuid,${quality.totalScore},${quality.evidenceCoverage},${quality.evidenceDiversity},
      ${quality.originalityScore},${quality.audienceScore},${quality.voiceScore},${quality.freshnessScore},
      ${quality.unsupportedFacts},${sql.json(JSON.parse(JSON.stringify(quality.blockers)))},
      ${sql.json(JSON.parse(JSON.stringify(quality.warnings)))},${quality.passed}
    )
  `;

  if (!quality.passed) {
    await sql`update publication_opportunities set status='blocked',updated_at=now() where id=${opportunityId}::uuid`;
    return { status: "blocked", quality };
  }

  const highRisk = /^(markets|finance|policy|health|world|science)$/i.test(String(row.category));
  const autoPublish = String(row.editorial_mode) === "auto" &&
    !highRisk && quality.totalScore >= 92 && graph.confidence === "high";

  const saved = await saveArticle({
    opportunityId,
    keyword: String(row.keyword),
    draft,
    graph,
    mode: String(row.editorial_mode) as EditorialMode,
    quality,
    primarySourceCount: primarySources,
    independentFamilies: families,
    autoPublish
  });
  return { status: saved.status, articleId: saved.articleId, slug: saved.slug, quality };
}

export async function publishArticle(articleId: string) {
  const sql = db();
  const row = (await sql`
    update publication_articles
    set status='published',published_at=coalesce(published_at,now()),
        last_substantial_update_at=coalesce(last_substantial_update_at,now()),updated_at=now()
    where id=${articleId}::uuid and status in ('draft','review')
    returning id,slug
  `)[0];
  if (!row) throw new Error("Article is not publishable");
  return { id: String(row.id), slug: String(row.slug) };
}

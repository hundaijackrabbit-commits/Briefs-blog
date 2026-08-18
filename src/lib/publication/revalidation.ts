import { db } from "@/lib/db";
import { researchForPublication } from "@/lib/publication/research";
import { composePublicationArticle } from "@/lib/publication/writer";
import { buildStoryContract } from "@/lib/publication/story-contract";
import type { StoryAngle } from "@/lib/publication/types";
import { originalityReport } from "@/lib/publication/originality";
import { evaluatePublicationQuality } from "@/lib/publication/quality";
import type { PublicationAudience } from "@/lib/publication/types";

function json(value: unknown) { return JSON.parse(JSON.stringify(value)); }
function norm(value: string) { return value.toLowerCase().replace(/\s+/g, " ").trim(); }

type ChangedClaim = {
  oldClaimId: string;
  predicate: string;
  before: string;
  after: string;
  newClaimId: string;
  sourceIds: string[];
  confidence: "high" | "medium" | "low";
  verificationStatus: "confirmed" | "corroborated" | "reported" | "unverified";
};

function changedClaims(
  oldClaims: Array<{ claim_id: string; predicate: string; value_text: string }>,
  findings: Array<{
    id: string; predicate: string; valueText: string; sourceIds: string[];
    confidence: "high" | "medium" | "low";
    verificationStatus: "confirmed" | "corroborated" | "reported" | "unverified";
  }>
): ChangedClaim[] {
  const byPredicate = new Map(findings.map(f => [norm(f.predicate), f]));
  const changed: ChangedClaim[] = [];
  for (const old of oldClaims) {
    const next = byPredicate.get(norm(old.predicate));
    if (!next) continue;
    if (norm(old.value_text) !== norm(next.valueText)) {
      changed.push({
        oldClaimId: old.claim_id,
        predicate: old.predicate,
        before: old.value_text,
        after: next.valueText,
        newClaimId: next.id,
        sourceIds: next.sourceIds,
        confidence: next.confidence,
        verificationStatus: next.verificationStatus
      });
    }
  }
  return changed;
}

async function createUpdateProposal(args: {
  targetType: "article" | "brief";
  targetId: string;
  reviewMode: "auto" | "review" | "manual";
  summary: string;
  reason: string;
  patch: unknown;
  evidence: unknown;
  quality?: unknown;
}) {
  const sql = db();
  await sql`
    update publication_update_proposals
    set status='superseded',resolved_at=now()
    where target_type=${args.targetType} and target_id=${args.targetId}::uuid and status='proposed'
  `;
  const rows = await sql`
    insert into publication_update_proposals(
      target_type,target_id,review_mode,summary,reason,proposed_patch,evidence_snapshot,quality_snapshot
    )
    values(
      ${args.targetType},${args.targetId}::uuid,${args.reviewMode},${args.summary},${args.reason},
      ${sql.json(json(args.patch))},${sql.json(json(args.evidence))},${sql.json(json(args.quality || {}))}
    )
    returning id
  `;
  return String(rows[0].id);
}

export async function revalidateArticle(articleId: string) {
  const sql = db();
  const article = (await sql`
    select id,title,deck,primary_keyword,category,audience_key,editorial_mode,quality_score
    from publication_articles
    where id=${articleId}::uuid and status='published'
  `)[0] as any;
  if (!article) return { status: "skipped" };

  const oldClaims = await sql`
    select claim_id,predicate,value_text
    from publication_article_claims
    where article_id=${articleId}::uuid
  ` as unknown as Array<{ claim_id: string; predicate: string; value_text: string }>;

  const researched = await researchForPublication(String(article.primary_keyword), String(article.audience_key), 24);
  const graph = researched.graph;
  if (!graph.sufficient) {
    await sql`
      update publication_articles
      set freshness_status='research-required',next_revalidate_at=now()+interval '6 hours',updated_at=now()
      where id=${articleId}::uuid
    `;
    return { status: "research-required" };
  }

  const changed = changedClaims(oldClaims, graph.findings);
  if (!changed.length) {
    await sql`
      update publication_articles
      set freshness_status='revalidated',last_revalidated_at=${graph.knowledgeCutoff}::timestamptz,
          next_revalidate_at=now()+interval '1 day',updated_at=now()
      where id=${articleId}::uuid
    `;
    return { status: "revalidated", changes: 0 };
  }

  const revalidationAngle:StoryAngle={
    key:"revalidation",title:String(article.title),thesis:String(article.deck||`Update ${article.title} only where the evidence changed.`),
    score:100,evidenceScore:100,noveltyScore:100,audienceScore:90,riskScore:20,
    claimIds:graph.findings.slice(0,6).map(f=>f.id),rationale:["Preserve the published article's editorial meaning during revalidation"]
  };
  const storyContract=buildStoryContract(graph,String(article.audience_key) as PublicationAudience,revalidationAngle);
  const draft = await composePublicationArticle(
    graph,
    String(article.audience_key) as PublicationAudience,
    String(article.category),
    storyContract
  );
  const affectedOldIds = new Set(changed.map(c => c.oldClaimId));
  const sections = await sql`
    select section_key,heading,body,claim_ids
    from publication_article_sections
    where article_id=${articleId}::uuid
    order by display_order
  ` as unknown as Array<{ section_key: string; heading: string; body: string; claim_ids: unknown }>;

  const affectedKeys = new Set<string>();
  for (const section of sections) {
    const ids = Array.isArray(section.claim_ids) ? section.claim_ids.map(String) : [];
    if (ids.some(id => affectedOldIds.has(id))) affectedKeys.add(section.section_key);
  }
  if (!affectedKeys.size) { affectedKeys.add("brief"); affectedKeys.add("evidence"); }

  const proposedSections = draft.sections.filter(s => affectedKeys.has(s.key));
  const originality = await originalityReport(
    proposedSections.map(s => s.body).join("\n\n"),
    graph.sources.map(s => s.excerpt || ""),
    articleId
  );
  const quality = evaluatePublicationQuality({
    draft,
    graph,
    originality,
    minSources: 3,
    requirePrimary: false,
    minStoryScore: 0,
    storyScore: 100,
    independentFamilies: researched.independentFamilies,
    primarySources: researched.primarySourceCount,
    storyContract
  });

  await sql`
    insert into publication_similarity_checks(
      article_id,max_source_overlap,max_library_overlap,longest_matching_words,passed,details
    )
    values(
      ${articleId}::uuid,${originality.maxSourceOverlap},${originality.maxLibraryOverlap},
      ${originality.longestMatchingWords},${originality.passed},
      ${sql.json(json({warnings:originality.warnings,reason:"daily-revalidation"}))}
    )
  `;
  await sql`
    insert into publication_quality_results(
      article_id,total_score,evidence_coverage,evidence_diversity,originality_score,
      audience_score,reader_goal_score,voice_score,freshness_score,headline_score,specificity_score,
      unsupported_facts,blockers,warnings,passed,voice_version
    )
    values(
      ${articleId}::uuid,${quality.totalScore},${quality.evidenceCoverage},${quality.evidenceDiversity},
      ${quality.originalityScore},${quality.audienceScore},${quality.readerGoalScore},${quality.voiceScore},${quality.freshnessScore},
      ${quality.headlineScore},${quality.specificityScore},${quality.unsupportedFacts},${sql.json(json(quality.blockers))},
      ${sql.json(json(quality.warnings))},${quality.passed},'2.0'
    )
  `;

  const proposalId = await createUpdateProposal({
    targetType: "article",
    targetId: articleId,
    reviewMode: String(article.editorial_mode) as "auto" | "review" | "manual",
    summary: `${changed.length} tracked claim${changed.length === 1 ? "" : "s"} changed`,
    reason: "Daily publication revalidation found a newer evidence-backed value.",
    patch: {
      changedClaims: changed,
      sections: proposedSections
    },
    evidence: {
      sources: graph.sources.map(s => ({
        id: s.id, name: s.name, title: s.title, url: s.url, tier: s.tier, kind: s.kind,
        sourceFamily: s.independenceFamily, excerpt: s.excerpt, retrievedAt: s.retrievedAt,
        publishedAt: s.publishedAt || null
      })),
      findings: graph.findings,
      knowledgeCutoff: graph.knowledgeCutoff
    },
    quality
  });

  await sql`
    update publication_articles
    set freshness_status='update-available',last_revalidated_at=${graph.knowledgeCutoff}::timestamptz,
        next_revalidate_at=now()+interval '1 day',updated_at=now()
    where id=${articleId}::uuid
  `;

  if (String(article.editorial_mode) === "auto" && quality.passed && quality.totalScore >= 92) {
    await applyArticleProposal(proposalId);
    return { status: "updated", changes: changed.length, proposalId };
  }
  return { status: "update-available", changes: changed.length, proposalId };
}

export async function revalidateBrief(briefId: string) {
  const sql = db();
  const brief = (await sql`
    select id,title,category,answer
    from briefs
    where id=${briefId}::uuid and status='published'
  `)[0] as any;
  if (!brief) return { status: "skipped" };

  const oldClaims = await sql`
    select c.id::text claim_id,c.predicate,c.value_text
    from brief_claims bc
    join claims c on c.id=bc.claim_id
    where bc.brief_id=${briefId}::uuid and c.verification_status<>'retracted'
  ` as unknown as Array<{ claim_id: string; predicate: string; value_text: string }>;

  const researched = await researchForPublication(String(brief.title), "smart-generalist", 24);
  const graph = researched.graph;
  if (!graph.sufficient) return { status: "research-required" };

  const changed = changedClaims(oldClaims, graph.findings);
  if (!changed.length) {
    await sql`
      update briefs
      set last_verified_at=${graph.knowledgeCutoff}::timestamptz,
          freshness_score=greatest(coalesce(freshness_score,0),90),updated_at=now()
      where id=${briefId}::uuid
    `;
    return { status: "revalidated", changes: 0 };
  }

  const strong = changed.every(change => {
    const finding = graph.findings.find(f => f.id === change.newClaimId);
    return finding && finding.confidence === "high" &&
      ["confirmed","corroborated"].includes(finding.verificationStatus);
  });
  const reviewMode: "auto" | "review" = process.env.PUBLICATION_BRIEF_AUTO_UPDATE === "true" && strong ? "auto" : "review";
  const proposalId = await createUpdateProposal({
    targetType: "brief",
    targetId: briefId,
    reviewMode,
    summary: `${changed.length} Living Brief claim${changed.length === 1 ? "" : "s"} changed`,
    reason: "Daily revalidation found newer verified knowledge.",
    patch: {
      changedClaims: changed,
      proposedAnswer: graph.description,
      knowledgeCutoff: graph.knowledgeCutoff
    },
    evidence: {
      sources: graph.sources.map(s => ({
        id: s.id, name: s.name, title: s.title, url: s.url, tier: s.tier, kind: s.kind,
        sourceFamily: s.independenceFamily, excerpt: s.excerpt, retrievedAt: s.retrievedAt,
        publishedAt: s.publishedAt || null
      })),
      confidence: graph.confidence
    }
  });

  if (reviewMode === "auto") {
    await applyBriefProposal(proposalId);
    return { status: "updated", changes: changed.length, proposalId };
  }
  return { status: "update-available", changes: changed.length, proposalId };
}

export async function applyArticleProposal(proposalId: string) {
  const sql = db();
  const proposal = (await sql`
    select id,target_id,proposed_patch,evidence_snapshot,quality_snapshot
    from publication_update_proposals
    where id=${proposalId}::uuid and target_type='article' and status='proposed'
    for update
  `)[0] as any;
  if (!proposal) throw new Error("Article update proposal is not publishable");
  const articleId = String(proposal.target_id);
  const patch = proposal.proposed_patch as {
    sections?: Array<{ key: string; heading: string; body: string; claimIds: string[] }>;
    changedClaims?: Array<{
      oldClaimId: string; newClaimId: string; predicate: string; after: string;
      sourceIds: string[]; confidence: "high" | "medium" | "low";
      verificationStatus: "confirmed" | "corroborated" | "reported" | "unverified";
    }>;
    title?: string;
    deck?: string;
  };
  const evidence = proposal.evidence_snapshot as {
    knowledgeCutoff?: string;
    sources?: Array<{
      id:string;name:string;title?:string;url:string;tier:string;kind:string;
      sourceFamily?:string;excerpt?:string;retrievedAt?:string;publishedAt?:string|null;
    }>;
    findings?: Array<{
      id:string;subject:string;predicate:string;valueText:string;sourceIds:string[];
      confidence:"high"|"medium"|"low";
      verificationStatus:"confirmed"|"corroborated"|"reported"|"unverified";
    }>;
  };
  const qualitySnapshot = proposal.quality_snapshot as { totalScore?: number } | undefined;
  const evidenceSources = evidence.sources || [];
  const primaryCount = evidenceSources.filter(source => source.kind === "primary").length;
  const familyCount = new Set(evidenceSources.map(source => source.sourceFamily || source.id)).size;

  const existingSections = await sql`
    select section_key,heading,body,claim_ids
    from publication_article_sections where article_id=${articleId}::uuid order by display_order
  `;
  const nextVersion = Number((await sql`
    select coalesce(max(version_no),0)+1 next_version
    from publication_article_versions where article_id=${articleId}::uuid
  `)[0].next_version);

  const current = (await sql`select title,deck from publication_articles where id=${articleId}::uuid`)[0] as any;
  await sql`
    insert into publication_article_versions(article_id,version_no,title,deck,sections,reason)
    values(
      ${articleId}::uuid,${nextVersion},${String(current.title)},${String(current.deck || "")},
      ${sql.json(json(existingSections))},'snapshot before daily evidence-backed update'
    )
  `;

  for (const section of patch.sections || []) {
    await sql`
      update publication_article_sections
      set heading=${section.heading},body=${section.body},claim_ids=${sql.json(json(section.claimIds))},updated_at=now()
      where article_id=${articleId}::uuid and section_key=${section.key}
    `;
  }

  const findingById = new Map((evidence.findings || []).map(f => [f.id, f]));
  for (const section of patch.sections || []) {
    await sql`
      delete from publication_content_dependencies
      where target_type='article' and target_id=${articleId}::uuid and section_key=${section.key}
    `;
    for (const claimId of section.claimIds) {
      const finding = findingById.get(claimId);
      if (finding) {
        await sql`
          insert into publication_article_claims(
            article_id,claim_id,subject,predicate,value_text,confidence,verification_status,source_ids
          )
          values(
            ${articleId}::uuid,${finding.id},${finding.subject},${finding.predicate},${finding.valueText},
            ${finding.confidence},${finding.verificationStatus},${sql.json(json(finding.sourceIds))}
          )
          on conflict(article_id,claim_id) do update set
            subject=excluded.subject,predicate=excluded.predicate,value_text=excluded.value_text,
            confidence=excluded.confidence,verification_status=excluded.verification_status,
            source_ids=excluded.source_ids
        `;
      }
      await sql`
        insert into publication_content_dependencies(
          target_type,target_id,dependency_type,dependency_key,section_key
        )
        values('article',${articleId}::uuid,'claim',${claimId},${section.key})
        on conflict do nothing
      `;
    }
  }

  for (const change of patch.changedClaims || []) {
    const finding = findingById.get(change.newClaimId);
    if (finding) {
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
    await sql`
      delete from publication_article_claims
      where article_id=${articleId}::uuid and claim_id=${change.oldClaimId}
    `;
  }

  if (evidence.sources?.length) {
    await sql`delete from publication_article_sources where article_id=${articleId}::uuid`;
    for (const source of evidence.sources) {
      await sql`
        insert into publication_article_sources(
          article_id,source_id,name,title,url,tier,kind,source_family,excerpt,retrieved_at,published_at
        )
        values(
          ${articleId}::uuid,${source.id},${source.name},${source.title || ""},${source.url},${source.tier},
          ${source.kind},${source.sourceFamily || ""},${source.excerpt || ""},
          ${source.retrievedAt ?? null}::timestamptz,${source.publishedAt ?? null}::timestamptz
        )
      `;
    }
  }

  await sql`
    update publication_articles
    set title=coalesce(${patch.title ?? null},title),deck=coalesce(${patch.deck ?? null},deck),
        freshness_status='current',last_substantial_update_at=now(),
        last_revalidated_at=coalesce(${evidence.knowledgeCutoff ?? null}::timestamptz,now()),
        quality_score=coalesce(${qualitySnapshot?.totalScore ?? null},quality_score),
        source_count=${evidenceSources.length},primary_source_count=${primaryCount},
        independent_source_families=${familyCount},
        next_revalidate_at=now()+interval '1 day',updated_at=now()
    where id=${articleId}::uuid
  `;
  await sql`
    update publication_update_proposals set status='published',resolved_at=now()
    where id=${proposalId}::uuid
  `;
  return { status: "published", articleId };
}


function sourceType(kind: string) {
  if (kind === "primary") return "primary";
  if (kind === "reporting") return "reporting";
  if (kind === "discovery") return "discovery";
  return "specialist";
}

export async function applyBriefProposal(proposalId: string) {
  const sql = db();
  const proposal = (await sql`
    select id,target_id,proposed_patch,evidence_snapshot
    from publication_update_proposals
    where id=${proposalId}::uuid and target_type='brief' and status='proposed'
    for update
  `)[0] as any;
  if (!proposal) throw new Error("Living Brief update proposal is not publishable");

  const briefId = String(proposal.target_id);
  const patch = proposal.proposed_patch as {
    changedClaims?: ChangedClaim[];
    proposedAnswer?: string;
    knowledgeCutoff?: string;
  };
  const evidence = proposal.evidence_snapshot as {
    confidence?: string;
    sources?: Array<{
      id:string;name:string;title?:string;url:string;tier:"A"|"B"|"C"|"D";kind:string;
      sourceFamily?:string;excerpt?:string;retrievedAt?:string;publishedAt?:string|null;
    }>;
  };
  const sourceById = new Map((evidence.sources || []).map(source => [source.id, source]));

  for (const change of patch.changedClaims || []) {
    const old = (await sql`
      select id,entity_id,predicate,value_text,freshness_class,verification_status,confidence,
        valid_from,valid_to,last_verified_at
      from claims where id=${change.oldClaimId}::uuid
    `)[0] as any;
    if (!old) continue;

    const versionNo = Number((await sql`
      select coalesce(max(version_no),0)+1 next_version from claim_versions
      where claim_id=${change.oldClaimId}::uuid
    `)[0].next_version);
    await sql`
      insert into claim_versions(
        claim_id,version_no,value_text,normalized_value,verification_status,confidence,
        valid_from,valid_to,evidence_ids
      )
      values(
        ${change.oldClaimId}::uuid,${versionNo},${String(old.value_text)},null,
        ${String(old.verification_status)},${String(old.confidence)},
        ${old.valid_from ?? null}::timestamptz,${old.valid_to ?? null}::timestamptz,'{}'::uuid[]
      )
      on conflict(claim_id,version_no) do nothing
    `;

    const next = (await sql`
      insert into claims(
        entity_id,predicate,value_text,normalized_value,freshness_class,verification_status,
        confidence,valid_from,last_verified_at,supersedes_claim_id
      )
      values(
        ${String(old.entity_id)},${change.predicate},${change.after},null,${String(old.freshness_class)},
        ${change.verificationStatus},${change.confidence},now(),
        ${patch.knowledgeCutoff ?? null}::timestamptz,${change.oldClaimId}::uuid
      )
      returning id
    `)[0];
    const nextClaimId = String(next.id);

    for (const sourceId of change.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source?.url) continue;
      await sql`
        insert into sources(id,name,url,source_type,tier,ingestion_method,topics,is_active)
        values(
          ${source.id},${source.name},${source.url},${sourceType(source.kind)},${source.tier},
          'custom',array['publication-revalidation'],true
        )
        on conflict(id) do update set
          name=excluded.name,url=excluded.url,source_type=excluded.source_type,tier=excluded.tier,
          last_success_at=now(),updated_at=now()
      `;
      const contentHash = `publication:${source.id}:${patch.knowledgeCutoff || "current"}`;
      const document = (await sql`
        insert into source_documents(
          source_id,external_key,canonical_url,title,excerpt,body,published_at,retrieved_at,
          content_hash,metadata
        )
        values(
          ${source.id},${source.id},${source.url},${source.title || source.name},${source.excerpt || ""},
          null,${source.publishedAt ?? null}::timestamptz,
          ${source.retrievedAt ?? patch.knowledgeCutoff ?? new Date().toISOString()}::timestamptz,
          ${contentHash},${sql.json(json({publicationRevalidation:true,sourceFamily:source.sourceFamily || ""}))}
        )
        on conflict(source_id,content_hash) do update set retrieved_at=excluded.retrieved_at
        returning id
      `)[0];
      if (document?.id) {
        await sql`
          insert into claim_evidence(claim_id,document_id,stance,excerpt,source_tier,independence_key,directness)
          values(
            ${nextClaimId}::uuid,${String(document.id)}::uuid,'supports',${source.excerpt || ""},
            ${source.tier},${source.sourceFamily || source.id},
            ${source.kind === "primary" ? "direct" : "indirect"}
          )
          on conflict(claim_id,document_id,stance) do nothing
        `;
      }
    }

    const briefLink = (await sql`
      select display_order from brief_claims
      where brief_id=${briefId}::uuid and claim_id=${change.oldClaimId}::uuid
    `)[0] as any;
    const sectionLinks = await sql`
      select section_id,dependency_type from brief_section_claims
      where claim_id=${change.oldClaimId}::uuid
    `;

    await sql`update claims set valid_to=coalesce(valid_to,now()) where id=${change.oldClaimId}::uuid`;
    await sql`
      delete from brief_claims where brief_id=${briefId}::uuid and claim_id=${change.oldClaimId}::uuid
    `;
    await sql`
      insert into brief_claims(brief_id,claim_id,display_order)
      values(${briefId}::uuid,${nextClaimId}::uuid,${Number(briefLink?.display_order || 0)})
      on conflict do nothing
    `;
    for (const link of sectionLinks as unknown as Array<{section_id:string;dependency_type:string}>) {
      await sql`
        delete from brief_section_claims
        where section_id=${String(link.section_id)}::uuid and claim_id=${change.oldClaimId}::uuid
          and dependency_type=${String(link.dependency_type)}
      `;
      await sql`
        insert into brief_section_claims(section_id,claim_id,dependency_type)
        values(${String(link.section_id)}::uuid,${nextClaimId}::uuid,${String(link.dependency_type)})
        on conflict do nothing
      `;
    }
    await sql`
      insert into change_log(brief_id,claim_id,change_type,summary,before_value,after_value,changed_at)
      values(
        ${briefId}::uuid,${nextClaimId}::uuid,'publication-revalidation',
        ${`${change.predicate} changed after daily revalidation.`},${change.before},${change.after},now()
      )
    `;
  }

  await sql`
    update briefs
    set answer=coalesce(${patch.proposedAnswer ?? null},answer),
        last_verified_at=coalesce(${patch.knowledgeCutoff ?? null}::timestamptz,last_verified_at),
        last_substantial_update_at=now(),freshness_score=95,updated_at=now()
    where id=${briefId}::uuid
  `;
  await sql`
    update publication_update_proposals set status='published',resolved_at=now()
    where id=${proposalId}::uuid
  `;
  return { status:"published", briefId };
}

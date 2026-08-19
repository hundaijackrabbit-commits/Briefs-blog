import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false
});

try {
  const opportunityId = "4fe55ccf-2175-45ac-91bd-910d57508ff2";
  const articleId = "7c5d5015-571e-4732-afef-8366d82f138e";

  const article = (await sql`
    select id,slug,title,deck,category,status,quality_score,
           source_count,primary_source_count,independent_source_families,
           editorial_mode,created_at
    from publication_articles
    where id=${articleId}::uuid
  `)[0];

  const quality = (await sql`
    select *
    from publication_quality_results
    where opportunity_id=${opportunityId}::uuid
    order by created_at desc
    limit 1
  `)[0];

  const similarity = (await sql`
    select max_source_overlap,max_library_overlap,
           longest_matching_words,passed,details
    from publication_similarity_checks
    where opportunity_id=${opportunityId}::uuid
    order by created_at desc
    limit 1
  `)[0];

  const sections = await sql`
    select section_key,heading,body,claim_ids
    from publication_article_sections
    where article_id=${articleId}::uuid
    order by display_order
  `;

  const research = (await sql`
    select r.graph
    from publication_opportunities o
    join publication_research_snapshots r
      on r.id=o.research_snapshot_id
    where o.id=${opportunityId}::uuid
  `)[0];

  const alignment = research?.graph?.alignment || null;

  console.log(JSON.stringify({
    article,
    quality,
    originality: similarity,
    alignment: alignment ? {
      score: alignment.score,
      passed: alignment.passed,
      clusterCoherence: alignment.clusterCoherence,
      coverageRatio: alignment.coverageRatio,
      alignedFamilies: alignment.alignedFamilies,
      alignedSourceCount: alignment.alignedSourceIds?.length,
      rejectedSourceCount: alignment.rejectedSourceIds?.length,
      temporalAlignment: alignment.temporalAlignment,
      repaired: alignment.repaired,
      reasons: alignment.reasons
    } : null,
    sections
  }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false
});

try {
  const opportunityId = "ab77d6ba-811f-4940-b061-953b595072a1";

  const rows = await sql`
    select
      o.id,
      o.subject,
      o.status,
      o.story_score,
      o.evidence_score,
      r.source_count,
      r.independent_source_families,
      r.confidence,
      r.sufficient,
      r.graph
    from publication_opportunities o
    join publication_research_snapshots r
      on r.id = o.research_snapshot_id
    where o.id = ${opportunityId}::uuid
    limit 1
  `;

  const quality = await sql`
    select
      total_score,
      blockers,
      warnings,
      passed
    from publication_quality_results
    where opportunity_id = ${opportunityId}::uuid
    order by created_at desc
    limit 1
  `;

  const row = rows[0];
  const graph = row?.graph || {};
  const alignment = graph.alignment || null;

  const scores = new Map(
    (alignment?.sourceScores || []).map(x => [x.sourceId, x])
  );

  const sources = (graph.sources || []).map(source => {
    const score = scores.get(source.id) || {};

    return {
      title: source.title,
      name: source.name,
      family: source.independenceFamily,
      score: score.score,
      topic: score.topic,
      action: score.action,
      matchedDistinctive: score.matchedDistinctive,
      negativePenalty: score.negativePenalty,
      passed: score.passed
    };
  });

  console.log(JSON.stringify({
    opportunity: {
      id: row?.id,
      subject: row?.subject,
      status: row?.status,
      storyScore: row?.story_score,
      evidenceScore: row?.evidence_score
    },
    research: {
      sourceCount: row?.source_count,
      families: row?.independent_source_families,
      confidence: row?.confidence,
      sufficient: row?.sufficient
    },
    alignment,
    quality: quality[0] || null,
    sources
  }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  const run = (await sql`
    select id, editorial_day, started_at, completed_at, status
    from publication_global_runs
    order by started_at desc
    limit 1
  `)[0];

  const candidates = await sql`
    select
      id, subject, research_query, category, source_families, mention_count,
      evidence_breadth, importance_score, distinctiveness_score, final_score,
      selected, status, rationale, created_at
    from publication_global_candidates
    where run_id = ${run.id}::uuid
    order by final_score desc
    limit 15
  `;

  const opportunities = await sql`
    select
      o.id, o.subject, o.status, o.story_score, o.evidence_score, o.created_at,
      k.keyword, k.category, r.source_count, r.independent_source_families,
      r.confidence, r.sufficient, r.graph
    from publication_opportunities o
    join publication_keywords k on k.id = o.keyword_id
    left join publication_research_snapshots r on r.id = o.research_snapshot_id
    where o.created_at >= ${run.started_at}
      and o.created_at <= coalesce(${run.completed_at}, now()) + interval '2 minutes'
    order by o.created_at asc
  `;

  console.log(JSON.stringify({
    run,
    attemptedCandidates: candidates.filter(c => c.status === "research-blocked" || c.selected),
    topCandidates: candidates.slice(0, 10),
    opportunities: opportunities.map(o => ({
      id: o.id,
      subject: o.subject,
      keyword: o.keyword,
      category: o.category,
      status: o.status,
      storyScore: o.story_score,
      evidenceScore: o.evidence_score,
      sourceCount: o.source_count,
      families: o.independent_source_families,
      confidence: o.confidence,
      sufficient: o.sufficient,
      alignment: o.graph?.alignment ? {
        score: o.graph.alignment.score,
        passed: o.graph.alignment.passed,
        clusterCoherence: o.graph.alignment.clusterCoherence,
        coverageRatio: o.graph.alignment.coverageRatio,
        alignedFamilies: o.graph.alignment.alignedFamilies,
        alignedSourceCount: o.graph.alignment.alignedSourceIds?.length,
        reasons: o.graph.alignment.reasons
      } : null
    }))
  }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}

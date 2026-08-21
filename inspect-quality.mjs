import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false
});

try {
  const opportunityId = "eff8e099-2303-4937-8102-54ea4b577a36";

  const rows = await sql`
    select
      total_score,
      evidence_coverage,
      evidence_diversity,
      originality_score,
      audience_score,
      reader_goal_score,
      voice_score,
      freshness_score,
      headline_score,
      specificity_score,
      unsupported_facts,
      blockers,
      warnings,
      passed
    from publication_quality_results
    where opportunity_id = ${opportunityId}::uuid
    order by created_at desc
    limit 1
  `;

  console.log(JSON.stringify(rows[0] || null, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}






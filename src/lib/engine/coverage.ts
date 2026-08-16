import { db } from "@/lib/db";
export async function evaluateTopicCoverage(topicSlug:string,expectedConcepts:string[]=[]){
  const sql=db();
  const allEntities=await sql`select id,slug,metadata from entities`;
  const entities=allEntities.filter((e:any)=>Array.isArray(e.metadata?.topics)&&e.metadata.topics.map((x:string)=>x.toLowerCase()).includes(topicSlug.toLowerCase()));
  const briefs=await sql`select count(*)::int as n,coalesce(avg(freshness_score),0)::int as freshness from briefs where lower(category)=lower(${topicSlug})`;
  const sources=await sql`select count(*)::int as n from sources where ${topicSlug}=any(topics) and is_active=true`;
  const entitySlugs=new Set(entities.map((x:any)=>x.slug)); const missing=expectedConcepts.filter(x=>!entitySlugs.has(x));
  const entityCoverage=expectedConcepts.length?Math.round(((expectedConcepts.length-missing.length)/expectedConcepts.length)*100):Math.min(100,(briefs[0]?.n??0)*10);
  const claimFreshness=briefs[0]?.freshness??0,sourceDiversity=Math.min(100,(sources[0]?.n??0)*12);
  const score=Math.round(entityCoverage*.4+claimFreshness*.4+sourceDiversity*.2);
  await sql`insert into coverage_scores(topic_slug,score,entity_coverage,claim_freshness,source_diversity,missing_concepts) values(${topicSlug},${score},${entityCoverage},${claimFreshness},${sourceDiversity},${missing})`;
  return {topicSlug,score,entityCoverage,claimFreshness,sourceDiversity,missingConcepts:missing};
}

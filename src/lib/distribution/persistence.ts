import { db } from "@/lib/db";
import type { BriefRequest, BriefResult } from "@/lib/types";
export async function persistPublicApiObservation(request:BriefRequest,result:BriefResult){
  if(!process.env.DATABASE_URL) return;
  try{const sql=db();await sql`insert into public_api_observations(subject,depth,perspective,source_policy,result_confidence,source_count,research_needed) values(${request.subject},${request.depth},${request.perspective},${request.sourcePolicy||null},${result.confidence},${result.sources.length},${result.researchNeeded})`;}catch(error){console.error("public api observation persistence",error);}
}

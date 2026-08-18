import { db } from "@/lib/db";
import { researchSubject } from "@/lib/research/research-engine";
import type { BriefRequest } from "@/lib/types";
import type { PublicationResearch } from "@/lib/publication/types";
import { primarySourceCount, scoreOpportunity, sourceFamilies } from "@/lib/publication/scoring";

function normalizedWords(text: string) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(x => x.length > 2));
}
function titleSimilarity(a:string,b:string){const A=normalizedWords(a),B=normalizedWords(b);if(!A.size||!B.size)return 0;let common=0;for(const word of A)if(B.has(word))common++;return common/Math.max(A.size,B.size);}

async function libraryCompetition(subject:string){
  if(!process.env.DATABASE_URL)return {novelty:82,saturationPenalty:0};
  try{
    const sql=db();const rows=await sql`select title,primary_keyword,published_at,created_at from publication_articles where status in ('review','published') order by created_at desc limit 400`;
    let highest=0;let closeRecent=0;const cutoff=Date.now()-30*86400000;
    for(const row of rows as Array<{title:string;primary_keyword:string;published_at:string|null;created_at:string}>){const sim=titleSimilarity(subject,`${row.title} ${row.primary_keyword}`);highest=Math.max(highest,sim);const when=Date.parse(row.published_at||row.created_at);if(sim>.42&&when>=cutoff)closeRecent++;}
    return {novelty:Math.max(12,Math.round(100-highest*88)),saturationPenalty:Math.min(24,closeRecent*6)};
  }catch{return {novelty:75,saturationPenalty:0};}
}

export async function researchForPublication(keyword:string,audience="smart-generalist",freshnessHours=48):Promise<PublicationResearch>{
  const request:BriefRequest={subject:keyword,depth:"research",perspective:audience==="investor"?"investor":audience==="executive"?"executive":audience==="developer"?"developer":audience==="student"?"student":audience==="marketer"?"marketer":"general",sourcePolicy:"verified",freshnessRequirement:freshnessHours<=72?"recent":"current",format:"web"};
  const graph=await researchSubject(request);const competition=await libraryCompetition(graph.canonicalSubject||keyword);const opportunity=scoreOpportunity(graph,competition.novelty,82,competition.saturationPenalty);
  return {graph,opportunity,primarySourceCount:primarySourceCount(graph),independentFamilies:sourceFamilies(graph),saturationPenalty:competition.saturationPenalty};
}

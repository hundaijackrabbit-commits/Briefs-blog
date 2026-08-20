import { db } from "@/lib/db";
import { researchSubject } from "@/lib/research/research-engine";
import type { ResearchEventAnchor,ResearchGraph,ResearchSubjectAlignment } from "@/lib/research/types";
import type { BriefRequest } from "@/lib/types";
import type { PublicationResearch } from "@/lib/publication/types";
import { primarySourceCount, scoreOpportunity, sourceFamilies } from "@/lib/publication/scoring";
import { alignmentQueryVariants,anchorPreservingQuery,buildEventAnchor } from "@/lib/publication/event-identity";
import { applyResearchAlignment,evaluateResearchAlignment } from "@/lib/publication/subject-alignment";
import { betterAlignment,mergeResearchGraphs } from "@/lib/publication/alignment-repair-union";

function normalizedWords(text: string) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(x => x.length > 2));
}
function titleSimilarity(a:string,b:string){const A=normalizedWords(a),B=normalizedWords(b);if(!A.size||!B.size)return 0;let common=0;for(const word of A)if(B.has(word))common++;return common/Math.max(A.size,B.size);}

async function libraryCompetition(subject:string){
  if(!process.env.DATABASE_URL)return {novelty:82,saturationPenalty:0};
  try{
    const sql=db();const rows=await sql`select title,primary_keyword,published_at,created_at from publication_articles where status in ('review','published') order by created_at desc limit 400`;
    let highest=0;let closeRecent=0;const cutoff=Date.now()-30*86400000;
    for(const row of rows as unknown as Array<{title:string;primary_keyword:string;published_at:string|null;created_at:string}>){const sim=titleSimilarity(subject,`${row.title} ${row.primary_keyword}`);highest=Math.max(highest,sim);const when=Date.parse(row.published_at||row.created_at);if(sim>.42&&when>=cutoff)closeRecent++;}
    return {novelty:Math.max(12,Math.round(100-highest*88)),saturationPenalty:Math.min(24,closeRecent*6)};
  }catch{return {novelty:75,saturationPenalty:0};}
}

type PublicationResearchOptions={
  selectedSubject?:string;
  anchorTitles?:string[];
  eventAnchor?:ResearchEventAnchor;
  clusterCoherence?:number;
};

function requestFor(subject:string,audience:string,freshnessHours:number):BriefRequest{
  return {subject,depth:"research",perspective:audience==="investor"?"investor":audience==="executive"?"executive":audience==="developer"?"developer":audience==="student"?"student":audience==="marketer"?"marketer":"general",sourcePolicy:"verified",freshnessRequirement:freshnessHours<=72?"recent":"current",format:"web"};
}

async function alignedPublicationGraph(keyword:string,audience:string,freshnessHours:number,options:PublicationResearchOptions){
  const selectedSubject=String(options.selectedSubject||"").trim();
  if(!selectedSubject)return {graph:await researchSubject(requestFor(keyword,audience,freshnessHours)),alignment:undefined as ResearchSubjectAlignment|undefined};

  const anchor=options.eventAnchor||buildEventAnchor(selectedSubject,[selectedSubject,...(options.anchorTitles||[])],null);
  const initialQuery=anchorPreservingQuery(keyword,anchor);
  const attempted=[initialQuery];
  const initialGraph=await researchSubject(requestFor(initialQuery,audience,freshnessHours));
  let bestGraph:ResearchGraph=initialGraph;
  let bestAlignment=evaluateResearchAlignment({graph:initialGraph,anchor,selectedSubject,queries:attempted,clusterCoherence:options.clusterCoherence,repaired:false});

  if(!bestAlignment.passed){
    const variants=alignmentQueryVariants(anchor,keyword).filter(query=>query.toLowerCase()!==initialQuery.toLowerCase()).slice(0,2);
    attempted.push(...variants);
    const repairs=await Promise.all(variants.map(async query=>{
      const graph=await researchSubject(requestFor(query,audience,freshnessHours));
      const alignment=evaluateResearchAlignment({graph,anchor,selectedSubject,queries:attempted,clusterCoherence:options.clusterCoherence,repaired:true});
      return {graph,alignment};
    }));

    let best={graph:bestGraph,alignment:bestAlignment};
    for(const repair of repairs)best=betterAlignment(best,repair);

    if(repairs.length){
      const mergedGraph=mergeResearchGraphs([initialGraph,...repairs.map(repair=>repair.graph)],selectedSubject);
      const mergedAlignment=evaluateResearchAlignment({graph:mergedGraph,anchor,selectedSubject,queries:attempted,clusterCoherence:options.clusterCoherence,repaired:true});
      best=betterAlignment(best,{graph:mergedGraph,alignment:mergedAlignment});
    }

    bestGraph=best.graph;
    bestAlignment=best.alignment;
  }

  bestAlignment={...bestAlignment,queries:[...new Set(attempted)],repaired:bestGraph!==initialGraph};
  return {graph:applyResearchAlignment(bestGraph,bestAlignment),alignment:bestAlignment};
}

export async function researchForPublication(keyword:string,audience="smart-generalist",freshnessHours=48,options:PublicationResearchOptions={}):Promise<PublicationResearch>{
  const aligned=await alignedPublicationGraph(keyword,audience,freshnessHours,options);
  const graph=aligned.graph;
  const competition=await libraryCompetition(options.selectedSubject||graph.canonicalSubject||keyword);
  const opportunity=scoreOpportunity(graph,competition.novelty,82,competition.saturationPenalty);
  return {graph,opportunity,primarySourceCount:primarySourceCount(graph),independentFamilies:sourceFamilies(graph),saturationPenalty:competition.saturationPenalty};
}

import { fetchJson,stableResearchId } from "@/lib/research/http";
import type { ResearchFinding,ResearchProvider,ResearchQueryPlan,ResearchSource } from "@/lib/research/types";

type OpenAlexWork={id?:string;doi?:string|null;display_name?:string;publication_year?:number|null;publication_date?:string|null;cited_by_count?:number;abstract_inverted_index?:Record<string,number[]>|null;primary_location?:{source?:{id?:string;display_name?:string}|null;landing_page_url?:string|null}|null};
type OpenAlexResponse={results?:OpenAlexWork[]};
function abstractFromIndex(index?:Record<string,number[]>|null){
  if(!index)return "";const words:Array<[number,string]>=[];for(const [word,positions] of Object.entries(index))for(const pos of positions)words.push([pos,word]);return words.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(" ");
}
function sentences(text:string){return text.replace(/\s+/g," ").trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(s=>s.length>45&&s.length<520);}

export const openAlexProvider:ResearchProvider={
  id:"openalex",
  async research(subject:string,plan:ResearchQueryPlan){
    const url=`https://api.openalex.org/works?search=${encodeURIComponent(subject)}&per-page=${Math.min(6,Math.max(3,plan.maxSources))}`;
    const data=await fetchJson<OpenAlexResponse>(url,6500);const retrievedAt=new Date().toISOString();
    const findings:ResearchFinding[]=[];const sources:ResearchSource[]=[];
    for(const work of data.results||[]){
      const title=work.display_name?.trim();if(!title||!work.id)continue;
      const landing=work.doi||work.primary_location?.landing_page_url||work.id;
      const sourceId=stableResearchId("oa",landing);
      const venue=work.primary_location?.source?.display_name||"OpenAlex indexed research";
      const family=work.primary_location?.source?.id||work.doi||work.id;
      const abstract=abstractFromIndex(work.abstract_inverted_index);
      const excerpt=(abstract||`${title}${work.publication_year?` (${work.publication_year})`:""}.`).slice(0,1400);
      sources.push({id:sourceId,provider:"openalex",name:venue,title,url:landing,tier:"B",kind:"specialist",retrievedAt,publishedAt:work.publication_date||null,excerpt,authority:72,independenceFamily:`scholarly:${family}`,metadata:{openAlexId:work.id,citedBy:work.cited_by_count||0}});
      const lead=sentences(abstract)[0];
      const statement=lead||`${title}${work.publication_year?` was published in ${work.publication_year}`:""}.`;
      findings.push({id:stableResearchId("oaf",`${work.id}:${statement}`),subject,predicate:"Research evidence",valueText:statement,statement,sourceIds:[sourceId],confidence:lead?"medium":"low",verificationStatus:"reported"});
      if(findings.length>=plan.maxSources)break;
    }
    return {canonicalSubject:subject,description:findings.slice(0,3).map(f=>f.statement).join(" ")||undefined,findings,sources,discoveredUrls:sources.map(s=>s.url)};
  }
};

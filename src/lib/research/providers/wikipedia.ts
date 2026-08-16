import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { ResearchProvider, ResearchQueryPlan, ResearchFinding, ResearchSource } from "@/lib/research/types";

type SearchResponse={query?:{search?:Array<{title:string;pageid:number}>}};
type PageResponse={query?:{pages?:Record<string,{pageid:number;title:string;extract?:string;fullurl?:string;touched?:string;extlinks?:Array<{"*":string}>}>}};

function sentences(text:string){
  return text.replace(/\s+/g," ").trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(s=>s.trim()).filter(s=>s.length>35&&s.length<520);
}

export const wikipediaProvider:ResearchProvider={
  id:"wikipedia",
  async research(subject:string,plan:ResearchQueryPlan){
    const searchUrl=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(subject)}&srlimit=3&format=json&origin=*`;
    const search=await fetchJson<SearchResponse>(searchUrl);
    const match=search.query?.search?.[0];
    if(!match) return {findings:[],sources:[]};
    const pageUrl=`https://en.wikipedia.org/w/api.php?action=query&prop=extracts%7Cinfo%7Cextlinks&exintro=1&explaintext=1&inprop=url&ellimit=40&pageids=${match.pageid}&format=json&origin=*`;
    const pageData=await fetchJson<PageResponse>(pageUrl);
    const page=pageData.query?.pages?.[String(match.pageid)];
    if(!page?.extract) return {findings:[],sources:[]};
    const retrievedAt=new Date().toISOString();
    const canonicalUrl=page.fullurl||`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g,"_"))}`;
    const sourceId=stableResearchId("wiki",canonicalUrl);
    const source:ResearchSource={id:sourceId,provider:"wikipedia",name:"Wikipedia",title:page.title,url:canonicalUrl,tier:"B",kind:"reference",retrievedAt,publishedAt:page.touched||null,excerpt:page.extract.slice(0,1400),authority:62,independenceFamily:"wikimedia",metadata:{pageid:page.pageid,touched:page.touched||null}};
    const max=plan.maxSources>7?8:5;
    const findings:ResearchFinding[]=sentences(page.extract).slice(0,max).map((statement,index)=>({
      id:stableResearchId("wf",`${page.pageid}:${index}:${statement}`),subject:page.title,predicate:index===0?"Overview":`Context ${index+1}`,valueText:statement,statement,sourceIds:[sourceId],confidence:"medium",verificationStatus:"reported"
    }));
    const discoveredUrls=(page.extlinks||[]).map(link=>link["*"]).filter(Boolean).slice(0,30);
    return {canonicalSubject:page.title,description:findings.map(f=>f.statement).slice(0,plan.intent==="compare"?2:4).join(" "),findings,sources:[source],discoveredUrls};
  }
};

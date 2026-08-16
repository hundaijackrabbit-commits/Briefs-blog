import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { ResearchFinding, ResearchSource } from "@/lib/research/types";

type GdeltArticle={url?:string;url_mobile?:string;title?:string;seendate?:string;domain?:string;language?:string;sourcecountry?:string};
type GdeltResponse={articles?:GdeltArticle[]};

function hostFamily(raw:string){try{return new URL(raw).hostname.replace(/^www\./,"");}catch{return "gdelt";}}
function tierFor(host:string):"B"|"C"{return /(^|\.)(reuters\.com|apnews\.com|bbc\.(com|co\.uk)|cbc\.ca|bloomberg\.com|ft\.com|wsj\.com|nytimes\.com|washingtonpost\.com|theguardian\.com|economist\.com|cnbc\.com|npr\.org|abcnews\.go\.com|cbsnews\.com|nbcnews\.com|politico\.com|theverge\.com|arstechnica\.com|wired\.com|techcrunch\.com|fortune\.com)$/i.test(host)?"B":"C";}
function seenIso(value?:string){
  if(!value) return null;
  const m=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m?`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`:value;
}

export async function researchRecentNews(query:string,max=6):Promise<{findings:ResearchFinding[];sources:ResearchSource[]}>{
  const phrase=query.replace(/["()]/g," ").replace(/\s+/g," ").trim().slice(0,120);
  if(!phrase) return {findings:[],sources:[]};
  const url=`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`\"${phrase}\"`)}&mode=artlist&maxrecords=${Math.min(20,Math.max(max*2,8))}&format=json&sort=datedesc&timespan=14d`;
  const data=await fetchJson<GdeltResponse>(url,7000);
  const retrievedAt=new Date().toISOString();
  const seen=new Set<string>(); const findings:ResearchFinding[]=[]; const sources:ResearchSource[]=[];
  for(const article of data.articles||[]){
    const articleUrl=article.url||article.url_mobile; const title=article.title?.replace(/\s+/g," ").trim();
    if(!articleUrl||!title||seen.has(articleUrl)) continue;
    seen.add(articleUrl);
    const family=hostFamily(articleUrl); const publishedAt=seenIso(article.seendate);
    const sourceId=stableResearchId("news",articleUrl);
    sources.push({id:sourceId,provider:"external",name:article.domain||family,title,url:articleUrl,tier:tierFor(family),kind:"reporting",retrievedAt,publishedAt,excerpt:title,authority:tierFor(family)==="B"?78:52,independenceFamily:family,metadata:{discoveredBy:"gdelt",language:article.language||null,sourceCountry:article.sourcecountry||null}});
    findings.push({id:stableResearchId("newsf",`${articleUrl}:${title}`),subject:phrase,predicate:"Recent reporting",valueText:title,statement:title,sourceIds:[sourceId],confidence:"medium",verificationStatus:"reported"});
    if(findings.length>=max) break;
  }
  return {findings,sources};
}


export const gdeltProvider={
  id:"gdelt",
  async research(subject:string,plan:import("@/lib/research/types").ResearchQueryPlan){
    const result=await researchRecentNews(subject,plan.maxSources);
    return {canonicalSubject:subject,description:result.findings.length?`Recent reporting on ${subject}: ${result.findings.slice(0,3).map(f=>f.valueText).join(" · ")}`:undefined,findings:result.findings,sources:result.sources,discoveredUrls:result.sources.map(s=>s.url)};
  }
} satisfies import("@/lib/research/types").ResearchProvider;

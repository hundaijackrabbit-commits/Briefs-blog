import { stableResearchId } from "@/lib/research/http";
import type { ResearchFinding,ResearchSource } from "@/lib/research/types";
import { rankDiscoveredUrl } from "@/lib/research/rank";

function safeUrl(raw:string){
  try{const u=new URL(raw);if(!["https:","http:"].includes(u.protocol))return null;const h=u.hostname.toLowerCase();if(h==="localhost"||h.endsWith(".local")||/^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)||h==="0.0.0.0"||h==="::1")return null;return u;}catch{return null;}
}
function strip(html:string){return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();}
function description(html:string){const m=html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);return m?.[1]?.trim()||"";}
function title(html:string){const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return m?strip(m[1]).slice(0,220):"External source";}

export async function researchDiscoveredPages(subject:string,urls:string[],max=3):Promise<{findings:ResearchFinding[];sources:ResearchSource[]}>{
  const ranked=[...new Set(urls)].map(raw=>({raw,score:rankDiscoveredUrl(raw)})).filter(x=>x.score>=55).sort((a,b)=>b.score-a.score).slice(0,max*2);
  const findings:ResearchFinding[]=[];const sources:ResearchSource[]=[];
  for(const item of ranked){
    if(sources.length>=max)break;const u=safeUrl(item.raw);if(!u)continue;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4200);
    try{
      const res=await fetch(u,{signal:controller.signal,headers:{accept:"text/html,application/xhtml+xml","user-agent":process.env.BRIEFS_USER_AGENT||"BriefsBlog/1.0 (+https://briefs.blog)"},redirect:"manual",cache:"no-store"});
      const type=res.headers.get("content-type")||"";if(!res.ok||!type.includes("text/html"))continue;
      const html=(await res.text()).slice(0,250000);const desc=description(html);const text=desc||strip(html).slice(0,1200);if(text.length<45)continue;
      const final=new URL(res.url);const sourceId=stableResearchId("web",res.url);const authority=Math.max(50,Math.min(88,item.score));
      sources.push({id:sourceId,provider:"external",name:final.hostname.replace(/^www\./,""),title:title(html),url:res.url,tier:authority>=75?"B":"C",kind:"specialist",retrievedAt:new Date().toISOString(),excerpt:text.slice(0,1400),authority,independenceFamily:final.hostname.replace(/^www\./,""),metadata:{discovered:true}});
      const statement=text.split(/(?<=[.!?])\s+/).find(s=>s.length>45&&s.length<520)||text.slice(0,420);
      findings.push({id:stableResearchId("webf",`${res.url}:${statement}`),subject,predicate:"External context",valueText:statement,statement,sourceIds:[sourceId],confidence:"medium",verificationStatus:"reported"});
    }catch{}finally{clearTimeout(timer);}
  }
  return {findings,sources};
}

import { stableResearchId } from "@/lib/research/http";
import type { ResearchFinding, ResearchSource } from "@/lib/research/types";

function decodeXml(value:string){
  const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'"};
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&#x([0-9a-f]+);/gi,(_,hex)=>{try{return String.fromCodePoint(parseInt(hex,16));}catch{return "";}})
    .replace(/&#(\d+);/g,(_,num)=>{try{return String.fromCodePoint(parseInt(num,10));}catch{return "";}})
    .replace(/&(amp|lt|gt|quot|apos);/g,(_,name)=>named[name]||_);
}
function tagValue(block:string,tag:string){
  const match=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,"i"));
  return match?decodeXml(match[1]).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim():"";
}
function sourceInfo(block:string){
  const match=block.match(/<source\b([^>]*)>([\s\S]*?)<\/source>/i);
  if(!match)return {name:"",url:""};
  const urlMatch=match[1].match(/\burl=["']([^"']+)["']/i);
  return {name:decodeXml(match[2]).replace(/<[^>]+>/g," ").trim(),url:urlMatch?decodeXml(urlMatch[1]):""};
}
function cleanTitle(value:string){return value.replace(/\s+[|–—-]\s+[^|–—-]{2,45}$/," ").replace(/\s+/g," ").trim();}
function safeDomain(value:string){if(!value)return "";try{return new URL(value).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}}
function publishedIso(value:string){const ms=Date.parse(value);return Number.isFinite(ms)?new Date(ms).toISOString():null;}

const PRIMARY=/(^|\.)(who\.int|un\.org|worldbank\.org|imf\.org|oecd\.org|ecb\.europa\.eu|europa\.eu|nato\.int|cdc\.gov|fda\.gov|nih\.gov|whitehouse\.gov|congress\.gov|supremecourt\.gov|gov\.uk|canada\.ca)$/i;
const HIGH_AUTHORITY=/(^|\.)(reuters\.com|apnews\.com|bbc\.(com|co\.uk)|afp\.com|aljazeera\.com|bloomberg\.com|ft\.com|wsj\.com|nytimes\.com|washingtonpost\.com|theguardian\.com|economist\.com|npr\.org|cbc\.ca|abcnews\.go\.com|cbsnews\.com|nbcnews\.com|cnn\.com|cnbc\.com|politico\.com|dw\.com|france24\.com|scmp\.com|nikkei\.com|straitstimes\.com|thehindu\.com|timesofindia\.indiatimes\.com|abc\.net\.au|smh\.com\.au|theage\.com\.au|rnz\.co\.nz)$/i;

function tierFor(domain:string):"A"|"B"|"C"{return PRIMARY.test(domain)?"A":HIGH_AUTHORITY.test(domain)?"B":"C";}
function kindFor(domain:string):ResearchSource["kind"]{return PRIMARY.test(domain)?"primary":"reporting";}
function authorityFor(domain:string){return PRIMARY.test(domain)?94:HIGH_AUTHORITY.test(domain)?82:56;}

export async function researchGoogleNews(query:string,max=8):Promise<{findings:ResearchFinding[];sources:ResearchSource[]}>{
  const phrase=query.replace(/[()"']/g," ").replace(/\s+/g," ").trim().slice(0,160);
  if(!phrase)return {findings:[],sources:[]};

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5500);
  try{
    const url=`https://news.google.com/rss/search?q=${encodeURIComponent(`${phrase} when:7d`)}&hl=en-US&gl=US&ceid=US:en`;
    const res=await fetch(url,{
      signal:controller.signal,
      headers:{
        accept:"application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "user-agent":process.env.BRIEFS_USER_AGENT||"BriefsBlog/1.0 (+https://briefs.blog)"
      },
      cache:"no-store"
    });
    if(!res.ok)throw new Error(`HTTP ${res.status} from news.google.com`);
    const xml=await res.text();
    const items=xml.match(/<item\b[\s\S]*?<\/item>/gi)||[];
    const retrievedAt=new Date().toISOString();
    const findings:ResearchFinding[]=[];
    const sources:ResearchSource[]=[];
    const seenFamilies=new Set<string>();
    const seenLinks=new Set<string>();

    // Prefer source-family diversity over many headlines from the same publisher.
    const parsed=items.map(item=>{
      const rawTitle=tagValue(item,"title");
      const title=cleanTitle(rawTitle);
      const link=tagValue(item,"link");
      const source=sourceInfo(item);
      const family=safeDomain(source.url)||safeDomain(link)||"news.google.com";
      return {title,link,source,family,publishedAt:publishedIso(tagValue(item,"pubDate"))};
    }).filter(item=>item.link&&item.title.length>=18);

    const ordered=[...parsed].sort((a,b)=>{
      const ta=tierFor(a.family),tb=tierFor(b.family);
      const weight=(t:string)=>t==="A"?3:t==="B"?2:1;
      return weight(tb)-weight(ta);
    });

    for(const item of ordered){
      if(sources.length>=Math.max(3,max))break;
      if(seenLinks.has(item.link))continue;
      // First pass favors independent families; after three families, allow extras.
      if(seenFamilies.has(item.family)&&seenFamilies.size<3)continue;
      seenLinks.add(item.link);seenFamilies.add(item.family);

      const sourceId=stableResearchId("gnews",`${item.family}:${item.link}`);
      const tier=tierFor(item.family);
      sources.push({
        id:sourceId,
        provider:"external",
        name:item.source.name||item.family,
        title:item.title,
        url:item.link,
        tier,
        kind:kindFor(item.family),
        retrievedAt,
        publishedAt:item.publishedAt,
        excerpt:item.title,
        authority:authorityFor(item.family),
        independenceFamily:item.family,
        metadata:{discoveredBy:"google-news-rss",publisherUrl:item.source.url||null,publisherDomain:item.family}
      });
      findings.push({
        id:stableResearchId("gnewsf",`${item.family}:${item.title}`),
        subject:phrase,
        predicate:"Recent reporting",
        valueText:item.title,
        statement:item.title,
        sourceIds:[sourceId],
        confidence:tier==="A"?"high":tier==="B"?"medium":"low",
        verificationStatus:tier==="A"?"confirmed":"reported"
      });
    }
    return {findings,sources};
  }finally{clearTimeout(timer);}
}

export const googleNewsProvider={
  id:"google-news-rss",
  async research(subject:string,plan:import("@/lib/research/types").ResearchQueryPlan){
    const result=await researchGoogleNews(subject,Math.max(6,plan.maxSources));
    return {
      canonicalSubject:subject,
      description:result.findings.length?`Recent reporting is available from ${new Set(result.sources.map(s=>s.independenceFamily)).size} independent source families.`:undefined,
      findings:result.findings,
      sources:result.sources,
      discoveredUrls:result.sources.map(s=>s.url)
    };
  }
} satisfies import("@/lib/research/types").ResearchProvider;

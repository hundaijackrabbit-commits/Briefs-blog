import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { GlobalArticleSeed,GlobalCategory,GlobalEventCandidate,GlobalRegion } from "@/lib/publication/global-types";

// Discovery sources are signals only. They may propose events, but never establish facts by themselves.
type GdeltArticle={url?:string;title?:string;seendate?:string;domain?:string;sourcecountry?:string};
type GdeltResponse={articles?:GdeltArticle[]};

const CATEGORY_QUERIES:Array<{category:GlobalCategory;query:string}>=[
  {category:"World",query:"(war OR ceasefire OR invasion OR sanctions OR election OR protest OR coup OR diplomacy)"},
  {category:"Business",query:"(economy OR trade OR tariff OR company OR merger OR bankruptcy OR supply chain)"},
  {category:"Markets",query:"(inflation OR interest rates OR central bank OR oil OR currency OR stocks OR bonds)"},
  {category:"Technology",query:"(artificial intelligence OR semiconductor OR cyberattack OR technology OR software)"},
  {category:"Science",query:"(climate OR earthquake OR wildfire OR hurricane OR outbreak OR disease OR research OR space)"},
  {category:"Policy",query:"(law OR regulation OR parliament OR government OR court OR treaty OR legislation)"},
  {category:"Culture",query:"(culture OR media OR entertainment OR social movement OR education OR religion)"},
  // Regional sweeps reduce the chance that English-language North American attention defines the whole candidate set.
  {category:"World",query:"(Africa OR Nigeria OR Sudan OR Ethiopia OR Kenya OR Congo OR South Africa OR Sahel)"},
  {category:"World",query:"(Middle East OR Israel OR Gaza OR Iran OR Iraq OR Syria OR Lebanon OR Saudi Arabia OR Yemen)"},
  {category:"World",query:"(India OR Pakistan OR Bangladesh OR Sri Lanka OR Nepal OR Afghanistan)"},
  {category:"World",query:"(China OR Japan OR Korea OR Taiwan OR Hong Kong OR Mongolia)"},
  {category:"World",query:"(Indonesia OR Philippines OR Vietnam OR Thailand OR Malaysia OR Singapore OR Myanmar)"},
  {category:"World",query:"(Brazil OR Argentina OR Chile OR Colombia OR Venezuela OR Peru OR Ecuador OR Haiti)"},
  {category:"World",query:"(Europe OR Ukraine OR Russia OR Germany OR France OR Britain OR Poland OR Turkey)"},
  {category:"World",query:"(Australia OR New Zealand OR Papua New Guinea OR Fiji OR Pacific Islands)"}
];

const RSS_QUERIES:Array<{category:GlobalCategory;query:string}>=[
  {category:"World",query:"war OR ceasefire OR invasion OR sanctions OR election OR diplomacy"},
  {category:"Business",query:"economy OR trade OR tariff OR merger OR bankruptcy OR supply chain"},
  {category:"Markets",query:"inflation OR interest rates OR central bank OR oil OR currency OR markets"},
  {category:"Technology",query:"artificial intelligence OR semiconductor OR cyberattack OR technology"},
  {category:"Science",query:"climate OR earthquake OR wildfire OR hurricane OR outbreak OR space"},
  {category:"Policy",query:"law OR regulation OR government OR court OR treaty OR legislation"},
  {category:"Culture",query:"culture OR media OR education OR religion OR social movement"},
  {category:"World",query:"Africa OR Sudan OR Nigeria OR Ethiopia OR Congo OR Sahel"},
  {category:"World",query:"Middle East OR Israel OR Gaza OR Iran OR Syria OR Lebanon OR Yemen"},
  {category:"World",query:"India OR Pakistan OR Bangladesh OR Afghanistan OR South Asia"},
  {category:"World",query:"China OR Japan OR Korea OR Taiwan OR East Asia"},
  {category:"World",query:"Brazil OR Argentina OR Colombia OR Venezuela OR Latin America"},
  {category:"World",query:"Ukraine OR Russia OR Europe OR European Union"},
  {category:"World",query:"Australia OR New Zealand OR Pacific Islands"}
];

const STOP=new Set("the a an and or but for with from into over after before amid as at by to of in on is are was were be been being it its this that these those new latest update says say said report reports world global today yesterday tomorrow live more most less than about amid could would should will may might has have had not no yes their his her our your who what why how when where which one two three first last major key top".split(" "));
const GENERIC=new Set("news breaking update updates report reports says said latest world global live today analysis exclusive video watch".split(" "));
const CLUSTER_SIMILARITY_THRESHOLD=.40;
const CLUSTER_SOFT_THRESHOLD=.31;
const GDELT_CONCURRENCY=5;
const RSS_CONCURRENCY=5;

const REGION_TERMS:Record<GlobalRegion,string[]>={
  "North America":["united states","u.s.","us ","america","canada","mexico","washington","ottawa"],
  "Latin America":["brazil","argentina","chile","colombia","venezuela","peru","ecuador","bolivia","uruguay","paraguay","cuba","haiti","guatemala","panama","latin america"],
  "Europe":["europe","european union","eu ","ukraine","russia","britain","united kingdom","france","germany","italy","spain","poland","romania","netherlands","belgium","sweden","norway","finland","denmark","greece","turkey","brussels","moscow","kyiv"],
  "Africa":["africa","nigeria","ethiopia","sudan","south africa","kenya","egypt","morocco","algeria","tunisia","libya","congo","somalia","sahel","ghana","uganda","tanzania","rwanda","zimbabwe","zambia","mozambique"],
  "Middle East":["middle east","israel","gaza","palestinian","iran","iraq","syria","lebanon","jordan","saudi","yemen","qatar","uae","emirates","oman","bahrain","kuwait"],
  "South Asia":["india","pakistan","bangladesh","sri lanka","nepal","bhutan","maldives","afghanistan","south asia","delhi","islamabad","dhaka"],
  "East Asia":["china","chinese","japan","japanese","korea","taiwan","hong kong","mongolia","beijing","tokyo","seoul"],
  "Southeast Asia":["indonesia","philippines","vietnam","thailand","malaysia","singapore","myanmar","cambodia","laos","brunei","timor","southeast asia"],
  "Oceania":["australia","new zealand","papua new guinea","fiji","samoa","tonga","oceania","pacific islands"],
  "Global":["global","worldwide","international","united nations","u.n.","who ","imf","world bank","g20","g7"]
};

function iso(value?:string){if(!value)return null;const m=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);return m?`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`:value;}
function cleanTitle(value:string){return value.replace(/\s+[|–—-]\s+[^|–—-]{2,45}$/," ").replace(/\s+/g," ").trim();}
function tokens(value:string){return cleanTitle(value).toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(t=>t.length>2&&!STOP.has(t)&&!GENERIC.has(t));}
function tokenSet(value:string){return new Set(tokens(value));}
function sharedTokens(a:string,b:string){const A=tokenSet(a),B=tokenSet(b);let common=0;for(const word of A)if(B.has(word))common++;return common;}
function similarity(a:string,b:string){const A=tokenSet(a),B=tokenSet(b);if(!A.size||!B.size)return 0;let common=0;for(const word of A)if(B.has(word))common++;return common/Math.max(1,Math.min(A.size,B.size));}
function regionHints(title:string,country:string|null){const hay=` ${title.toLowerCase()} ${(country||"").toLowerCase()} `;const out:GlobalRegion[]=[];for(const [region,terms] of Object.entries(REGION_TERMS) as Array<[GlobalRegion,string[]]>){if(terms.some(term=>hay.includes(term)))out.push(region);}return out.length?out:(["Global"] as GlobalRegion[]);}
function phraseCandidates(title:string){const raw=cleanTitle(title).toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean);const useful=raw.map((word,index)=>({word,index})).filter(x=>x.word.length>2&&!STOP.has(x.word)&&!GENERIC.has(x.word));const out:string[]=[];for(let n=4;n>=2;n--){for(let i=0;i<=raw.length-n;i++){const slice=raw.slice(i,i+n);if(slice.filter(w=>!STOP.has(w)&&!GENERIC.has(w)&&w.length>2).length>=Math.max(2,n-1))out.push(slice.join(" "));}}for(const item of useful)out.push(item.word);return out;}
function bestResearchPhrase(titles:string[]){const counts=new Map<string,number>();for(const title of titles){for(const phrase of new Set(phraseCandidates(title)))counts.set(phrase,(counts.get(phrase)||0)+1);}const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0].split(" ").length-a[0].split(" ").length||b[0].length-a[0].length);const repeated=ranked.find(([phrase,count])=>count>=2&&phrase.split(" ").length>=2);if(repeated)return repeated[0];const top=tokens(titles[0]||"").slice(0,5).join(" ");return top||cleanTitle(titles[0]||"").slice(0,100);}
function eventSignature(titles:string[]){const frequency=new Map<string,number>();for(const title of titles){for(const token of new Set(tokens(title)))frequency.set(token,(frequency.get(token)||0)+1);}const sig=[...frequency.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6).map(([word])=>word).sort().join("|");return sig||titles[0]||"world-event";}
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
function safeDomain(value:string){
  if(!value)return "";
  try{return new URL(value).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}
}
function rssDate(value:string){
  if(!value)return null;
  const time=Date.parse(value);
  return Number.isFinite(time)?new Date(time).toISOString():null;
}

async function queryCategory(category:GlobalCategory,query:string):Promise<GlobalArticleSeed[]>{
  const url=`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=30&format=json&sort=datedesc&timespan=1d`;
  const data=await fetchJson<GdeltResponse>(url,4500);
  const out:GlobalArticleSeed[]=[];const seen=new Set<string>();
  for(const article of data.articles||[]){const rawUrl=String(article.url||"");const title=cleanTitle(String(article.title||""));if(!rawUrl||title.length<18||seen.has(rawUrl))continue;seen.add(rawUrl);let domain=String(article.domain||"");if(!domain){try{domain=new URL(rawUrl).hostname.replace(/^www\./,"");}catch{domain="unknown";}}const country=article.sourcecountry?String(article.sourcecountry):null;out.push({url:rawUrl,title,domain,sourceCountry:country,publishedAt:iso(article.seendate),category,regionHints:regionHints(title,country)});}
  return out;
}

async function queryGoogleNews(category:GlobalCategory,query:string):Promise<GlobalArticleSeed[]>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5500);
  try{
    const q=`(${query}) when:1d`;
    const url=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const res=await fetch(url,{signal:controller.signal,headers:{
      accept:"application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "user-agent":process.env.BRIEFS_USER_AGENT||"BriefsBlog/1.0 (+https://briefs.blog)"
    },cache:"no-store"});
    if(!res.ok)throw new Error(`HTTP ${res.status} from news.google.com`);
    const xml=await res.text();
    const items=xml.match(/<item\b[\s\S]*?<\/item>/gi)||[];
    const out:GlobalArticleSeed[]=[];const seen=new Set<string>();
    for(const item of items.slice(0,35)){
      const rawTitle=tagValue(item,"title");
      const title=cleanTitle(rawTitle);
      const link=tagValue(item,"link");
      const publishedAt=rssDate(tagValue(item,"pubDate"));
      const source=sourceInfo(item);
      const domain=safeDomain(source.url)||safeDomain(link)||"news.google.com";
      if(!link||title.length<18||seen.has(link))continue;
      seen.add(link);
      out.push({url:link,title,domain,sourceCountry:null,publishedAt,category,regionHints:regionHints(title,null)});
    }
    return out;
  }finally{clearTimeout(timer);}
}

function shouldMerge(seed:GlobalArticleSeed,existing:GlobalArticleSeed){
  const sim=similarity(seed.title,existing.title);
  if(sim>=CLUSTER_SIMILARITY_THRESHOLD)return true;
  return seed.category===existing.category&&sim>=CLUSTER_SOFT_THRESHOLD&&sharedTokens(seed.title,existing.title)>=2;
}

function clusterSeeds(seeds:GlobalArticleSeed[]):GlobalEventCandidate[]{
  const clusters:Array<{seeds:GlobalArticleSeed[];category:GlobalCategory}>=[];
  const ordered=[...seeds].sort((a,b)=>Date.parse(b.publishedAt||"")-Date.parse(a.publishedAt||""));
  for(const seed of ordered){let best=-1,bestSim=0;for(let i=0;i<clusters.length;i++){for(const existing of clusters[i].seeds.slice(0,6)){if(!shouldMerge(seed,existing))continue;const sim=similarity(seed.title,existing.title);if(sim>bestSim){bestSim=sim;best=i;}}}if(best>=0)clusters[best].seeds.push(seed);else clusters.push({seeds:[seed],category:seed.category});}
  return clusters.map(cluster=>{const titles=[...new Set(cluster.seeds.map(s=>s.title))];const urls=[...new Set(cluster.seeds.map(s=>s.url))];const domains=[...new Set(cluster.seeds.map(s=>s.domain))];const countries=[...new Set(cluster.seeds.map(s=>s.sourceCountry).filter((v):v is string=>Boolean(v)))];const regions:GlobalRegion[]=[...new Set<GlobalRegion>(cluster.seeds.flatMap(s=>s.regionHints))];const categoryCounts=new Map<GlobalCategory,number>();for(const seed of cluster.seeds)categoryCounts.set(seed.category,(categoryCounts.get(seed.category)||0)+1);const category=[...categoryCounts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||cluster.category;const newest=cluster.seeds.map(s=>s.publishedAt).filter((v):v is string=>Boolean(v)).sort().at(-1)||null;const researchQuery=bestResearchPhrase(titles);return {eventKey:stableResearchId("world",eventSignature(titles)),subject:titles[0],researchQuery,category,titles:titles.slice(0,12),urls:urls.slice(0,30),domains:domains.slice(0,30),sourceCountries:countries.slice(0,30),regions:regions.length?regions:(["Global"] as GlobalRegion[]),mentionCount:urls.length,newestAt:newest};}).sort((a,b)=>b.domains.length-a.domains.length||b.mentionCount-a.mentionCount).slice(0,120);
}

async function collectBatched(
  items:Array<{category:GlobalCategory;query:string}>,
  concurrency:number,
  runner:(category:GlobalCategory,query:string)=>Promise<GlobalArticleSeed[]>,
  label:string
){
  const successes:GlobalArticleSeed[][]=[];
  const failures:string[]=[];
  for(let i=0;i<items.length;i+=concurrency){
    const batch=items.slice(i,i+concurrency);
    const settled=await Promise.allSettled(batch.map(item=>runner(item.category,item.query)));
    settled.forEach((result,index)=>{
      if(result.status==="fulfilled")successes.push(result.value);
      else failures.push(`${batch[index].category}: ${result.reason instanceof Error?result.reason.message:String(result.reason)}`);
    });
  }
  return {label,seeds:successes.flat(),successes:successes.length,failures};
}

export async function discoverGlobalEvents():Promise<GlobalEventCandidate[]>{
  // Run independent discovery rails together. A slow or unavailable source cannot zero out the editorial desk.
  const [gdelt,rss]=await Promise.all([
    collectBatched(CATEGORY_QUERIES,GDELT_CONCURRENCY,queryCategory,"gdelt"),
    collectBatched(RSS_QUERIES,RSS_CONCURRENCY,queryGoogleNews,"google-news-rss")
  ]);

  const seeds=[...gdelt.seeds,...rss.seeds];
  const unique=new Map<string,GlobalArticleSeed>();
  for(const seed of seeds){
    const key=`${seed.domain}|${cleanTitle(seed.title).toLowerCase()}`;
    if(!unique.has(key))unique.set(key,seed);
  }
  const candidates=clusterSeeds([...unique.values()]);

  console.info(
    `[global-discovery] gdelt=${gdelt.successes}/${CATEGORY_QUERIES.length} gdeltFailed=${gdelt.failures.length} `+
    `rss=${rss.successes}/${RSS_QUERIES.length} rssFailed=${rss.failures.length} `+
    `seeds=${seeds.length} unique=${unique.size} candidates=${candidates.length}`
  );
  if(gdelt.failures.length)console.warn(`[global-discovery] gdelt failures: ${gdelt.failures.slice(0,4).join(" | ")}${gdelt.failures.length>4?` | +${gdelt.failures.length-4} more`:""}`);
  if(rss.failures.length)console.warn(`[global-discovery] rss failures: ${rss.failures.slice(0,4).join(" | ")}${rss.failures.length>4?` | +${rss.failures.length-4} more`:""}`);

  return candidates;
}

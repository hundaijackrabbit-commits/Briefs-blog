import type { ResearchEventAnchor } from "@/lib/research/types";

const STOP=new Set("the a an and or but for with from into over after before amid as at by to of in on is are was were be been being it its this that these those new latest update says say said report reports world global today yesterday tomorrow live more most less than about could would should will may might has have had not no yes their his her our your who what why how when where which one two three first last major key top inside easy miss recent reporting".split(" "));
const GENERIC=new Set("news breaking update updates report reports says said latest world global live today analysis exclusive video watch story detail connection development developments".split(" "));
const GEO_PHRASES=["middle east","north america","latin america","south asia","east asia","southeast asia","european union","united states","united kingdom","south africa","saudi arabia","new zealand","papua new guinea","pacific islands","africa","african","europe","european","asia","asian","china","chinese","japan","japanese","korea","korean","taiwan","india","indian","pakistan","pakistani","bangladesh","russia","russian","ukraine","ukrainian","israel","israeli","gaza","iran","iranian","iraq","iraqi","syria","syrian","lebanon","lebanese","yemen","saudi","qatar","uae","emirates","canada","canadian","mexico","mexican","brazil","brazilian","argentina","australia","australian"];
const GEO_TOKENS=new Set(GEO_PHRASES.flatMap(x=>x.split(" ")));

const ACTION_GROUPS:Record<string,string[]>={
  expand:["grow","growth","grows","grown","expand","expands","expanded","expansion","enter","enters","entered","entry","presence","acquire","acquires","acquired","acquisition","invest","invests","invested","investment"],
  conflict:["war","wars","conflict","conflicts","fighting","hostilities","battle","battles"],
  attack:["attack","attacks","attacked","strike","strikes","struck","bomb","bombs","bombed","missile","missiles","invade","invades","invaded","invasion"],
  ceasefire:["ceasefire","truce","halt","halts","pause","pauses"],
  sanction:["sanction","sanctions","sanctioned","embargo","tariff","tariffs"],
  elect:["election","elections","elect","elected","vote","votes","voting","ballot"],
  protest:["protest","protests","protested","demonstration","demonstrations"],
  regulate:["regulate","regulates","regulated","regulation","regulations","law","laws","legislation","ban","bans","banned","approve","approves","approved"],
  merge:["merge","merger","mergers","acquisition","acquisitions","takeover","takeovers"],
  fail:["bankruptcy","bankrupt","default","defaults","collapse","collapses","collapsed"],
  move:["raise","raises","raised","cut","cuts","lower","lowers","increase","increases","decrease","decreases"],
  outbreak:["outbreak","outbreaks","spread","spreads","spreading","infect","infects","infection","infections","transmission","cases"],
  die:["dead","death","deaths","dies","died","fatalities","killed","kills"],
  warn:["warn","warns","warned","warning","declare","declares","declared","emergency"],
  resign:["resign","resigns","resigned","resignation"],
  arrest:["arrest","arrests","arrested","detain","detained","charge","charged"],
  evacuate:["evacuate","evacuates","evacuated","evacuation","evacuations"],
  deploy:["deploy","deploys","deployed","deployment","carrier","troops","forces"],
  traffic:["traffic","trafficking","smuggle","smuggling","meth","drug","drugs"]
};
const ACTION_LOOKUP=new Map<string,string>();
for(const [canonical,words] of Object.entries(ACTION_GROUPS))for(const word of words)ACTION_LOOKUP.set(word,canonical);

function clean(value:string){return value.toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9\s-]/g," ").replace(/-/g," ").replace(/\s+/g," ").trim();}
function stem(word:string){let w=word.toLowerCase();if(w.length>6&&w.endsWith("ing"))w=w.slice(0,-3);else if(w.length>5&&w.endsWith("ed"))w=w.slice(0,-2);else if(w.length>4&&w.endsWith("es"))w=w.slice(0,-2);else if(w.length>4&&w.endsWith("s"))w=w.slice(0,-1);return w;}
function unique<T>(items:T[]){return [...new Set(items)];}
function overlapRatio(anchor:string[],text:Set<string>){if(!anchor.length)return 1;let hit=0;for(const term of anchor)if(text.has(term))hit++;return hit/anchor.length;}
function geoTerms(value:string){const lower=` ${clean(value)} `;return unique(GEO_PHRASES.filter(term=>lower.includes(` ${term} `)).map(term=>term.toLowerCase()));}
function canonicalAction(word:string){return ACTION_LOOKUP.get(word)||ACTION_LOOKUP.get(stem(word))||null;}

export function eventTokens(value:string){
  return clean(value).split(/\s+/).filter(Boolean).map(word=>ACTION_LOOKUP.get(word)||stem(word)).filter(word=>word.length>2&&!STOP.has(word)&&!GENERIC.has(word));
}

export function buildEventAnchor(subject:string,titles:string[]=[subject],eventTime:string|null=null):ResearchEventAnchor{
  const subjectWords=clean(subject).split(/\s+/).filter(Boolean);
  const geographyTerms=geoTerms([subject,...titles].join(" "));
  const geographyTokenSet=new Set(geographyTerms.flatMap(term=>term.split(" ").map(stem)));
  const rawDistinctive=subjectWords.map(stem).filter(word=>word.length>2&&!STOP.has(word)&&!GENERIC.has(word)&&!GEO_TOKENS.has(word)&&!geographyTokenSet.has(word));
  const actionTerms=unique(subjectWords.map(canonicalAction).filter((x):x is string=>Boolean(x)));
  const topicTerms=unique(rawDistinctive.filter(word=>!ACTION_LOOKUP.has(word)&&!actionTerms.includes(word)));
  const distinctiveTerms=unique([...topicTerms,...actionTerms]);
  const rawSubject=subject.split(/\s+/);
  const entityTerms=unique(subjectWords.filter((word,index)=>index>0&&/^[A-Z]/.test(rawSubject[index]||"")).map(stem).filter(word=>topicTerms.includes(word))).slice(0,6);
  return {version:"1.0",subject,distinctiveTerms,actionTerms,topicTerms,geographyTerms,entityTerms,eventTime};
}

export function eventAlignmentComponents(anchor:ResearchEventAnchor,text:string){
  const textTokens=new Set(eventTokens(text));
  const textGeo=new Set(geoTerms(text));
  const topic=overlapRatio(anchor.topicTerms,textTokens);
  const action=overlapRatio(anchor.actionTerms,textTokens);
  const geography=anchor.geographyTerms.length?overlapRatio(anchor.geographyTerms,textGeo):1;
  const distinctive=overlapRatio(anchor.distinctiveTerms,textTokens);
  const matchedDistinctive=anchor.distinctiveTerms.filter(term=>textTokens.has(term));
  let score=topic*65+action*25+geography*10;
  if(anchor.topicTerms.length>=1&&matchedDistinctive.length===0)score=0;
  if(anchor.topicTerms.length>=2&&topic===0)score=Math.min(score,25);
  if(anchor.actionTerms.length&&action===0&&topic<.5)score=Math.min(score,42);
  return {score:Math.max(0,Math.min(100,Math.round(score))),topic:Math.round(topic*100),action:Math.round(action*100),geography:Math.round(geography*100),distinctive:Math.round(distinctive*100),matchedDistinctive};
}

export function titleEventAlignment(anchor:ResearchEventAnchor,title:string){return eventAlignmentComponents(anchor,title).score;}

export function clusterCoherenceScore(anchor:ResearchEventAnchor,titles:string[]){
  if(!titles.length)return 0;
  const scores=titles.map(title=>titleEventAlignment(anchor,title));
  const average=scores.reduce((a,b)=>a+b,0)/scores.length;
  const supported=scores.filter(score=>score>=45).length/titles.length;
  return Math.max(0,Math.min(100,Math.round(average*.62+supported*38)));
}

export function anchorPreservingQuery(original:string,anchor:ResearchEventAnchor){
  const subjectOrder=eventTokens(anchor.subject);
  const terms=unique([...subjectOrder.filter(t=>anchor.topicTerms.includes(t)).slice(0,4),...anchor.actionTerms.slice(0,2)]);
  const geography=anchor.geographyTerms.slice(0,2);
  const originalTerms=eventTokens(original);
  for(const term of originalTerms)if(anchor.distinctiveTerms.includes(term)&&!terms.includes(term))terms.push(term);
  const query=unique([...terms,...geography]).join(" ").trim();
  return query||anchor.subject;
}

export function alignmentQueryVariants(anchor:ResearchEventAnchor,original:string){
  const primary=anchorPreservingQuery(original,anchor);
  const compact=unique([...anchor.topicTerms.slice(0,4),...anchor.actionTerms.slice(0,2),...anchor.geographyTerms.slice(0,1)]).join(" ");
  return unique([primary,anchor.subject,compact]).filter(query=>query.trim().length>=4).slice(0,3);
}

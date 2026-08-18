import type { BriefRequest } from "@/lib/types";
import { decomposeResearchRequest } from "@/lib/research/decompose";
import { dedupeSources,rankDiscoveredUrl,sourceDiversity } from "@/lib/research/rank";
import { wikipediaProvider } from "@/lib/research/providers/wikipedia";
import { wikidataProvider } from "@/lib/research/providers/wikidata";
import { gdeltProvider } from "@/lib/research/providers/gdelt";
import { googleNewsProvider } from "@/lib/research/providers/google-news";
import { openAlexProvider } from "@/lib/research/providers/openalex";
import { researchDiscoveredPages } from "@/lib/research/providers/web-page";
import { evaluateResearchGaps,shouldIterate } from "@/lib/research/iteration";
import type { ResearchFinding,ResearchGraph,ResearchProvider,ResearchSource } from "@/lib/research/types";
import { stableResearchId } from "@/lib/research/http";
import { loadResearchMemory,persistResearchGraph } from "@/lib/research/persistence";
import { recordMetric,recordProviderHealth } from "@/lib/ops/telemetry";

const referenceProviders:ResearchProvider[]=[wikipediaProvider,wikidataProvider];
const memoryCache=new Map<string,{expires:number;graph:ResearchGraph}>();
const academicWords=/\b(study|studies|research|evidence|science|scientific|clinical|trial|paper|literature|meta-analysis|medicine|medical|physics|biology|chemistry|psychology|economics)\b/i;

async function withBudget<T>(promise:Promise<T>,ms=7000):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Research provider time budget exceeded")),ms);})]);}
  finally{if(timer)clearTimeout(timer);}
}
async function runProvider(provider:ResearchProvider,subject:string,plan:ReturnType<typeof decomposeResearchRequest>){
  const started=Date.now();
  try{const result=await withBudget(provider.research(subject,plan));void recordProviderHealth(provider.id,true,Date.now()-started);return result;}
  catch(error){void recordProviderHealth(provider.id,false,Date.now()-started,error);throw error;}
}
function confidenceFor(sources:ResearchSource[],findings:ResearchFinding[]){
  if(!findings.length||!sources.length)return "low" as const;
  const diversity=sourceDiversity(sources),authority=Math.max(...sources.map(s=>s.authority));
  if(diversity>=2&&authority>=75&&findings.length>=4)return "high" as const;
  if(authority>=55&&findings.length>=2)return "medium" as const;
  return "low" as const;
}
function mergeDescriptions(parts:string[]){return parts.map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean).sort((a,b)=>b.length-a.length)[0]||"";}
function academicRequest(request:BriefRequest){return request.sourcePolicy==="academic"||academicWords.test(request.subject);}
function cacheTtl(plan:ReturnType<typeof decomposeResearchRequest>){return plan.freshness==="live"?5*60*1000:plan.freshness==="historical"?60*60*1000:15*60*1000;}
function maxIterations(request:BriefRequest){return request.depth==="research"?4:request.depth==="deep"?3:request.freshnessRequirement==="recent"?3:2;}

async function runSubject(subject:string,request:BriefRequest){
  const plan=decomposeResearchRequest({...request,subject});
  const providers:ResearchProvider[]=(plan.intent==="current"||plan.freshness==="live")?[googleNewsProvider,gdeltProvider,...referenceProviders]:academicRequest(request)?[openAlexProvider,...referenceProviders]:referenceProviders;
  const settled=await Promise.allSettled(providers.map(provider=>runProvider(provider,subject,plan)));
  const canonical:string[]=[];const descriptions:string[]=[];const findings:ResearchFinding[]=[];const sources:ResearchSource[]=[];const discovered:string[]=[];
  for(const result of settled){if(result.status!=="fulfilled")continue;if(result.value.canonicalSubject)canonical.push(result.value.canonicalSubject);if(result.value.description)descriptions.push(result.value.description);findings.push(...result.value.findings);sources.push(...result.value.sources);discovered.push(...(result.value.discoveredUrls||[]));}
  return {canonical:canonical[0]||subject,description:mergeDescriptions(descriptions),findings,sources,discovered};
}
function applyPolicy(request:BriefRequest,sources:ResearchSource[]){
  if(request.sourcePolicy==="primary-only")return sources.filter(s=>s.kind==="primary");
  if(request.sourcePolicy==="academic")return sources.filter(s=>s.kind==="specialist"&&["A","B"].includes(s.tier));
  if(request.sourcePolicy==="news")return sources.filter(s=>s.kind==="reporting");
  if(request.sourcePolicy==="verified"||!request.sourcePolicy)return sources.filter(s=>["A","B"].includes(s.tier));
  return sources;
}
function eligible(request:BriefRequest,rawSources:ResearchSource[],rawFindings:ResearchFinding[]){
  const sources=applyPolicy(request,dedupeSources(rawSources));const allowed=new Set(sources.map(s=>s.id));return {sources,findings:rawFindings.filter(f=>f.sourceIds.some(id=>allowed.has(id)))};
}
function cutoffFrom(sources:ResearchSource[],fallback:string){
  const times=sources.map(s=>Date.parse(s.retrievedAt)).filter(Number.isFinite);return times.length?new Date(Math.max(...times)).toISOString():fallback;
}

export async function researchSubject(request:BriefRequest):Promise<ResearchGraph>{
  const started=Date.now();const plan=decomposeResearchRequest(request);
  const key=`research-rss-v3|${plan.normalized.toLowerCase()}|${request.depth}|${request.perspective}|${request.sourcePolicy||"verified"}|${request.freshnessRequirement||"current"}`;
  const cached=memoryCache.get(key);if(cached&&cached.expires>Date.now())return cached.graph;
  const durable=await loadResearchMemory(key);if(durable){memoryCache.set(key,{expires:Date.now()+cacheTtl(plan),graph:{...durable,persisted:true}});return {...durable,persisted:true};}

  const subjectResults=await Promise.all(plan.subjects.map(subject=>runSubject(subject,request)));
  let rawSources=dedupeSources(subjectResults.flatMap(r=>r.sources));let rawFindings=subjectResults.flatMap(r=>r.findings);let discovered=[...new Set(subjectResults.flatMap(r=>r.discovered))];
  const iterations:NonNullable<ResearchGraph["iterations"]>=[];const tried=new Set<string>();let stopReason:ResearchGraph["stopReason"]="provider-limits";

  for(let iteration=2;iteration<=maxIterations(request);iteration++){
    const current=eligible(request,rawSources,rawFindings);const gaps=evaluateResearchGaps(request,current.sources,current.findings);
    if(!gaps.length){stopReason="sufficient";break;}
    if(!shouldIterate(request,gaps)&&iteration>2){stopReason="provider-limits";break;}
    const gap=gaps[0];let addedSources:ResearchSource[]=[];let addedFindings:ResearchFinding[]=[];let nextQuery=gap.query;

    if((gap.kind==="independence"||gap.kind==="coverage")&&discovered.length){
      const pageResult=await researchDiscoveredPages(plan.subjects[0],discovered.filter(url=>!tried.has(url)),request.depth==="research"?3:2).catch(()=>({sources:[],findings:[]}));
      for(const source of pageResult.sources)tried.add(source.url);addedSources.push(...pageResult.sources);addedFindings.push(...pageResult.findings);nextQuery="verify discovered external sources";
    }
    if((academicRequest(request)||request.sourcePolicy==="academic")&&addedSources.length===0){
      const result=await runProvider(openAlexProvider,plan.subjects[0],plan).catch(()=>null);if(result){addedSources.push(...result.sources);addedFindings.push(...result.findings);discovered.push(...(result.discoveredUrls||[]));nextQuery=`${plan.subjects[0]} scholarly evidence`;}
    }
    if((plan.intent==="current"||plan.freshness==="live")&&(gap.kind==="freshness"||gap.kind==="independence"||gap.kind==="coverage"||addedSources.length===0)){
      const refined=iteration===2?`${plan.subjects[0]} latest update`:`${plan.subjects[0]} latest developments`;
      const rss=await runProvider(googleNewsProvider,refined,{...plan,original:refined,normalized:refined,subjects:[refined],intent:"current"}).catch(()=>null);
      if(rss){addedSources.push(...rss.sources);addedFindings.push(...rss.findings);discovered.push(...(rss.discoveredUrls||[]));nextQuery=`${refined} via Google News RSS`;}
      if(addedSources.length===0){const result=await runProvider(gdeltProvider,refined,{...plan,original:refined,normalized:refined,subjects:[refined],intent:"current"}).catch(()=>null);if(result){addedSources.push(...result.sources);addedFindings.push(...result.findings);discovered.push(...(result.discoveredUrls||[]));nextQuery=refined;}}
    }
    const primary=subjectResults[0];
    if(addedSources.length===0&&plan.subjects.length===1&&primary?.canonical&&primary.canonical.toLowerCase()!==plan.subjects[0].toLowerCase()&&!tried.has(primary.canonical.toLowerCase())){
      tried.add(primary.canonical.toLowerCase());const follow=await runSubject(primary.canonical,request).catch(()=>null);if(follow){addedSources.push(...follow.sources);addedFindings.push(...follow.findings);discovered.push(...follow.discovered);nextQuery=primary.canonical;}
    }
    iterations.push({iteration,gapKind:gap.kind,reason:gap.reason,nextQuery});
    const beforeSources=rawSources.length,beforeFindings=rawFindings.length;rawSources=dedupeSources([...rawSources,...addedSources]);rawFindings=[...rawFindings,...addedFindings];discovered=[...new Set(discovered)];
    if(rawSources.length===beforeSources&&rawFindings.length===beforeFindings){stopReason="no-progress";break;}
    if(Date.now()-started>18000){stopReason="budget";break;}
  }

  let sources=applyPolicy(request,rawSources).slice(0,plan.maxSources);const allowed=new Set(sources.map(s=>s.id));const sourceById=new Map(sources.map(s=>[s.id,s] as const));
  const allEligibleFindings=rawFindings.filter(f=>f.sourceIds.some(id=>allowed.has(id)));const reportingFindings=allEligibleFindings.filter(f=>f.sourceIds.some(id=>{const s=sourceById.get(id);return s?.kind==="reporting"||s?.kind==="primary";}));
  const ordered=plan.intent==="current"?[...reportingFindings,...allEligibleFindings.filter(f=>!reportingFindings.includes(f))]:allEligibleFindings;const limit=request.depth==="flash"?2:request.depth==="quick"?4:request.depth==="standard"?8:18;const findings=ordered.slice(0,limit);
  const rankedDiscovered=[...new Set(discovered)].sort((a,b)=>rankDiscoveredUrl(b)-rankDiscoveredUrl(a)).slice(0,16);const confidence=confidenceFor(sources,findings);
  const sufficient=plan.intent==="current"?reportingFindings.length>=1&&sources.some(s=>s.kind==="reporting"||s.kind==="primary"):findings.length>=2&&sources.length>=1;
  const remaining=evaluateResearchGaps(request,sources,findings);const missingEvidence:string[]=[];
  if(!sufficient)missingEvidence.push(request.sourcePolicy&&request.sourcePolicy!=="verified"?`The selected ${request.sourcePolicy} source policy did not return enough eligible evidence`:plan.intent==="current"?"Current reporting providers did not return enough eligible evidence; Briefs will not substitute encyclopedia history for a current update":"Research providers did not return enough evidence to construct a safe Brief");
  for(const gap of remaining)if(!missingEvidence.includes(gap.reason))missingEvidence.push(gap.reason);
  if(plan.freshness==="live"&&sourceDiversity(sources)<2&&!missingEvidence.some(x=>x.includes("corroboration")))missingEvidence.push("A time-sensitive query should be corroborated against an additional independent primary or reporting source before being treated as fully current");

  const comparison=plan.intent==="compare"?subjectResults.map(r=>({subject:r.canonical,summary:r.description||r.findings.slice(0,3).map(f=>f.statement).join(" "),factCount:r.findings.length,sourceCount:dedupeSources(r.sources).length})):undefined;
  let description="";
  if(plan.intent==="compare")description=(comparison||[]).map(item=>`${item.subject}: ${item.summary}`).join("\n\n");
  else if(plan.intent==="current")description=reportingFindings.length?reportingFindings.slice(0,5).map(f=>f.statement).join(" "):`Briefs could not gather enough eligible current reporting to safely summarize ${request.subject}.`;
  else description=findings.length?findings.slice(0,request.depth==="research"?8:4).map(f=>f.statement).join(" "):subjectResults[0]?.description||"";

  const generatedAt=new Date().toISOString();const knowledgeCutoff=cutoffFrom(sources,generatedAt);
  if(stopReason==="provider-limits"&&remaining.length===0)stopReason="sufficient";
  const graph:ResearchGraph={runId:stableResearchId("research",`${key}:${generatedAt}`),plan,canonicalSubject:plan.intent==="compare"?plan.subjects.join(" vs "):subjectResults[0]?.canonical||request.subject,description,findings,sources,discoveredUrls:rankedDiscovered,missingEvidence,confidence,sufficient,generatedAt,knowledgeCutoff,iterations,comparison,stopReason};
  const persisted=await persistResearchGraph(graph,key);graph.persisted=persisted.memory;
  memoryCache.set(key,{expires:Date.now()+cacheTtl(plan),graph});void recordMetric("research.run",sufficient?"ok":"degraded",Date.now()-started,{intent:plan.intent,sources:sources.length,findings:findings.length,iterations:iterations.length,stopReason});
  return graph;
}

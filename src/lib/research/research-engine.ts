import type { BriefRequest } from "@/lib/types";
import { decomposeResearchRequest } from "@/lib/research/decompose";
import { dedupeSources, rankDiscoveredUrl, sourceDiversity } from "@/lib/research/rank";
import { wikipediaProvider } from "@/lib/research/providers/wikipedia";
import { wikidataProvider } from "@/lib/research/providers/wikidata";
import { gdeltProvider } from "@/lib/research/providers/gdelt";
import type { ResearchFinding, ResearchGraph, ResearchProvider, ResearchSource } from "@/lib/research/types";
import { stableResearchId } from "@/lib/research/http";
import { persistResearchGraph } from "@/lib/research/persistence";

const referenceProviders:ResearchProvider[]=[wikipediaProvider,wikidataProvider];
const memoryCache=new Map<string,{expires:number;graph:ResearchGraph}>();

async function withBudget<T>(promise:Promise<T>,ms=7000):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Research provider time budget exceeded")),ms);})]);
  }finally{if(timer) clearTimeout(timer);}
}

function confidenceFor(sources:ResearchSource[],findings:ResearchFinding[]){
  if(!findings.length||!sources.length) return "low" as const;
  const diversity=sourceDiversity(sources);
  const authority=Math.max(...sources.map(s=>s.authority));
  if(diversity>=2&&authority>=75&&findings.length>=4) return "high" as const;
  if(authority>=55&&findings.length>=2) return "medium" as const;
  return "low" as const;
}

function mergeDescriptions(parts:string[]){
  const clean=parts.map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
  return clean.sort((a,b)=>b.length-a.length)[0]||"";
}

async function runSubject(subject:string,request:BriefRequest){
  const plan=decomposeResearchRequest({...request,subject});
  const providers=plan.intent==="current"?[gdeltProvider,wikipediaProvider,wikidataProvider]:referenceProviders;
  const settled=await Promise.allSettled(providers.map(provider=>withBudget(provider.research(subject,plan))));
  const canonical:string[]=[]; const descriptions:string[]=[]; const findings:ResearchFinding[]=[]; const sources:ResearchSource[]=[]; const discovered:string[]=[];
  for(const result of settled){
    if(result.status!=="fulfilled") continue;
    if(result.value.canonicalSubject) canonical.push(result.value.canonicalSubject);
    if(result.value.description) descriptions.push(result.value.description);
    findings.push(...result.value.findings); sources.push(...result.value.sources); discovered.push(...(result.value.discoveredUrls||[]));
  }
  return {canonical:canonical[0]||subject,description:mergeDescriptions(descriptions),findings,sources,discovered};
}

export async function researchSubject(request:BriefRequest):Promise<ResearchGraph>{
  const plan=decomposeResearchRequest(request);
  const key=`${plan.normalized.toLowerCase()}|${request.depth}|${request.perspective}|${request.sourcePolicy||"verified"}`;
  const cached=memoryCache.get(key);
  if(cached&&cached.expires>Date.now()) return cached.graph;
  const subjectResults=await Promise.all(plan.subjects.map(subject=>runSubject(subject,request)));
  let sources=dedupeSources(subjectResults.flatMap(r=>r.sources)).slice(0,plan.maxSources);
  if(request.sourcePolicy==="primary-only") sources=sources.filter(s=>s.kind==="primary");
  else if(request.sourcePolicy==="academic") sources=sources.filter(s=>s.kind==="specialist"&&["A","B"].includes(s.tier));
  else if(request.sourcePolicy==="news") sources=sources.filter(s=>s.kind==="reporting");
  else if(request.sourcePolicy==="verified"||!request.sourcePolicy) sources=sources.filter(s=>["A","B"].includes(s.tier));
  const allowed=new Set(sources.map(s=>s.id));
  const sourceById=new Map(sources.map(s=>[s.id,s] as const));
  const allEligibleFindings=subjectResults.flatMap(r=>r.findings).filter(f=>f.sourceIds.some(id=>allowed.has(id)));
  const reportingFindings=allEligibleFindings.filter(f=>f.sourceIds.some(id=>{const source=sourceById.get(id);return source?.kind==="reporting"||source?.kind==="primary";}));
  const orderedFindings=plan.intent==="current"?[...reportingFindings,...allEligibleFindings.filter(f=>!reportingFindings.includes(f))]:allEligibleFindings;
  const findings=orderedFindings.slice(0,request.depth==="flash"?2:request.depth==="quick"?4:request.depth==="standard"?8:18);
  const discovered=[...new Set(subjectResults.flatMap(r=>r.discovered))].sort((a,b)=>rankDiscoveredUrl(b)-rankDiscoveredUrl(a)).slice(0,12);
  const confidence=confidenceFor(sources,findings);
  const sufficient=plan.intent==="current"?reportingFindings.length>=1&&sources.some(s=>s.kind==="reporting"||s.kind==="primary"):findings.length>=2&&sources.length>=1;
  const missingEvidence:string[]=[];
  if(!sufficient) missingEvidence.push(request.sourcePolicy&&request.sourcePolicy!=="verified"?`The selected ${request.sourcePolicy} source policy did not return enough eligible evidence`:plan.intent==="current"?"Current reporting providers did not return enough eligible evidence; Briefs will not substitute encyclopedia history for a current update":"Research providers did not return enough evidence to construct a safe Brief");
  if(sourceDiversity(sources)<2) missingEvidence.push("Independent corroboration is still limited; current findings come from one source family");
  if(plan.freshness==="live"&&sourceDiversity(sources)<2) missingEvidence.push("A time-sensitive query should be corroborated against an additional independent primary or reporting source before being treated as fully current");
  const description=plan.intent==="current"?(reportingFindings.length?reportingFindings.map(f=>f.statement).slice(0,5).join(" "):`Briefs could not gather enough eligible current reporting to safely summarize ${request.subject}.`):findings.length?findings.map(f=>f.statement).slice(0,4).join(" "):(plan.intent==="compare"?subjectResults.map(r=>`${r.canonical}: ${r.description}`).filter(x=>x.length>3).join("\n\n"):subjectResults[0]?.description||"");
  const generatedAt=new Date().toISOString();
  const graph:ResearchGraph={runId:stableResearchId("research",`${key}:${generatedAt}`),plan,canonicalSubject:plan.intent==="compare"?plan.subjects.join(" vs "):subjectResults[0]?.canonical||request.subject,description,findings,sources,discoveredUrls:discovered,missingEvidence,confidence,sufficient,generatedAt,knowledgeCutoff:generatedAt};
  memoryCache.set(key,{expires:Date.now()+10*60*1000,graph});
  void persistResearchGraph(graph);
  return graph;
}

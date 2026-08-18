import type { BriefRequest } from "@/lib/types";
import { decomposeResearchRequest } from "@/lib/research/decompose";
import { dedupeSources, rankDiscoveredUrl, sourceDiversity } from "@/lib/research/rank";
import { wikipediaProvider } from "@/lib/research/providers/wikipedia";
import { wikidataProvider } from "@/lib/research/providers/wikidata";
import { gdeltProvider } from "@/lib/research/providers/gdelt";
import { evaluateResearchGaps, shouldIterate } from "@/lib/research/iteration";
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

function applyPolicy(request:BriefRequest,sources:ResearchSource[]){
  if(request.sourcePolicy==="primary-only") return sources.filter(s=>s.kind==="primary");
  if(request.sourcePolicy==="academic") return sources.filter(s=>s.kind==="specialist"&&["A","B"].includes(s.tier));
  if(request.sourcePolicy==="news") return sources.filter(s=>s.kind==="reporting");
  if(request.sourcePolicy==="verified"||!request.sourcePolicy) return sources.filter(s=>["A","B"].includes(s.tier));
  return sources;
}

export async function researchSubject(request:BriefRequest):Promise<ResearchGraph>{
  const plan=decomposeResearchRequest(request);
  const key=`${plan.normalized.toLowerCase()}|${request.depth}|${request.perspective}|${request.sourcePolicy||"verified"}`;
  const cached=memoryCache.get(key);
  if(cached&&cached.expires>Date.now()) return cached.graph;

  const subjectResults=await Promise.all(plan.subjects.map(subject=>runSubject(subject,request)));
  let rawSources=dedupeSources(subjectResults.flatMap(r=>r.sources));
  let rawFindings=subjectResults.flatMap(r=>r.findings);
  const iterations:NonNullable<ResearchGraph["iterations"]>=[];

  const initialGaps=evaluateResearchGaps(request,rawSources,rawFindings);
  if(shouldIterate(request,initialGaps)&&plan.subjects.length===1){
    const primary=subjectResults[0];
    const gap=initialGaps[0];
    let followup:null|Awaited<ReturnType<typeof runSubject>>=null;
    if(plan.intent==="current"){
      const refined=`${plan.subjects[0]} latest`;
      const result=await withBudget(gdeltProvider.research(refined,{...plan,original:refined,normalized:refined,subjects:[refined],intent:"current"})).catch(()=>null);
      if(result) followup={canonical:result.canonicalSubject||primary.canonical,description:result.description||"",findings:result.findings,sources:result.sources,discovered:result.discoveredUrls||[]};
      iterations.push({iteration:2,gapKind:gap.kind,reason:gap.reason,nextQuery:refined});
    }else if(primary.canonical&&primary.canonical.toLowerCase()!==plan.subjects[0].toLowerCase()){
      followup=await runSubject(primary.canonical,request).catch(()=>null);
      iterations.push({iteration:2,gapKind:gap.kind,reason:gap.reason,nextQuery:primary.canonical});
    }else{
      iterations.push({iteration:2,gapKind:gap.kind,reason:gap.reason,nextQuery:gap.query});
    }
    if(followup){
      rawSources=dedupeSources([...rawSources,...followup.sources]);
      rawFindings=[...rawFindings,...followup.findings];
      subjectResults[0]={...primary,description:mergeDescriptions([primary.description,followup.description]),findings:[...primary.findings,...followup.findings],sources:dedupeSources([...primary.sources,...followup.sources]),discovered:[...primary.discovered,...followup.discovered]};
    }
  }

  let sources=applyPolicy(request,rawSources).slice(0,plan.maxSources);
  const allowed=new Set(sources.map(s=>s.id));
  const sourceById=new Map(sources.map(s=>[s.id,s] as const));
  const allEligibleFindings=rawFindings.filter(f=>f.sourceIds.some(id=>allowed.has(id)));
  const reportingFindings=allEligibleFindings.filter(f=>f.sourceIds.some(id=>{const source=sourceById.get(id);return source?.kind==="reporting"||source?.kind==="primary";}));
  const orderedFindings=plan.intent==="current"?[...reportingFindings,...allEligibleFindings.filter(f=>!reportingFindings.includes(f))]:allEligibleFindings;
  const findings=orderedFindings.slice(0,request.depth==="flash"?2:request.depth==="quick"?4:request.depth==="standard"?8:18);
  const discovered=[...new Set(subjectResults.flatMap(r=>r.discovered))].sort((a,b)=>rankDiscoveredUrl(b)-rankDiscoveredUrl(a)).slice(0,12);
  const confidence=confidenceFor(sources,findings);
  const sufficient=plan.intent==="current"?reportingFindings.length>=1&&sources.some(s=>s.kind==="reporting"||s.kind==="primary"):findings.length>=2&&sources.length>=1;
  const remainingGaps=evaluateResearchGaps(request,sources,findings);
  const missingEvidence:string[]=[];
  if(!sufficient) missingEvidence.push(request.sourcePolicy&&request.sourcePolicy!=="verified"?`The selected ${request.sourcePolicy} source policy did not return enough eligible evidence`:plan.intent==="current"?"Current reporting providers did not return enough eligible evidence; Briefs will not substitute encyclopedia history for a current update":"Research providers did not return enough evidence to construct a safe Brief");
  for(const gap of remainingGaps){
    if(!missingEvidence.includes(gap.reason)) missingEvidence.push(gap.reason);
  }
  if(plan.freshness==="live"&&sourceDiversity(sources)<2) missingEvidence.push("A time-sensitive query should be corroborated against an additional independent primary or reporting source before being treated as fully current");

  const comparison=plan.intent==="compare"?subjectResults.map(r=>({
    subject:r.canonical,
    summary:r.description||r.findings.slice(0,3).map(f=>f.statement).join(" "),
    factCount:r.findings.length,
    sourceCount:dedupeSources(r.sources).length
  })):undefined;

  let description:string;
  if(plan.intent==="compare"){
    description=(comparison||[]).map(item=>`${item.subject}: ${item.summary}`).join("\n\n");
  }else if(plan.intent==="current"){
    description=reportingFindings.length?reportingFindings.map(f=>f.statement).slice(0,5).join(" "):`Briefs could not gather enough eligible current reporting to safely summarize ${request.subject}.`;
  }else{
    description=findings.length?findings.map(f=>f.statement).slice(0,4).join(" "):subjectResults[0]?.description||"";
  }
  const generatedAt=new Date().toISOString();
  const graph:ResearchGraph={runId:stableResearchId("research",`${key}:${generatedAt}`),plan,canonicalSubject:plan.intent==="compare"?plan.subjects.join(" vs "):subjectResults[0]?.canonical||request.subject,description,findings,sources,discoveredUrls:discovered,missingEvidence,confidence,sufficient,generatedAt,knowledgeCutoff:generatedAt,iterations,comparison};
  memoryCache.set(key,{expires:Date.now()+10*60*1000,graph});
  void persistResearchGraph(graph);
  return graph;
}

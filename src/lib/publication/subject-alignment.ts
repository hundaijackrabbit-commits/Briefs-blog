import type { ResearchEventAnchor,ResearchFinding,ResearchGraph,ResearchSource,ResearchSourceAlignment,ResearchSubjectAlignment } from "@/lib/research/types";
import { eventAlignmentComponents,eventTokens,eventhoodScore } from "@/lib/publication/event-identity";

const EVENT_CLASS_TERMS=new Set(["attack","ceasefire","sanction","elect","protest","regulate","merge","fail","move","outbreak","die","warn","resign","arrest","evacuate","deploy","traffic","expand","conflict","launch","disrupt","disaster","agree"]);
function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function rawSourceText(source:ResearchSource){return `${source.title} ${source.excerpt||""}`;}
function findingEvidenceText(source:ResearchSource,graph:ResearchGraph){
  // IMPORTANT: finding.subject is deliberately excluded. The assigned canonical subject
  // is metadata, not evidence that the underlying source actually matches that subject.
  return graph.findings.filter(f=>f.sourceIds.includes(source.id)).map(f=>`${f.predicate} ${f.valueText} ${f.statement}`).join(" ");
}
function sourceText(source:ResearchSource,graph:ResearchGraph){return `${rawSourceText(source)} ${findingEvidenceText(source,graph)}`;}
function temporalAlignment(anchorTime:string|null,source:ResearchSource){
  if(!anchorTime)return 85;
  const event=Date.parse(anchorTime);const observed=Date.parse(source.publishedAt||source.retrievedAt||"");
  if(!Number.isFinite(event)||!Number.isFinite(observed))return 65;
  const days=Math.abs(event-observed)/86400000;
  if(days<=2)return 100;if(days<=7)return 92;if(days<=14)return 72;if(days<=30)return 45;return 18;
}
function mismatchPenalty(anchor:ResearchEventAnchor,text:string,distinctiveCoverage:number){
  if(distinctiveCoverage>=70)return 0;
  const tokens=new Set(eventTokens(text));
  const anchorClasses=new Set([...anchor.actionTerms,...anchor.topicTerms].filter(t=>EVENT_CLASS_TERMS.has(t)));
  const mismatches=[...tokens].filter(t=>EVENT_CLASS_TERMS.has(t)&&!anchorClasses.has(t));
  return Math.min(30,new Set(mismatches).size*10);
}
function matchedTermSet(anchor:ResearchEventAnchor,text:string){const tokens=new Set(eventTokens(text));return new Set(anchor.distinctiveTerms.filter(t=>tokens.has(t)));}
function sharedCount(a:Set<string>,b:Set<string>){let n=0;for(const x of a)if(b.has(x))n++;return n;}
function family(source:ResearchSource){return source.independenceFamily||source.provider;}
function coverage(anchorTerms:string[],texts:Set<string>[]){if(!anchorTerms.length)return 100;const found=new Set<string>();for(const text of texts)for(const term of anchorTerms)if(text.has(term))found.add(term);return clamp(found.size/anchorTerms.length*100);}

function alignmentForSource(source:ResearchSource,graph:ResearchGraph,anchor:ResearchEventAnchor){
  const title=eventAlignmentComponents(anchor,source.title);
  const raw=eventAlignmentComponents(anchor,rawSourceText(source));
  const full=eventAlignmentComponents(anchor,sourceText(source,graph));
  const temporal=temporalAlignment(anchor.eventTime,source);
  const semantic=Math.round(title.score*.52+raw.score*.33+full.score*.15);
  const rawMatched=matchedTermSet(anchor,rawSourceText(source));
  const negativePenalty=mismatchPenalty(anchor,rawSourceText(source),raw.distinctive);
  const baseScore=clamp(semantic*.86+temporal*.14-negativePenalty);
  const requiredDistinctive=anchor.distinctiveTerms.length>=4?2:1;
  const rawTopicAction=anchor.actionTerms.length>0&&raw.topic>0&&raw.action>0;
  const rawAnchorSupport=rawMatched.size>=requiredDistinctive||rawTopicAction;
  return {sourceId:source.id,topic:raw.topic,action:raw.action,geography:raw.geography,temporal,negativePenalty,baseScore,rawMatched,rawAnchorSupport};
}

export function evaluateResearchAlignment(args:{graph:ResearchGraph;anchor:ResearchEventAnchor;selectedSubject:string;queries:string[];clusterCoherence?:number;repaired?:boolean;}):ResearchSubjectAlignment{
  const {graph,anchor,selectedSubject}=args;
  const prelim=graph.sources.map(source=>({source,raw:alignmentForSource(source,graph,anchor)}));
  const prelimRelevant=prelim.filter(x=>x.raw.baseScore>=50&&x.raw.rawAnchorSupport);

  const sourceScores:ResearchSourceAlignment[]=prelim.map(({source,raw})=>{
    let corroboration=0;
    for(const other of prelimRelevant){
      if(other.source.id===source.id)continue;
      const common=sharedCount(raw.rawMatched,other.raw.rawMatched);
      if(common<=0)continue;
      corroboration=Math.max(corroboration,family(other.source)!==family(source)?10:5);
    }
    const score=clamp(raw.baseScore+corroboration);
    const topicRequired=anchor.topicTerms.length===0||raw.topic>0;
    const actionRequired=anchor.actionTerms.length===0||raw.action>0||raw.rawMatched.size>=2;
    const temporalRequired=graph.plan.freshness==="historical"||raw.temporal>=45;
    const passed=score>=58&&raw.rawAnchorSupport&&topicRequired&&actionRequired&&temporalRequired;
    const temporalStatus:ResearchSourceAlignment["temporalStatus"]=raw.temporal>=72?"current":raw.temporal>=45?"aging":"stale";
    return {sourceId:source.id,score,topic:raw.topic,action:raw.action,geography:raw.geography,temporal:raw.temporal,temporalStatus,corroboration,negativePenalty:raw.negativePenalty,matchedDistinctive:[...raw.rawMatched],passed};
  });

  const allowed=new Set(sourceScores.filter(x=>x.passed).map(x=>x.sourceId));
  const alignedSources=graph.sources.filter(s=>allowed.has(s.id));
  const alignedFamilies=new Set(alignedSources.map(family)).size;
  const alignedTexts=alignedSources.map(source=>new Set(eventTokens(rawSourceText(source))));
  const entityCoverage=coverage(anchor.topicTerms,alignedTexts);
  const actionCoverage=anchor.actionTerms.length?coverage(anchor.actionTerms,alignedTexts):0;
  const compositeActionCoverage=anchor.actionTerms.length?actionCoverage:100;
  const temporal=alignedSources.length?clamp(sourceScores.filter(x=>x.passed).reduce((sum,x)=>sum+x.temporal,0)/alignedSources.length):0;
  const average=alignedSources.length?sourceScores.filter(x=>x.passed).reduce((sum,x)=>sum+x.score,0)/alignedSources.length:0;
  const coverageRatio=graph.sources.length?alignedSources.length/graph.sources.length:0;
  const familyScore=clamp(alignedFamilies/3*100);
  const coherence=args.clusterCoherence??85;
  const eventhood=eventhoodScore(anchor,graph.sources.map(s=>s.title));
  const score=clamp(average*.42+entityCoverage*.14+compositeActionCoverage*.09+temporal*.10+coverageRatio*100*.10+familyScore*.05+coherence*.05+eventhood*.05);

  const reasons:string[]=[];
  if(alignedSources.length<3)reasons.push(`Only ${alignedSources.length} source(s) matched the selected event from their own title/excerpt evidence; at least 3 are required.`);
  if(alignedFamilies<2)reasons.push(`Aligned evidence spans ${alignedFamilies} independent source family/families; at least 2 are required.`);
  if(graph.sources.length>=6&&coverageRatio<.45)reasons.push(`Only ${Math.round(coverageRatio*100)}% of retrieved sources matched the selected event.`);
  if(score<70)reasons.push(`Subject alignment score ${score}/100 is below the 70-point publication threshold.`);
  if(args.clusterCoherence!==undefined&&args.clusterCoherence<52)reasons.push(`Discovery cluster coherence ${args.clusterCoherence}/100 is too low to treat the cluster as one event.`);
  if(eventhood<45)reasons.push(`Selected subject lacks enough observable event evidence (${eventhood}/100); editorial framing cannot substitute for a concrete change event.`);

  return {
    version:"1.0",
    selectedSubject,
    anchor,
    queries:[...new Set(args.queries)],
    sourceScores,
    alignedSourceIds:[...allowed],
    rejectedSourceIds:graph.sources.filter(s=>!allowed.has(s.id)).map(s=>s.id),
    staleSourceIds:sourceScores.filter(s=>s.temporalStatus==="stale").map(s=>s.sourceId),
    alignedFamilies,
    score,
    entityCoverage,
    actionCoverage,
    temporalAlignment:temporal,
    coverageRatio:Math.round(coverageRatio*100),
    clusterCoherence:args.clusterCoherence??null,
    passed:reasons.length===0,
    repaired:Boolean(args.repaired),
    reasons
  };
}

export function applyResearchAlignment(graph:ResearchGraph,alignment:ResearchSubjectAlignment):ResearchGraph{
  const allowed=new Set(alignment.alignedSourceIds);
  const sources=graph.sources.filter(source=>allowed.has(source.id));
  const findings:ResearchFinding[]=graph.findings.map(finding=>({...finding,sourceIds:finding.sourceIds.filter(id=>allowed.has(id))})).filter(finding=>finding.sourceIds.length>0);
  const families=new Set(sources.map(family)).size;
  const confidence:"high"|"medium"|"low"=alignment.passed&&families>=2&&findings.length>=4?"high":sources.length>=2&&findings.length>=2?"medium":"low";
  const alignmentReason=alignment.passed?null:`Research subject alignment failed: ${alignment.reasons.join(" ")}`;
  const missingEvidence=[...graph.missingEvidence,...(alignmentReason?[alignmentReason]:[])];
  const description=findings.length?findings.slice(0,6).map(f=>f.statement).join(" "):graph.description;
  return {...graph,canonicalSubject:alignment.selectedSubject,sources,findings,description,confidence,sufficient:graph.sufficient&&alignment.passed,missingEvidence,alignment};
}

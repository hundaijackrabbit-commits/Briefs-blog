import type { ResearchFinding,ResearchGraph,ResearchSource,ResearchSubjectAlignment } from "@/lib/research/types";

function sourceKey(source:ResearchSource){return String(source.id);}
function findingKey(finding:ResearchFinding){return String(finding.id);}

function confidenceRank(value:ResearchGraph["confidence"]){return value==="high"?3:value==="medium"?2:1;}
function stopRank(value:ResearchGraph["stopReason"]){return value==="sufficient"?4:value==="budget"?3:value==="provider-limits"?2:value==="no-progress"?1:0;}

export function mergeResearchGraphs(graphs:ResearchGraph[],selectedSubject:string):ResearchGraph{
  if(!graphs.length)throw new Error("At least one research graph is required");
  const base=graphs[0];

  const sourceMap=new Map<string,ResearchSource>();
  for(const graph of graphs){
    for(const source of graph.sources){
      const key=sourceKey(source);
      if(!sourceMap.has(key))sourceMap.set(key,source);
    }
  }
  const sources=[...sourceMap.values()];

  const findingMap=new Map<string,ResearchFinding>();
  for(const graph of graphs){
    for(const finding of graph.findings){
      const key=findingKey(finding);
      const current=findingMap.get(key);
      if(!current){findingMap.set(key,{...finding,sourceIds:[...new Set(finding.sourceIds)]});continue;}
      current.sourceIds=[...new Set([...current.sourceIds,...finding.sourceIds])];
    }
  }
  const findings=[...findingMap.values()];

  const bestConfidence=[...graphs].sort((a,b)=>confidenceRank(b.confidence)-confidenceRank(a.confidence))[0].confidence;
  const bestStop=[...graphs].sort((a,b)=>stopRank(b.stopReason)-stopRank(a.stopReason))[0].stopReason;

  return {
    ...base,
    canonicalSubject:selectedSubject||base.canonicalSubject,
    sources,
    findings,
    discoveredUrls:[...new Set(graphs.flatMap(graph=>graph.discoveredUrls||[]))],
    missingEvidence:[...new Set(graphs.flatMap(graph=>graph.missingEvidence||[]))],
    iterations:graphs.flatMap(graph=>graph.iterations||[]),
    confidence:bestConfidence,
    sufficient:graphs.some(graph=>graph.sufficient),
    stopReason:bestStop,
    generatedAt:new Date(Math.max(...graphs.map(graph=>Date.parse(graph.generatedAt)||0))).toISOString(),
    knowledgeCutoff:new Date(Math.max(...graphs.map(graph=>Date.parse(graph.knowledgeCutoff)||0))).toISOString()
  };
}

export function alignmentPreference(alignment:ResearchSubjectAlignment){
  return [
    alignment.passed?1:0,
    alignment.alignedSourceIds.length,
    alignment.alignedFamilies,
    alignment.score
  ] as const;
}

export function betterAlignment(
  a:{graph:ResearchGraph;alignment:ResearchSubjectAlignment},
  b:{graph:ResearchGraph;alignment:ResearchSubjectAlignment}
){
  const A=alignmentPreference(a.alignment),B=alignmentPreference(b.alignment);
  for(let i=0;i<A.length;i++){
    if(A[i]!==B[i])return A[i]>B[i]?a:b;
  }
  return a;
}

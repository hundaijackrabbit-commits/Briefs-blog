import type { ResearchGraph } from "@/lib/research/types";
import type { OpportunityScore } from "@/lib/publication/types";

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }
export function sourceFamilies(graph: ResearchGraph) {return new Set(graph.sources.map(s => s.independenceFamily || s.provider)).size;}
export function primarySourceCount(graph: ResearchGraph) {return graph.sources.filter(s => s.kind === "primary").length;}
function materiality(graph:ResearchGraph){
  const numeric=graph.findings.filter(f=>/\d/.test(f.valueText)).length;const current=graph.plan.freshness==="live"||graph.plan.intent==="current";const reporting=graph.sources.filter(s=>s.kind==="reporting"||s.kind==="primary").length;const contradictions=new Map<string,Set<string>>();for(const f of graph.findings){const key=f.predicate.toLowerCase();const set=contradictions.get(key)||new Set<string>();set.add(f.valueText);contradictions.set(key,set);}const disagreement=[...contradictions.values()].filter(v=>v.size>1).length;
  return clamp(42+Math.min(24,numeric*4)+(current?16:0)+Math.min(12,reporting*3)+Math.min(10,disagreement*5));
}

export function scoreOpportunity(graph: ResearchGraph, noveltyScore: number, audienceScore = 82, saturationPenalty=0): OpportunityScore {
  const families=sourceFamilies(graph);const primary=primarySourceCount(graph);const evidence=clamp(graph.findings.length*6+graph.sources.length*4+families*9+(graph.confidence==="high"?18:graph.confidence==="medium"?9:0)+(graph.sufficient?10:0));
  const ageHours=Math.max(0,(Date.now()-Date.parse(graph.knowledgeCutoff||graph.generatedAt))/3_600_000);const freshness=graph.plan.freshness==="historical"?92:clamp(100-ageHours*1.6);const significance=materiality(graph);const sourceAuthority=clamp(primary*22+families*11+graph.sources.filter(s=>s.tier==="A").length*8);
  const story=clamp(evidence*.28+noveltyScore*.21+freshness*.14+audienceScore*.12+significance*.17+sourceAuthority*.08-saturationPenalty);
  const rationale=[`${graph.findings.length} evidence-backed findings`,`${graph.sources.length} eligible sources across ${families} source families`,`${primary} primary source${primary===1?"":"s"}`,`materiality ${significance}/100`,`novelty ${noveltyScore}/100`,saturationPenalty?`publication saturation penalty -${saturationPenalty}`:"no meaningful saturation penalty"];
  return {story,evidence,novelty:noveltyScore,audience:audienceScore,freshness,significance,saturationPenalty,rationale};
}

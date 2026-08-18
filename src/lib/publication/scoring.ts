import type { ResearchGraph } from "@/lib/research/types";
import type { OpportunityScore } from "@/lib/publication/types";

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

export function sourceFamilies(graph: ResearchGraph) {
  return new Set(graph.sources.map(s => s.independenceFamily || s.provider)).size;
}

export function primarySourceCount(graph: ResearchGraph) {
  return graph.sources.filter(s => s.kind === "primary").length;
}

export function scoreOpportunity(graph: ResearchGraph, noveltyScore: number, audienceScore = 90): OpportunityScore {
  const families = sourceFamilies(graph);
  const primary = primarySourceCount(graph);
  const evidence = clamp(
    graph.findings.length * 7 +
    graph.sources.length * 5 +
    families * 8 +
    (graph.confidence === "high" ? 20 : graph.confidence === "medium" ? 10 : 0)
  );
  const ageHours = Math.max(0, (Date.now() - Date.parse(graph.knowledgeCutoff || graph.generatedAt)) / 3_600_000);
  const freshness = graph.plan.freshness === "historical"
    ? 95
    : clamp(100 - ageHours * 2);
  const story = clamp(
    evidence * 0.34 +
    noveltyScore * 0.24 +
    freshness * 0.18 +
    audienceScore * 0.12 +
    Math.min(100, primary * 25 + families * 12) * 0.12
  );
  const rationale = [
    `${graph.findings.length} evidence-backed findings`,
    `${graph.sources.length} eligible sources across ${families} source families`,
    `${primary} primary source${primary === 1 ? "" : "s"}`,
    `research confidence ${graph.confidence}`,
    `novelty ${noveltyScore}/100`
  ];
  return { story, evidence, novelty: noveltyScore, audience: audienceScore, freshness, rationale };
}

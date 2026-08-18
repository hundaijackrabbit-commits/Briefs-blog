import type { ArticleDraft, OriginalityReport, PublicationQualityReport } from "@/lib/publication/types";
import type { ResearchGraph } from "@/lib/research/types";
import { evaluateVoice } from "@/lib/publication/voice";
import { readerContract } from "@/lib/publication/audience";

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

export function evaluatePublicationQuality(args: {
  draft: ArticleDraft;
  graph: ResearchGraph;
  originality: OriginalityReport;
  minSources: number;
  requirePrimary: boolean;
  minStoryScore: number;
  storyScore: number;
  independentFamilies: number;
  primarySources: number;
}): PublicationQualityReport {
  const { draft, graph, originality } = args;
  const allowedClaims = new Set(graph.findings.map(f => f.id));
  const usedClaims = new Set(draft.sections.flatMap(s => s.claimIds));
  const unsupportedClaimIds = [...usedClaims].filter(id => !allowedClaims.has(id));
  const evidenceCoverage = usedClaims.size
    ? clamp(([...usedClaims].filter(id => allowedClaims.has(id)).length / usedClaims.size) * 100)
    : 0;

  const fullText = [draft.title, draft.deck, ...draft.sections.map(s => `${s.heading}\n${s.body}`)].join("\n\n");
  const voice = evaluateVoice(fullText);
  const audience = readerContract(draft.audience);
  let audienceScore = 92;
  if (draft.sections[0]?.body.length < 80) audienceScore -= 12;
  if (fullText.length < 650) audienceScore -= 8;
  if (draft.sections.length < 4) audienceScore -= 10;

  const diversity = clamp(args.independentFamilies * 24 + Math.min(args.primarySources, 2) * 12);
  const originalityScore = originality.passed
    ? clamp(100 - originality.maxSourceOverlap * 220 - originality.maxLibraryOverlap * 120)
    : clamp(55 - originality.longestMatchingWords);
  const freshnessScore = graph.plan.freshness === "historical" ? 95 :
    clamp(100 - Math.max(0, (Date.now() - Date.parse(graph.knowledgeCutoff)) / 3_600_000) * 2);

  const blockers: string[] = [];
  const warnings = [...voice.warnings, ...originality.warnings];
  const minimumGroundedClaims = Math.min(2, graph.findings.length);
  if (usedClaims.size < minimumGroundedClaims) blockers.push(`Draft uses ${usedClaims.size} grounded claim(s); at least ${minimumGroundedClaims} are required.`);
  if (graph.sources.length < args.minSources) blockers.push(`Needs at least ${args.minSources} eligible sources.`);
  if (args.requirePrimary && args.primarySources < 1) blockers.push("A primary source is required for this keyword.");
  if (args.independentFamilies < 2) blockers.push("Needs evidence from at least two independent source families.");
  if (!originality.passed) blockers.push("Originality gate failed.");
  if (unsupportedClaimIds.length) blockers.push(`${unsupportedClaimIds.length} draft claim reference(s) are not present in the research graph.`);
  if (!graph.sufficient) blockers.push("Research is not sufficient to support publication.");
  if (args.storyScore < args.minStoryScore) blockers.push(`Story score ${args.storyScore} is below the ${args.minStoryScore} threshold.`);
  if (voice.score < 72) blockers.push("Voice quality is below the publication threshold.");

  const totalScore = clamp(
    evidenceCoverage * 0.24 +
    diversity * 0.18 +
    originalityScore * 0.18 +
    audienceScore * 0.14 +
    voice.score * 0.14 +
    freshnessScore * 0.12
  );

  return {
    passed: blockers.length === 0 && totalScore >= 82,
    totalScore,
    evidenceCoverage,
    evidenceDiversity: diversity,
    originalityScore,
    audienceScore: clamp(audienceScore),
    voiceScore: voice.score,
    freshnessScore,
    unsupportedFacts: unsupportedClaimIds.length,
    blockers,
    warnings: [...warnings, `Audience contract: ${audience.desiredOutcome}`]
  };
}

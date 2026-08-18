import type { ResearchGraph } from "@/lib/research/types";

export type PublicationAudience =
  | "smart-generalist"
  | "executive"
  | "investor"
  | "developer"
  | "student"
  | "marketer";

export type EditorialMode = "auto" | "review" | "manual";

export type ReaderContract = {
  key: PublicationAudience;
  label: string;
  assumedKnowledge: string;
  desiredOutcome: string;
  tone: string;
  vocabulary: string;
  openingInstruction: string;
};

export type VoiceContract = {
  key: "briefs";
  description: string;
  bannedPhrases: string[];
  principles: string[];
};

export type ArticleSectionDraft = {
  key: string;
  heading: string;
  body: string;
  claimIds: string[];
};

export type ArticleDraft = {
  title: string;
  deck: string;
  category: string;
  audience: PublicationAudience;
  articleType: "briefing" | "explainer" | "analysis";
  sections: ArticleSectionDraft[];
  claimIds: string[];
  generatedBy: "briefs-deterministic" | "configured-writer";
};

export type OpportunityScore = {
  story: number;
  evidence: number;
  novelty: number;
  audience: number;
  freshness: number;
  rationale: string[];
};

export type OriginalityReport = {
  passed: boolean;
  maxSourceOverlap: number;
  maxLibraryOverlap: number;
  longestMatchingWords: number;
  warnings: string[];
};

export type PublicationQualityReport = {
  passed: boolean;
  totalScore: number;
  evidenceCoverage: number;
  evidenceDiversity: number;
  originalityScore: number;
  audienceScore: number;
  voiceScore: number;
  freshnessScore: number;
  unsupportedFacts: number;
  blockers: string[];
  warnings: string[];
};

export type PublicationResearch = {
  graph: ResearchGraph;
  opportunity: OpportunityScore;
  primarySourceCount: number;
  independentFamilies: number;
};

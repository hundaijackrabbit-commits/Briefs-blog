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
  version: string;
  description: string;
  bannedPhrases: string[];
  principles: string[];
};

export type ArticleSectionDraft = {
  key: string;
  heading: string;
  body: string;
  claimIds: string[];
  purpose?:"answer"|"evidence"|"context"|"analysis"|"watch"|"method";
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

export type StoryAngle={
  key:string;
  title:string;
  thesis:string;
  score:number;
  evidenceScore:number;
  noveltyScore:number;
  audienceScore:number;
  riskScore:number;
  claimIds:string[];
  rationale:string[];
};

export type StoryContract={
  angleKey:string;
  angle:string;
  thesis:string;
  whyNow:string;
  audience:PublicationAudience;
  readerOutcome:string;
  differentiator:string;
  strongestClaimIds:string[];
  counterClaimIds:string[];
  cannotClaim:string[];
};

export type OpportunityScore = {
  story: number;
  evidence: number;
  novelty: number;
  audience: number;
  freshness: number;
  significance:number;
  saturationPenalty:number;
  rationale: string[];
};

export type OriginalityReport = {
  passed: boolean;
  maxSourceOverlap: number;
  maxLibraryOverlap: number;
  longestMatchingWords: number;
  warnings: string[];
};

export type AudienceFitReport={
  score:number;
  goalScore:number;
  expertiseScore:number;
  openingScore:number;
  jargonScore:number;
  warnings:string[];
};

export type PublicationQualityReport = {
  passed: boolean;
  totalScore: number;
  evidenceCoverage: number;
  evidenceDiversity: number;
  originalityScore: number;
  audienceScore: number;
  readerGoalScore:number;
  voiceScore: number;
  freshnessScore: number;
  headlineScore:number;
  specificityScore:number;
  unsupportedFacts: number;
  blockers: string[];
  warnings: string[];
};

export type PublicationResearch = {
  graph: ResearchGraph;
  opportunity: OpportunityScore;
  primarySourceCount: number;
  independentFamilies: number;
  saturationPenalty:number;
};

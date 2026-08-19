import type { ResearchEventAnchor } from "@/lib/research/types";

export type GlobalCategory = "World"|"Business"|"Markets"|"Technology"|"Science"|"Policy"|"Culture";
export type GlobalRegion = "North America"|"Latin America"|"Europe"|"Africa"|"Middle East"|"South Asia"|"East Asia"|"Southeast Asia"|"Oceania"|"Global";

export type GlobalArticleSeed = {
  url:string;
  title:string;
  domain:string;
  sourceCountry:string|null;
  publishedAt:string|null;
  category:GlobalCategory;
  regionHints:GlobalRegion[];
};

export type GlobalEventCandidate = {
  eventKey:string;
  subject:string;
  researchQuery:string;
  eventAnchor:ResearchEventAnchor;
  clusterCoherence:number;
  category:GlobalCategory;
  titles:string[];
  urls:string[];
  domains:string[];
  sourceCountries:string[];
  regions:GlobalRegion[];
  mentionCount:number;
  newestAt:string|null;
};

export type GlobalImportanceDimensions = {
  geographicReach:number;
  humanConsequence:number;
  economicConsequence:number;
  politicalImpact:number;
  longTermConsequence:number;
  surpriseVelocity:number;
  publicAttention:number;
  evidenceBreadth:number;
};

export type GlobalScoredCandidate = GlobalEventCandidate & GlobalImportanceDimensions & {
  importanceScore:number;
  distinctivenessScore:number;
  repeatPenalty:number;
  finalScore:number;
  materialChangeOverride:boolean;
  rationale:string[];
};

export type DailyFlagshipResult = {
  status:"selected"|"drafted"|"published"|"research-required"|"already-selected"|"disabled";
  editorialDay:string;
  candidateId?:string;
  subject?:string;
  category?:GlobalCategory;
  finalScore?:number;
  opportunityId?:string;
  articleId?:string;
  articleStatus?:string;
  reason?:string;
};

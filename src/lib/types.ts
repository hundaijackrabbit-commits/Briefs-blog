export type FreshnessClass = "live" | "current" | "slow" | "static";
export type Confidence = "high" | "medium" | "low";
export type ReviewStatus = "auto" | "review" | "manual";

export type Source = {
  id: string;
  name: string;
  url: string;
  sourceType: "primary" | "reporting" | "specialist" | "discovery";
  tier: "A" | "B" | "C" | "D";
};

export type Claim = {
  id: string;
  entityId: string;
  key: string;
  value: string;
  freshnessClass: FreshnessClass;
  confidence: Confidence;
  sourceIds: string[];
  lastVerifiedAt: string;
};

export type Brief = {
  id: string;
  slug: string;
  title: string;
  deck: string;
  category: string;
  answer: string;
  whyItMatters: string;
  context: string;
  watchNext: string[];
  claimIds: string[];
  sourceIds: string[];
  lastVerifiedAt: string;
  lastSubstantialUpdateAt: string;
  freshnessScore: number;
  readingMinutes: number;
};

export type ReviewItem = {
  id: string;
  briefId: string;
  title: string;
  reason: string;
  confidence: Confidence;
  mode: ReviewStatus;
  detectedAt: string;
};

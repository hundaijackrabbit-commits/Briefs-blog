import type { Tier } from "@/lib/types";

export type ResearchIntent="explain"|"compare"|"current"|"history"|"person"|"organization"|"work"|"finance"|"general";

export type ResearchQueryPlan={
  original:string;
  normalized:string;
  intent:ResearchIntent;
  subjects:string[];
  freshness:"live"|"current"|"historical";
  maxSources:number;
};

export type ResearchSource={
  id:string;
  provider:"wikipedia"|"wikidata"|"openalex"|"external";
  name:string;
  title:string;
  url:string;
  tier:Tier;
  kind:"reference"|"structured"|"primary"|"specialist"|"reporting"|"discovery";
  retrievedAt:string;
  publishedAt?:string|null;
  excerpt:string;
  authority:number;
  independenceFamily:string;
  metadata?:Record<string,unknown>;
};

export type ResearchFinding={
  id:string;
  subject:string;
  predicate:string;
  valueText:string;
  statement:string;
  sourceIds:string[];
  confidence:"high"|"medium"|"low";
  verificationStatus:"confirmed"|"corroborated"|"reported"|"unverified";
};

export type ResearchEventAnchor={
  version:"1.0";
  subject:string;
  distinctiveTerms:string[];
  actionTerms:string[];
  topicTerms:string[];
  geographyTerms:string[];
  entityTerms:string[];
  eventTime:string|null;
};

export type ResearchSourceAlignment={
  sourceId:string;
  score:number;
  topic:number;
  action:number;
  geography:number;
  temporal:number;
  temporalStatus:"current"|"aging"|"stale";
  corroboration:number;
  negativePenalty:number;
  matchedDistinctive:string[];
  passed:boolean;
};

export type ResearchSubjectAlignment={
  version:"1.0";
  selectedSubject:string;
  anchor:ResearchEventAnchor;
  queries:string[];
  sourceScores:ResearchSourceAlignment[];
  alignedSourceIds:string[];
  rejectedSourceIds:string[];
  staleSourceIds:string[];
  alignedFamilies:number;
  score:number;
  entityCoverage:number;
  actionCoverage:number;
  temporalAlignment:number;
  coverageRatio:number;
  clusterCoherence:number|null;
  passed:boolean;
  repaired:boolean;
  reasons:string[];
};

export type ResearchGraph={
  runId:string;
  plan:ResearchQueryPlan;
  canonicalSubject:string;
  description:string;
  findings:ResearchFinding[];
  sources:ResearchSource[];
  discoveredUrls:string[];
  missingEvidence:string[];
  confidence:"high"|"medium"|"low";
  sufficient:boolean;
  generatedAt:string;
  knowledgeCutoff:string;
  iterations?:{iteration:number;gapKind:string;reason:string;nextQuery:string}[];
  comparison?:{subject:string;summary:string;factCount:number;sourceCount:number}[];
  stopReason?:"sufficient"|"budget"|"no-progress"|"provider-limits";
  alignment?:ResearchSubjectAlignment;
  persisted?:boolean;
};

export interface ResearchProvider {
  id:string;
  research(subject:string,plan:ResearchQueryPlan):Promise<{canonicalSubject?:string;description?:string;findings:ResearchFinding[];sources:ResearchSource[];discoveredUrls?:string[]}>;
}

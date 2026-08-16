import type { Tier } from "@/lib/types";

export type ResearchIntent="explain"|"compare"|"current"|"history"|"person"|"organization"|"work"|"general";

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
  provider:"wikipedia"|"wikidata"|"external";
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
};

export interface ResearchProvider {
  id:string;
  research(subject:string,plan:ResearchQueryPlan):Promise<{canonicalSubject?:string;description?:string;findings:ResearchFinding[];sources:ResearchSource[];discoveredUrls?:string[]}>;
}

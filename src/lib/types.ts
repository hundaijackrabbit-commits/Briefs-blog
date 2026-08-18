export type Tier = "A"|"B"|"C"|"D";
export type SourceType = "primary"|"reporting"|"specialist"|"discovery";
export type Verification = "confirmed"|"corroborated"|"reported"|"estimated"|"disputed"|"unverified"|"retracted";
export type ReviewMode = "auto"|"review"|"manual";
export type JobType = "ingest"|"normalize"|"cluster"|"understand"|"resolve"|"extract"|"verify"|"compare"|"temporal"|"impact"|"review"|"publish"|"snapshot"|"quality"|"reconcile"|"research";
export type BriefDepth = "flash"|"quick"|"standard"|"deep"|"research";
export type BriefPerspective = "general"|"executive"|"investor"|"developer"|"student"|"marketer";
export type EvidenceStance = "supports"|"conflicts"|"mentions";

export interface SourceRecord { id:string; name:string; url:string; feed_url:string|null; source_type:SourceType; tier:Tier; ingestion_method:string; topics:string[]; poll_interval_minutes:number; request_timeout_ms:number; max_retries:number; consecutive_failures:number; circuit_open_until:Date|null; last_checked_at:Date|null; last_success_at:Date|null; }
export interface NormalizedDocument { sourceId:string; externalKey:string|null; canonicalUrl:string; title:string; excerpt:string|null; body:string|null; authors:string[]; language:string; publishedAt:Date|null; retrievedAt:Date; contentHash:string; metadata:Record<string,unknown>; }
export interface CandidateClaim { entityId:string; predicate:string; valueText:string; freshnessClass:"live"|"current"|"slow"|"static"; confidence:"high"|"medium"|"low"; documentIds:string[]; validFrom?:Date|null; validTo?:Date|null; }

export interface SemanticFrame {
  entities:string[];
  concepts:string[];
  dates:string[];
  quantities:string[];
  action:string|null;
  negated:boolean;
  temporalHints:{kind:"before"|"after"|"during"|"current";value:string}[];
}

export interface ResolvedEntity {
  entityId:string;
  name:string;
  entityType:string;
  confidence:number;
  matchedBy:"id"|"identifier"|"exact"|"alias"|"context";
}

export interface EvidenceAssessment {
  status:Verification;
  confidence:"high"|"medium"|"low";
  independentSources:number;
  primarySources:number;
  supporting:number;
  conflicting:number;
  score:number;
}

export interface BriefContextSnapshot {
  conversationId?:string;
  rootSubject:string;
  priorQueries:string[];
  entityHints:string[];
  claimIds:string[];
  sourceIds:string[];
}

export interface BriefRequest {
  subject:string;
  entityIds?:string[];
  timeRange?:{from?:string;to?:string};
  depth:BriefDepth;
  perspective:BriefPerspective;
  sourcePolicy?:"verified"|"primary-only"|"academic"|"news"|"all";
  freshnessRequirement?:"current"|"recent"|"historical";
  format?:"web"|"chat"|"email"|"audio"|"api";
  context?:BriefContextSnapshot;
}

export interface BriefPlan {
  subject:string;
  resolvedEntityIds:string[];
  requiredClaimIds:string[];
  recentChangeIds:string[];
  missingEvidence:string[];
  researchNeeded:boolean;
  depth:BriefDepth;
  perspective:BriefPerspective;
}

export interface BriefSource { id:string; name:string; url:string; tier:Tier; kind:string; }

export interface BriefResult {
  subject:string;
  summary:string;
  keyChanges:{summary:string;changedAt:string;importance:number}[];
  whyItMatters:string;
  keyNumbers:{label:string;value:string;claimId:string}[];
  keyFacts:{label:string;value:string;text:string;claimId:string;sourceIds:string[]}[];
  watchItems:string[];
  claimIds:string[];
  evidenceIds:string[];
  sources:BriefSource[];
  confidence:"high"|"medium"|"low";
  generatedAt:string;
  knowledgeCutoff:string;
  researchNeeded:boolean;
  sourceMode:"database"|"starter"|"research"|"empty";
  intent?:string;
  lens?:string;
  freshnessStatus?:"live"|"current"|"historical";
  context?:BriefContextSnapshot;
  comparison?:{subject:string;summary:string;factCount:number;sourceCount:number}[];
}

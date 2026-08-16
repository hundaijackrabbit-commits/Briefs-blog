export type Tier = "A"|"B"|"C"|"D";
export type SourceType = "primary"|"reporting"|"specialist"|"discovery";
export type Verification = "confirmed"|"corroborated"|"reported"|"estimated"|"disputed"|"unverified"|"retracted";
export type ReviewMode = "auto"|"review"|"manual";
export type JobType = "ingest"|"normalize"|"cluster"|"extract"|"verify"|"compare"|"impact"|"review"|"publish"|"reconcile";

export interface SourceRecord { id:string; name:string; url:string; feed_url:string|null; source_type:SourceType; tier:Tier; ingestion_method:string; topics:string[]; poll_interval_minutes:number; request_timeout_ms:number; max_retries:number; consecutive_failures:number; circuit_open_until:Date|null; last_checked_at:Date|null; last_success_at:Date|null; }
export interface NormalizedDocument { sourceId:string; externalKey:string|null; canonicalUrl:string; title:string; excerpt:string|null; body:string|null; authors:string[]; language:string; publishedAt:Date|null; retrievedAt:Date; contentHash:string; metadata:Record<string,unknown>; }
export interface CandidateClaim { entityId:string; predicate:string; valueText:string; freshnessClass:"live"|"current"|"slow"|"static"; confidence:"high"|"medium"|"low"; documentIds:string[]; }

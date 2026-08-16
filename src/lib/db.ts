import postgres from "postgres";
import { briefs as demoBriefs, claims as demoClaims, reviewQueue as demoQueue, sources as demoSources } from "./demo-data";
import type { Brief, Claim, ReviewItem, Source } from "./types";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const sql = hasDatabase ? postgres(process.env.DATABASE_URL!, { prepare:false }) : null;

export async function getBriefs(): Promise<Brief[]> {
  if (!sql) return demoBriefs;
  const rows = await sql`select * from briefs where status = 'published' order by last_verified_at desc`;
  return rows.map(mapBrief);
}

export async function getBriefBySlug(slug:string): Promise<Brief | null> {
  if (!sql) return demoBriefs.find((b)=>b.slug===slug) ?? null;
  const rows = await sql`select * from briefs where slug=${slug} and status='published' limit 1`;
  return rows[0] ? mapBrief(rows[0]) : null;
}

export async function getSourcesByIds(ids:string[]): Promise<Source[]> {
  if (!ids.length) return [];
  if (!sql) return demoSources.filter((s)=>ids.includes(s.id));
  const rows = await sql`select id, name, url, source_type, tier from sources where id = any(${ids})`;
  return rows.map((r:any)=>({ id:r.id, name:r.name, url:r.url, sourceType:r.source_type, tier:r.tier }));
}

export async function getClaimsByIds(ids:string[]): Promise<Claim[]> {
  if (!ids.length) return [];
  if (!sql) return demoClaims.filter((c)=>ids.includes(c.id));
  const rows = await sql`select * from claims where id = any(${ids})`;
  return rows.map((r:any)=>({ id:r.id, entityId:r.entity_id, key:r.claim_key, value:r.claim_value, freshnessClass:r.freshness_class, confidence:r.confidence, sourceIds:r.source_ids ?? [], lastVerifiedAt:r.last_verified_at.toISOString() }));
}

export async function getReviewQueue(): Promise<ReviewItem[]> {
  if (!sql) return demoQueue;
  const rows = await sql`select * from review_queue where status='open' order by detected_at desc limit 100`;
  return rows.map((r:any)=>({ id:r.id, briefId:r.brief_id, title:r.title, reason:r.reason, confidence:r.confidence, mode:r.review_mode, detectedAt:r.detected_at.toISOString() }));
}

function mapBrief(r:any): Brief {
  return {
    id:r.id, slug:r.slug, title:r.title, deck:r.deck, category:r.category,
    answer:r.answer, whyItMatters:r.why_it_matters, context:r.context,
    watchNext:r.watch_next ?? [], claimIds:r.claim_ids ?? [], sourceIds:r.source_ids ?? [],
    lastVerifiedAt:r.last_verified_at.toISOString(), lastSubstantialUpdateAt:r.last_substantial_update_at.toISOString(),
    freshnessScore:r.freshness_score, readingMinutes:r.reading_minutes
  };
}

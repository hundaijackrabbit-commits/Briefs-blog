import type { Claim, FreshnessClass } from "../types";

const MAX_AGE_DAYS: Record<FreshnessClass, number> = { live:1, current:7, slow:90, static:365 };

export function claimIsStale(claim: Claim, now = new Date()): boolean {
  const ageMs = now.getTime() - new Date(claim.lastVerifiedAt).getTime();
  return ageMs > MAX_AGE_DAYS[claim.freshnessClass] * 86_400_000;
}

export function calculateFreshnessScore(claims: Claim[], now = new Date()): number {
  if (!claims.length) return 100;
  const scores = claims.map((claim) => {
    const maxAge = MAX_AGE_DAYS[claim.freshnessClass] * 86_400_000;
    const age = Math.max(0, now.getTime() - new Date(claim.lastVerifiedAt).getTime());
    return Math.max(0, 100 - (age / maxAge) * 100);
  });
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
}

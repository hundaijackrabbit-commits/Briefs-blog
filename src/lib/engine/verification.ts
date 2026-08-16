import type { Tier, Verification } from "@/lib/types";
export function verifyEvidence(evidence:{tier:Tier;stance:"supports"|"conflicts"|"mentions";independentKey:string}[]):{status:Verification;confidence:"high"|"medium"|"low";conflict:boolean}{
  const supports=evidence.filter(e=>e.stance==='supports'), conflicts=evidence.filter(e=>e.stance==='conflicts');
  const independent=new Set(supports.map(e=>e.independentKey)).size;
  const hasPrimary=supports.some(e=>e.tier==='A');
  if(conflicts.length) return {status:'disputed',confidence:hasPrimary?'medium':'low',conflict:true};
  if(hasPrimary) return {status:'confirmed',confidence:'high',conflict:false};
  if(independent>=2 && supports.some(e=>e.tier==='B')) return {status:'corroborated',confidence:'high',conflict:false};
  if(supports.some(e=>e.tier==='B'||e.tier==='C')) return {status:'reported',confidence:'medium',conflict:false};
  return {status:'unverified',confidence:'low',conflict:false};
}

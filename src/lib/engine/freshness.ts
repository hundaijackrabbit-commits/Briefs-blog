export const FRESHNESS_DAYS={live:1,current:14,slow:120,static:365} as const;
export function claimFreshnessScore(kind:keyof typeof FRESHNESS_DAYS,lastVerified:Date|null,now=new Date()){
  if(!lastVerified) return 0; const age=(now.getTime()-lastVerified.getTime())/86400000; const ttl=FRESHNESS_DAYS[kind]; return Math.max(0,Math.min(100,Math.round(100-(age/ttl)*100)));
}
export function briefFreshness(scores:number[]){return scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;}

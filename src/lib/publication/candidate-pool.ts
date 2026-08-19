type PoolCandidate={
  domains:string[];
  mentionCount:number;
  candidateIntegrityScore?:number;
};

export function orderDiscoveryCandidates<T extends PoolCandidate>(candidates:T[]){
  return [...candidates].sort((a,b)=>
    b.domains.length-a.domains.length||
    b.mentionCount-a.mentionCount||
    Number(b.candidateIntegrityScore||0)-Number(a.candidateIntegrityScore||0)
  );
}

export function rankingInput<T>(candidates:T[],limit=120){
  return candidates.slice(0,Math.max(1,limit));
}

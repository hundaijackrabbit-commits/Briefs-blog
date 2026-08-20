export type GroundedExpansionCandidate={id:string;sentence:string};

function words(value:string){
  return String(value||"").trim().split(/\s+/).filter(Boolean).length;
}
function append(body:string,sentence:string){
  const left=String(body||"").trim(),right=String(sentence||"").trim();
  return [left,right].filter(Boolean).join(" ");
}

export function augmentGroundedDepth(args:{
  answerBody:string;
  evidenceBody:string;
  answerClaimIds:string[];
  evidenceClaimIds:string[];
  otherNarrativeText:string;
  candidates:GroundedExpansionCandidate[];
  targetNarrativeWords?:number;
  targetEvidenceWords?:number;
}){
  const targetNarrativeWords=args.targetNarrativeWords??180;
  const targetEvidenceWords=args.targetEvidenceWords??24;
  let answerBody=args.answerBody;
  let evidenceBody=args.evidenceBody;
  const answerClaimIds=[...args.answerClaimIds];
  const evidenceClaimIds=[...args.evidenceClaimIds];
  const used=new Set([...answerClaimIds,...evidenceClaimIds]);

  const narrativeWords=()=>words(args.otherNarrativeText)+words(answerBody)+words(evidenceBody);

  for(const candidate of args.candidates){
    if(!candidate.id||!candidate.sentence.trim()||used.has(candidate.id))continue;
    if(words(evidenceBody)>=targetEvidenceWords&&narrativeWords()>=targetNarrativeWords)break;

    const needsEvidence=words(evidenceBody)<targetEvidenceWords;
    const putInEvidence=needsEvidence||words(evidenceBody)<=words(answerBody);

    if(putInEvidence){
      evidenceBody=append(evidenceBody,candidate.sentence);
      evidenceClaimIds.push(candidate.id);
    }else{
      answerBody=append(answerBody,candidate.sentence);
      answerClaimIds.push(candidate.id);
    }
    used.add(candidate.id);
  }

  return {
    answerBody,
    evidenceBody,
    answerClaimIds:[...new Set(answerClaimIds)],
    evidenceClaimIds:[...new Set(evidenceClaimIds)],
    narrativeWords:narrativeWords(),
    evidenceWords:words(evidenceBody),
    targetNarrativeWords,
    targetEvidenceWords
  };
}

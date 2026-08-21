function words(value:string){
  return String(value||"").trim().split(/\s+/).filter(Boolean).length;
}
function append(body:string,sentence:string){
  const left=String(body||"").trim(),right=String(sentence||"").trim();
  return [left,right].filter(Boolean).join(" ");
}

const DEFAULT_BRIDGES=[
  "That distinction matters because the observed event and its downstream consequences are different questions; confidence in one does not automatically establish the other.",
  "The useful next step is to keep verified developments separate from projections until additional evidence changes the picture.",
  "That boundary is part of the answer, not a gap to fill with speculation."
];

export function augmentInterpretiveDepth(args:{
  body:string;
  currentNarrativeWords:number;
  targetNarrativeWords?:number;
  bridges?:string[];
}){
  const targetNarrativeWords=args.targetNarrativeWords??180;
  let body=String(args.body||"").trim();
  let narrativeWords=Math.max(0,Math.round(args.currentNarrativeWords||0));
  const added:string[]=[];

  for(const bridge of args.bridges??DEFAULT_BRIDGES){
    const sentence=String(bridge||"").replace(/\s+/g," ").trim();
    if(!sentence||narrativeWords>=targetNarrativeWords)break;
    body=append(body,sentence);
    narrativeWords+=words(sentence);
    added.push(sentence);
  }

  return {body,narrativeWords,added,targetNarrativeWords};
}

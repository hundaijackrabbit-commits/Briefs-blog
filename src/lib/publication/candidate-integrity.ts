import type { ResearchEventAnchor } from "@/lib/research/types";
import { eventTokens,eventhoodScore,pairwiseClusterCoherence,titleEventAlignment } from "@/lib/publication/event-identity";

const LOW_SIGNAL_TOPIC=new Set([
  "piece","missing","need","needs","supply","chain","market","markets","industry","industries",
  "sector","sectors","business","businesses","company","companies","system","systems","future",
  "problem","problems","challenge","challenges","plan","plans","question","questions","thing","things",
  "high","highest","low","lowest","level","levels","major","key","important","latest","new"
]);

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function unique<T>(items:T[]){return [...new Set(items)];}

export type CandidateIntegrityReport={
  candidateIntegrityScore:number;
  candidateIntegrityPassed:boolean;
  eventhoodScore:number;
  pairwiseCoherence:number;
  highSignalTerms:string[];
  highSignalSupport:number;
  integrityReasons:string[];
};

function highSignalTerms(anchor:ResearchEventAnchor){
  return unique(anchor.topicTerms.filter(term=>!LOW_SIGNAL_TOPIC.has(term)));
}
function titleSupport(anchor:ResearchEventAnchor,title:string,signals:string[]){
  const tokens=new Set(eventTokens(title));
  const signalHits=signals.filter(term=>tokens.has(term)).length;
  const actionHits=anchor.actionTerms.filter(term=>tokens.has(term)).length;
  if(anchor.actionTerms.length)return (actionHits>=1&&signalHits>=1)||signalHits>=2||(!signals.length&&actionHits>=1);
  return signalHits>=1;
}

export function evaluateCandidateIntegrity(args:{eventAnchor:ResearchEventAnchor;titles:string[];clusterCoherence:number}):CandidateIntegrityReport{
  const {eventAnchor,titles,clusterCoherence}=args;
  const signals=highSignalTerms(eventAnchor);
  const eventhood=eventhoodScore(eventAnchor,titles);
  const pairwise=pairwiseClusterCoherence(titles);
  const supportCount=titles.filter(title=>titleSupport(eventAnchor,title,signals)).length;
  const supportRatio=titles.length?supportCount/titles.length:0;
  const anchorAgreement=titles.length?titles.map(title=>titleEventAlignment(eventAnchor,title)).reduce((a,b)=>a+b,0)/titles.length:0;
  const lowSignalRatio=eventAnchor.topicTerms.length?eventAnchor.topicTerms.filter(term=>LOW_SIGNAL_TOPIC.has(term)).length/eventAnchor.topicTerms.length:0;

  let score=clusterCoherence*.30+eventhood*.25+pairwise*.15+supportRatio*100*.20+anchorAgreement*.10;
  if(!eventAnchor.actionTerms.length&&lowSignalRatio>=.5)score-=10;
  if(!signals.length&&!eventAnchor.actionTerms.length)score-=18;
  score=clamp(score);

  const requiredSupport=titles.length>=2?2:1;
  const reasons:string[]=[];
  if(clusterCoherence<52)reasons.push(`cluster coherence ${clusterCoherence}/100 is below 52`);
  if(eventhood<45)reasons.push(`eventhood ${eventhood}/100 is below 45`);
  if(supportCount<requiredSupport)reasons.push(`only ${supportCount} title(s) independently support a high-signal event anchor; ${requiredSupport} required`);
  if(!signals.length&&!eventAnchor.actionTerms.length)reasons.push("subject has no high-signal topic term or concrete action");
  if(score<60)reasons.push(`candidate integrity ${score}/100 is below 60`);

  return {
    candidateIntegrityScore:score,
    candidateIntegrityPassed:reasons.length===0,
    eventhoodScore:eventhood,
    pairwiseCoherence:pairwise,
    highSignalTerms:signals,
    highSignalSupport:supportCount,
    integrityReasons:reasons
  };
}

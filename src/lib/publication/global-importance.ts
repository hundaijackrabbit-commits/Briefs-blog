import type { GlobalEventCandidate,GlobalImportanceDimensions } from "@/lib/publication/global-types";

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function hay(candidate:GlobalEventCandidate){return `${candidate.subject} ${candidate.titles.join(" ")}`.toLowerCase();}
function hits(text:string,terms:string[]){return terms.reduce((sum,term)=>sum+(text.includes(term)?1:0),0);}

const HUMAN=["killed","dead","death","injured","casualties","displaced","refugee","famine","hunger","evacuation","earthquake","flood","wildfire","hurricane","cyclone","outbreak","pandemic","disease","hospital","hostage","attack","war","strike","explosion","crash"];
const ECON=["billion","trillion","economy","economic","inflation","interest rate","central bank","trade","tariff","sanction","oil","gas","bank","currency","debt","market","stocks","bonds","recession","gdp","supply chain","shipping"];
const POLITICAL=["election","president","prime minister","government","parliament","congress","court","supreme court","law","regulation","treaty","sanction","ceasefire","war","coup","protest","diplomacy","minister","resign"];
const LONG=["climate","nuclear","artificial intelligence","semiconductor","regulation","treaty","constitution","infrastructure","energy transition","demographic","migration","education","research","space","pandemic","debt","trade agreement","security alliance"];
const SURPRISE=["breaking","unexpected","emergency","collapse","resign","resigns","attack","invasion","ceasefire","deal reached","verdict","approved","passes","launches","erupts","earthquake","crash","default","bankruptcy","assassination"];

const HIGH_AUTHORITY=/(^|\.)(reuters\.com|apnews\.com|bbc\.(com|co\.uk)|afp\.com|bloomberg\.com|ft\.com|wsj\.com|nytimes\.com|washingtonpost\.com|theguardian\.com|economist\.com|npr\.org|cbc\.ca|abcnews\.go\.com|aljazeera\.com|dw\.com|france24\.com|scmp\.com|nikkei\.com|straitstimes\.com|thehindu\.com|timesofindia\.indiatimes\.com)$/i;

const TRANSNATIONAL=["global","worldwide","international","united nations","g7","g20","nato","european union","who","imf","world bank","trade","sanctions","climate","pandemic","oil","shipping","currency","war"];

export function scoreGlobalImportance(candidate:GlobalEventCandidate):GlobalImportanceDimensions&{importanceScore:number;rationale:string[]}{
  const text=hay(candidate);const families=candidate.domains.length;const countries=candidate.sourceCountries.length;const regions=new Set(candidate.regions.filter(r=>r!=="Global")).size;const trusted=candidate.domains.filter(domain=>HIGH_AUTHORITY.test(domain)).length;
  const geographicReach=clamp(30+Math.min(30,regions*12)+Math.min(20,countries*4)+Math.min(20,hits(text,TRANSNATIONAL)*5));
  const humanConsequence=clamp(22+Math.min(70,hits(text,HUMAN)*11)+(candidate.category==="World"?8:0)+(candidate.category==="Science"?5:0));
  const economicConsequence=clamp(18+Math.min(72,hits(text,ECON)*10)+(["Business","Markets"].includes(candidate.category)?12:0));
  const politicalImpact=clamp(18+Math.min(72,hits(text,POLITICAL)*10)+(["World","Policy"].includes(candidate.category)?12:0));
  const longTermConsequence=clamp(20+Math.min(68,hits(text,LONG)*10)+(["Technology","Science","Policy"].includes(candidate.category)?8:0));
  const surpriseVelocity=clamp(28+Math.min(50,hits(text,SURPRISE)*10)+Math.min(22,candidate.mentionCount*2));
  const publicAttention=clamp(18+Math.min(46,candidate.mentionCount*5)+Math.min(36,families*7));
  const evidenceBreadth=clamp(10+Math.min(42,families*7)+Math.min(24,trusted*8)+Math.min(14,countries*2)+Math.min(10,candidate.urls.length));
  const importanceScore=clamp(geographicReach*.20+humanConsequence*.18+economicConsequence*.14+politicalImpact*.12+longTermConsequence*.12+surpriseVelocity*.08+publicAttention*.06+evidenceBreadth*.10);
  const rationale=[`global reach ${geographicReach}/100`,`human consequence ${humanConsequence}/100`,`economic consequence ${economicConsequence}/100`,`political/institutional impact ${politicalImpact}/100`,`long-term consequence ${longTermConsequence}/100`,`surprise/velocity ${surpriseVelocity}/100`,`public attention ${publicAttention}/100`,`evidence breadth ${evidenceBreadth}/100`,`${families} independent news domains (${trusted} high-authority) across ${Math.max(1,regions)} region${regions===1?"":"s"}`];
  return {geographicReach,humanConsequence,economicConsequence,politicalImpact,longTermConsequence,surpriseVelocity,publicAttention,evidenceBreadth,importanceScore,rationale};
}

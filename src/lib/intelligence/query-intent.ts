import type { BriefPerspective, BriefRequest } from "@/lib/types";

export type QueryDomain="finance"|"current"|"reference"|"general";
export type QueryIntent="market_snapshot"|"market_move"|"financials"|"company"|"current_update"|"compare"|"history"|"person"|"work"|"explain"|"evidence"|"previous_state"|"general";

export type QueryIntentResult={
  domain:QueryDomain;
  intent:QueryIntent;
  original:string;
  normalized:string;
  entityQuery:string;
  tickerHint?:string;
  effectivePerspective:BriefPerspective;
  freshness:"live"|"current"|"historical";
  answerContract:string[];
};

const financeWords=/\b(stock|stocks|share|shares|share price|stock price|ticker|market cap|market capitalization|p\/e|pe ratio|valuation|earnings|revenue|profit|eps|dividend|guidance|investor|financials?|10-k|10-q|8-k|buy|sell|hold)\b/i;
const marketWords=/\b(stock|stocks|share|shares|share price|stock price|ticker|market cap|market capitalization|p\/e|pe ratio|valuation|dividend|buy|sell|hold)\b/i;
const marketMoveWords=/\b(why\s+(?:is|did|has)|up|down|rose|risen|rising|fell|fallen|falling|drop|dropped|jump|jumped|rally|rallied|selloff|sell-off|move|moved)\b/i;
const currentWords=/\b(today|latest|current|now|recent|this week|this month|breaking|news|what changed|since yesterday|since monday)\b/i;
const bareTicker=/^\$?[A-Z]{1,5}$/;
const tickerStopWords=new Set(["AI","CEO","GDP","IPO","SEC","USA","US","UK","WWII"]);

function cleanEntityQuery(subject:string){
  return subject
    .replace(/\b(brief me on|what happened to|what is happening with|why is|why did|why has|should i|would you|can you|tell me about)\b/gi," ")
    .replace(/\b(latest|current|today|now|recent|this week|this month|news|update|updates)\b/gi," ")
    .replace(/\b(stock|stocks|share price|stock price|shares|share|ticker|market cap|market capitalization|p\/e|pe ratio|valuation|earnings|revenue|profit|eps|dividend|guidance|investor|financials?|buy|sell|hold)\b/gi," ")
    .replace(/\b(up|down|rose|risen|rising|fell|fallen|falling|drop|dropped|jump|jumped|rally|rallied|selloff|sell-off|move|moved)\b/gi," ")
    .replace(/[?!.,]+/g," ")
    .replace(/\s+/g," ").trim();
}

function cleanExplainEntityQuery(subject:string){
  return subject
    .replace(/^\s*explain\s+/i,"")
    .replace(/^\s*what\s+(?:is|was|are|were)\s+/i,"")
    .replace(/\s+\b(?:like|as)\s+(?:i(?:'|’)m\s+)?(?:a|an)\s+(?:executive|investor|developer|student|marketer)\b.*$/i,"")
    .replace(/\b(?:in simple terms|simply|to me)\b/gi," ")
    .replace(/[?!.,]+/g," ")
    .replace(/\s+/g," ").trim();
}

function cleanCurrentEntityQuery(subject:string){
  return subject
    .replace(/\b(brief me on|what changed in|what changed with|what happened with|what is happening with|tell me about)\b/gi," ")
    .replace(/\b(latest|current|today|now|recent|this week|this month|breaking|news|updates?|developments?)\b/gi," ")
    .replace(/[?!.,]+/g," ")
    .replace(/\s+/g," ").trim();
}

function tickerFrom(subject:string){
  const paren=subject.match(/\(([A-Z]{1,6})\)/); if(paren) return paren[1];
  const dollar=subject.match(/\$([A-Z]{1,6})\b/); if(dollar) return dollar[1];
  const loneWithFinance=subject.trim().match(/^([A-Z]{1,5})\s+(?:stock|shares|earnings|financials?|revenue|valuation)$/i);
  if(loneWithFinance) return loneWithFinance[1].toUpperCase();
  const lone=subject.trim().toUpperCase();
  if(bareTicker.test(subject.trim())&&!tickerStopWords.has(lone)) return lone.replace(/^\$/,"");
  return undefined;
}

export function classifyQuery(request:BriefRequest):QueryIntentResult{
  const normalized=request.subject.replace(/\s+/g," ").trim().slice(0,200);
  const follow=normalized.match(/^(.+?)\s+[—-]\s+follow-up:\s+(.+)$/i);
  const rootSubject=follow?.[1]?.trim();
  const question=(follow?.[2]||normalized).trim();
  const tickerHint=tickerFrom(rootSubject||normalized);
  const comparison=/\b(vs\.?|versus|compare)\b/i.test(question);
  const finance=financeWords.test(rootSubject||normalized)||financeWords.test(question)||Boolean(tickerHint);
  const market=marketWords.test(rootSubject||normalized)||marketWords.test(question)||Boolean(tickerHint&&bareTicker.test((rootSubject||normalized).trim()));
  const movement=finance&&marketMoveWords.test(question);
  const current=currentWords.test(question)||request.freshnessRequirement==="recent"||movement;
  const previous=/\b(previously believe|previously believed|previously thought|used to believe|previous state|before this|what changed from before)\b/i.test(question);
  const evidence=/\b(evidence|sources?|citations?|support(?:s|ed)? that|prove|provenance)\b/i.test(question);
  const history=/\b(history|historical|origin|timeline|war|ancient|century|founded|began|ww2|wwii)\b/i.test(question)||request.freshnessRequirement==="historical";
  const work=/\b(movie|film|book|album|series|show|game|novel)\b/i.test(question);
  const person=/^who (?:is|was)\b/i.test(question);
  const explain=/^(?:what (?:is|was|are|were)\b|explain\b)/i.test(question);

  let domain:QueryDomain="general";
  let intent:QueryIntent="general";
  if(previous){domain="reference";intent="previous_state";}
  else if(evidence){domain="reference";intent="evidence";}
  else if(finance){domain="finance";intent=movement?"market_move":market?"market_snapshot":"financials";}
  else if(comparison){intent="compare";domain=current?"current":"general";}
  else if(current){domain="current";intent="current_update";}
  else if(history){domain="reference";intent="history";}
  else if(work){domain="reference";intent="work";}
  else if(person){domain="reference";intent="person";}
  else if(explain){domain="reference";intent="explain";}

  const entityQuery=rootSubject||(finance?(cleanEntityQuery(normalized)||tickerHint||normalized):current?(cleanCurrentEntityQuery(normalized)||normalized):explain?(cleanExplainEntityQuery(normalized)||normalized):normalized);
  const perspectiveHint=question.match(/\b(?:like|as)\s+(?:i(?:'|’)m\s+)?(?:a|an)\s+(executive|investor|developer|student|marketer)\b/i)?.[1]?.toLowerCase() as BriefPerspective|undefined;
  const effectivePerspective:BriefPerspective=request.perspective!=="general"?request.perspective:perspectiveHint||(finance?"investor":"general");
  const freshness=previous||history?"historical":finance||current?"live":"current";
  const answerContract=finance?
    [
      "Answer the security/investor question before company history",
      movement?"Explain the move using time-aligned price context and recent catalysts; label inference":"Prioritize price/valuation or reported financial performance",
      "Prefer primary filings for fundamentals",
      "Show market-data freshness explicitly",
      "Separate reported facts from interpretation",
      "Surface catalysts, risks and missing market data"
    ]:
    intent==="evidence"?
    ["Answer with the evidence supporting the existing Brief","Expose source provenance and confidence","Do not replace missing evidence with new assertions"]:
    intent==="previous_state"?
    ["Reconstruct the most recent prior recorded knowledge state","Separate historical Briefs memory from current fact","Say clearly when no prior snapshot exists"]:
    current?
    ["Lead with what changed","Prefer recent reporting and primary sources","Include publication time/freshness","Do not substitute encyclopedia history for current events"]:
    ["Answer the user's phrasing directly","Use evidence-backed facts","Expose uncertainty and source provenance"];

  return {domain,intent,original:request.subject,normalized,entityQuery,tickerHint,effectivePerspective,freshness,answerContract};
}

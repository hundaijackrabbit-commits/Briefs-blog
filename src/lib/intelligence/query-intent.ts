import type { BriefPerspective, BriefRequest } from "@/lib/types";

export type QueryDomain="finance"|"current"|"reference"|"general";
export type QueryIntent="market_snapshot"|"market_move"|"financials"|"company"|"current_update"|"compare"|"history"|"person"|"work"|"explain"|"general";

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
  const tickerHint=tickerFrom(normalized);
  const comparison=/\b(vs\.?|versus|compare)\b/i.test(normalized);
  const finance=financeWords.test(normalized)||Boolean(tickerHint);
  const market=marketWords.test(normalized)||Boolean(tickerHint&&bareTicker.test(normalized.trim()));
  const movement=finance&&marketMoveWords.test(normalized);
  const current=currentWords.test(normalized)||request.freshnessRequirement==="recent"||movement;
  const history=/\b(history|historical|origin|timeline|war|ancient|century|founded|began)\b/i.test(normalized)||request.freshnessRequirement==="historical";
  const work=/\b(movie|film|book|album|series|show|game|novel)\b/i.test(normalized);
  const person=/^who (?:is|was)\b/i.test(normalized);
  const explain=/^what (?:is|was|are|were)\b/i.test(normalized);

  let domain:QueryDomain="general";
  let intent:QueryIntent="general";
  if(finance){domain="finance";intent=movement?"market_move":market?"market_snapshot":"financials";}
  else if(comparison){intent="compare";domain=current?"current":"general";}
  else if(current){domain="current";intent="current_update";}
  else if(history){domain="reference";intent="history";}
  else if(work){domain="reference";intent="work";}
  else if(person){domain="reference";intent="person";}
  else if(explain){domain="reference";intent="explain";}

  const entityQuery=finance?(cleanEntityQuery(normalized)||tickerHint||normalized):normalized;
  const effectivePerspective:BriefPerspective=finance&&request.perspective==="general"?"investor":request.perspective;
  const freshness=history?"historical":finance||current?"live":"current";
  const answerContract=finance?
    [
      "Answer the security/investor question before company history",
      movement?"Explain the move using time-aligned price context and recent catalysts; label inference":"Prioritize price/valuation or reported financial performance",
      "Prefer primary filings for fundamentals",
      "Show market-data freshness explicitly",
      "Separate reported facts from interpretation",
      "Surface catalysts, risks and missing market data"
    ]:
    current?
    ["Lead with what changed","Prefer recent reporting and primary sources","Include publication time/freshness","Do not substitute encyclopedia history for current events"]:
    ["Answer the user's phrasing directly","Use evidence-backed facts","Expose uncertainty and source provenance"];

  return {domain,intent,original:request.subject,normalized,entityQuery,tickerHint,effectivePerspective,freshness,answerContract};
}

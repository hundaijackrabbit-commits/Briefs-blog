import type { BriefRequest } from "@/lib/types";
import type { QueryIntentResult } from "@/lib/intelligence/query-intent";
import { researchSecCompany } from "@/lib/research/providers/sec";
import { alphaVantageQuote } from "@/lib/research/providers/alpha-vantage";
import { researchRecentNews } from "@/lib/research/providers/gdelt";
import { persistChangeCandidates, persistMarketSnapshot } from "@/lib/intelligence/persistence";

function firstValue(findings:Array<{predicate:string;valueText:string}>,predicate:string){return findings.find(f=>f.predicate===predicate)?.valueText;}
function compactHeadline(value:string){return value.replace(/\s+/g," ").trim().replace(/[.!?]+$/," ").trim();}

export async function researchFinance(request:BriefRequest,intent:QueryIntentResult){
  const sec=await researchSecCompany(intent.entityQuery,intent.tickerHint);
  if(!sec) return null;

  const quotePromise=alphaVantageQuote(sec.company.ticker).catch(()=>null);
  const cleanCompany=sec.company.title.replace(/\b(incorporated|inc|corp|corporation|plc|ltd|limited|co)\.?\b/gi," ").replace(/\s+/g," ").trim();
  const newsDepth=request.depth==="research"||request.depth==="deep"?8:5;
  const newsPromise=researchRecentNews(cleanCompany,newsDepth).catch(()=>({findings:[],sources:[]}));
  const [quote,news]=await Promise.all([quotePromise,newsPromise]);

  if(quote) void persistMarketSnapshot({ticker:quote.symbol,provider:"alpha-vantage",price:quote.price,change:quote.change,changePercent:quote.changePercent,volume:quote.volume,marketDate:quote.latestTradingDay,metadata:{freshness:"provider-entitlement"}});

  const allSources=[...(quote?.sources||[]),...sec.sources,...news.sources];
  const sources=request.sourcePolicy==="primary-only"?allSources.filter(s=>s.kind==="primary"):
    request.sourcePolicy==="news"?allSources.filter(s=>s.kind==="reporting"):
    request.sourcePolicy==="academic"?allSources.filter(s=>s.kind==="specialist"&&["A","B"].includes(s.tier)):
    request.sourcePolicy==="all"?allSources:allSources.filter(s=>["A","B"].includes(s.tier));
  const allowed=new Set(sources.map(s=>s.id));
  const findings=[...(quote?.findings||[]),...sec.findings,...news.findings].filter(f=>f.sourceIds.some(id=>allowed.has(id)));

  const price=firstValue(findings,"Latest market quote");
  const revenue=firstValue(findings,"Latest reported revenue");
  const income=firstValue(findings,"Latest reported net income");
  const eps=firstValue(findings,"Latest diluted EPS");
  const ticker=sec.company.ticker;
  const metrics=[revenue&&`revenue ${revenue}`,income&&`net income ${income}`,eps&&`diluted EPS ${eps}`].filter(Boolean).join(", ");
  const eligibleNews=sources.filter(s=>s.kind==="reporting");
  const newsLead=eligibleNews.slice(0,3).map(s=>compactHeadline(s.title)).filter(Boolean).join("; ");
  const quoteEligible=Boolean(quote&&quote.sources.some(s=>allowed.has(s.id)));
  const quoteMove=quoteEligible&&quote?.changePercent?` (${quote.changePercent})`:"";

  let summary:string;
  if(intent.intent==="market_move"){
    summary=`${sec.company.title} (${ticker}) market-move brief.${price?` Latest eligible provider quote: ${price}${quoteMove}${quote?.latestTradingDay?` as of ${quote.latestTradingDay}`:""}.`:" No eligible live/delayed quote is connected, so Briefs will not manufacture a price move."}${newsLead?` Recent reporting worth checking against the move: ${newsLead}. These headlines are context, not proof of causation.`:" Recent catalyst coverage did not produce enough eligible reporting in this run."}${metrics?` Latest SEC-reported fundamentals in scope: ${metrics}.`:""}`;
  }else if(intent.intent==="market_snapshot"){
    summary=`${sec.company.title} (${ticker}) investor snapshot.${price?` Latest eligible provider quote: ${price}${quoteMove}${quote?.latestTradingDay?` as of ${quote.latestTradingDay}`:""}.`:" No eligible live/delayed quote is connected, so Briefs will not invent a price."}${metrics?` Latest SEC-reported fundamentals in scope: ${metrics}.`:request.sourcePolicy==="news"?" The selected News-only policy excludes SEC financial metrics.":""}${newsLead?` Recent reporting: ${newsLead}.`:""}`;
  }else{
    summary=`${sec.company.title} (${ticker}) financial brief.${metrics?` Latest SEC-reported metrics in scope: ${metrics}.`:request.sourcePolicy==="news"?" The selected News-only policy excludes primary SEC financial metrics.":" Primary SEC filings were resolved, but the requested metric was not available in the eligible evidence set."}${newsLead?` Recent reporting: ${newsLead}.`:""}`;
  }

  const missingEvidence:string[]=[];
  const marketDataPolicyAllows=request.sourcePolicy==="verified"||request.sourcePolicy==="all"||request.sourcePolicy==="academic";
  if(["market_snapshot","market_move"].includes(intent.intent)&&!price){
    if(!marketDataPolicyAllows) missingEvidence.push(`The selected ${request.sourcePolicy} source policy excludes the configured specialist market-quote adapter.`);
    else if(!process.env.ALPHA_VANTAGE_API_KEY) missingEvidence.push("Live/delayed market quote is not connected. Add ALPHA_VANTAGE_API_KEY or another licensed market-data adapter for price-sensitive questions.");
    else missingEvidence.push("The configured market-data provider did not return an eligible quote for this research run.");
  }
  const reportingPolicyAllows=request.sourcePolicy==="verified"||request.sourcePolicy==="all"||request.sourcePolicy==="news";
  if(reportingPolicyAllows&&eligibleNews.length<2) missingEvidence.push("Recent catalyst coverage has limited independent-source diversity in this research run.");

  const hasPrimary=sources.some(s=>s.kind==="primary"&&s.independenceFamily==="sec");
  const changes=[
    ...(hasPrimary?sec.recentFilings.slice(0,3).map((f,index)=>({id:`sec-change-${f.accession}`,summary:`${sec.company.title} filed ${f.form} on ${f.filed}.`,changedAt:`${f.filed}T12:00:00Z`,importance:index===0?82:72})):[]),
    ...eligibleNews.filter(s=>s.publishedAt).slice(0,5).map((s,index)=>({id:`news-change-${s.id}`,summary:s.title,changedAt:s.publishedAt as string,importance:66-index*3}))
  ].sort((a,b)=>b.changedAt.localeCompare(a.changedAt));
  void persistChangeCandidates(`${sec.company.title} (${ticker})`,changes);

  const watchItems=[
    `Next earnings release and ${sec.recentFilings.some(f=>f.form==="10-Q")?"10-Q/8-K":"10-Q or 8-K"} filing`,
    "Revenue, margins, EPS and cash-generation trend",
    "Material 8-K disclosures, guidance changes and capital-return announcements",
    ...(intent.intent==="market_move"?["Whether independently sourced reporting confirms a durable catalyst for the price move"]:[]),
    ...(!price&&marketDataPolicyAllows?["Market quote freshness once an eligible market-data adapter is connected"]:[])
  ];

  const whyItMatters=intent.intent==="market_move"?
    "This is a market-movement question, so Briefs leads with time-aligned market context and recent catalysts, then uses filings for fundamentals. It does not treat a nearby headline as the cause unless the evidence supports that inference.":
    intent.intent==="market_snapshot"?
    "This is a stock query, so Briefs prioritizes the security, quote freshness, primary filings, recent catalysts and investor-relevant risks instead of defaulting to company history.":
    "This is a financial question, so Briefs prioritizes primary reported metrics and filings, then adds current context when eligible sources are available.";

  return {
    subject:`${sec.company.title} (${ticker})`,
    entityIds:[],
    description:summary,
    whyItMatters,
    claims:findings.map(f=>({id:f.id,predicate:f.predicate,valueText:f.valueText,text:f.statement,confidence:f.confidence,verificationStatus:f.verificationStatus,lastVerifiedAt:new Date().toISOString(),sourceIds:f.sourceIds})),
    changes,
    sources:sources.map(s=>({id:s.id,name:`${s.name} — ${s.title}`,url:s.url,tier:s.tier,kind:s.kind})),
    watchItems,
    knowledgeCutoff:new Date().toISOString(),
    researchNeeded:missingEvidence.length>0,
    missingEvidence,
    mode:"research" as const,
    dynamic:true
  };
}

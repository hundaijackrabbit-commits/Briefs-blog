import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { ResearchFinding, ResearchSource } from "@/lib/research/types";

export type MarketQuote={
  symbol:string; price:string; change:string; changePercent:string; previousClose:string; volume:string; latestTradingDay:string;
  findings:ResearchFinding[]; sources:ResearchSource[];
};

type GlobalQuoteResponse={
  "Global Quote"?:Record<string,string>;
  Note?:string;
  Information?:string;
};

export async function alphaVantageQuote(symbol:string):Promise<MarketQuote|null>{
  const key=process.env.ALPHA_VANTAGE_API_KEY;
  if(!key) return null;
  const url=`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const data=await fetchJson<GlobalQuoteResponse>(url,6500);
  const q=data["Global Quote"];
  if(!q||!q["05. price"]) return null;
  const retrievedAt=new Date().toISOString();
  const publicUrl=`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=REDACTED`;
  const sourceId=stableResearchId("av",`${symbol}:${q["07. latest trading day"]||retrievedAt}`);
  const source:ResearchSource={id:sourceId,provider:"external",name:"Alpha Vantage",title:`${symbol} market quote`,url:"https://www.alphavantage.co/",tier:"B",kind:"specialist",retrievedAt,publishedAt:q["07. latest trading day"]||null,excerpt:"Latest quote returned by Alpha Vantage GLOBAL_QUOTE. Freshness depends on the configured market-data entitlement.",authority:78,independenceFamily:"alpha-vantage",metadata:{symbol,endpoint:publicUrl,freshness:"provider-entitlement"}};
  const price=q["05. price"]; const change=q["09. change"]||""; const changePercent=q["10. change percent"]||""; const previousClose=q["08. previous close"]||""; const volume=q["06. volume"]||""; const latestTradingDay=q["07. latest trading day"]||"";
  const findings:ResearchFinding[]=[
    {id:stableResearchId("avf",`${symbol}:price:${latestTradingDay}:${price}`),subject:symbol,predicate:"Latest market quote",valueText:`$${Number(price).toFixed(2)}`,statement:`${symbol} latest provider quote: $${Number(price).toFixed(2)}${changePercent?` (${changePercent})`:""}${latestTradingDay?` for ${latestTradingDay}`:""}.`,sourceIds:[sourceId],confidence:"high",verificationStatus:"reported"}
  ];
  if(previousClose) findings.push({id:stableResearchId("avf",`${symbol}:previous:${latestTradingDay}:${previousClose}`),subject:symbol,predicate:"Previous close",valueText:`$${Number(previousClose).toFixed(2)}`,statement:`Previous close: $${Number(previousClose).toFixed(2)}.`,sourceIds:[sourceId],confidence:"high",verificationStatus:"reported"});
  if(volume) findings.push({id:stableResearchId("avf",`${symbol}:volume:${latestTradingDay}:${volume}`),subject:symbol,predicate:"Volume",valueText:Number(volume).toLocaleString("en-US"),statement:`Reported volume: ${Number(volume).toLocaleString("en-US")}.`,sourceIds:[sourceId],confidence:"high",verificationStatus:"reported"});
  return {symbol,price,change,changePercent,previousClose,volume,latestTradingDay,findings,sources:[source]};
}

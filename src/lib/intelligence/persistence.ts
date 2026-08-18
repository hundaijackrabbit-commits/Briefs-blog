import { db } from "@/lib/db";
import type { BriefRequest } from "@/lib/types";
import type { QueryIntentResult } from "@/lib/intelligence/query-intent";

export async function persistQueryIntent(intent:QueryIntentResult,request:BriefRequest){
  if(!process.env.DATABASE_URL) return;
  try{
    const sql=db();
    await sql`insert into query_intent_observations(subject,domain,intent,entity_query,ticker_hint,effective_perspective,freshness,source_policy,depth)
      values(${request.subject},${intent.domain},${intent.intent},${intent.entityQuery},${intent.tickerHint??null},${intent.effectivePerspective},${intent.freshness},${request.sourcePolicy??null},${request.depth})`;
  }catch(error){console.error("Briefs query-intent persistence",error);}
}

export async function persistMarketSnapshot(input:{ticker:string;provider:string;price?:string;change?:string;changePercent?:string;volume?:string;marketDate?:string;metadata?:Record<string,unknown>}){
  if(!process.env.DATABASE_URL) return;
  try{
    const sql=db();
    const price=input.price?Number(input.price):null;
    const change=input.change?Number(input.change):null;
    const volume=input.volume?Number(input.volume):null;
    await sql`insert into market_snapshots(ticker,provider,price,change_value,change_percent,volume,market_date,metadata)
      values(${input.ticker},${input.provider},${Number.isFinite(price as number)?price:null},${Number.isFinite(change as number)?change:null},${input.changePercent??null},${Number.isFinite(volume as number)?volume:null},${input.marketDate||null},${sql.json(JSON.parse(JSON.stringify(input.metadata||{})))})
      on conflict do nothing`;
  }catch(error){console.error("Briefs market snapshot persistence",error);}
}

export async function persistChangeCandidates(subject:string,changes:Array<{id:string;summary:string;changedAt:string;importance:number;sourceUrl?:string;sourceFamily?:string;changeType?:string}>){
  if(!process.env.DATABASE_URL||!changes.length) return;
  try{
    const sql=db();
    for(const change of changes){
      await sql`insert into observed_changes(subject,change_type,summary,source_url,source_family,event_at,importance,fingerprint)
        values(${subject},${change.changeType||"observed"},${change.summary},${change.sourceUrl??null},${change.sourceFamily??null},${change.changedAt},${change.importance},${change.id})
        on conflict(fingerprint) do nothing`;
    }
  }catch(error){console.error("Briefs change-candidate persistence",error);}
}

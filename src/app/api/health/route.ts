import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STARTER_TOPICS } from "@/lib/knowledge/starter";
import { productionReadiness } from "@/lib/ops/readiness";

export const dynamic="force-dynamic";
export async function GET(){
  const readiness=productionReadiness();
  const distribution={publicBriefs:true,sitemap:true,rss:true,newsSitemap:true,publicApi:"v1",exports:["markdown","csv","json"],emailDelivery:Boolean(process.env.RESEND_API_KEY&&process.env.BRIEFS_FROM_EMAIL)};
  const intelligence={intentRouting:true,iterativeResearch:true,persistentResearchMemory:Boolean(process.env.DATABASE_URL),livingChanges:Boolean(process.env.DATABASE_URL),claimEvidence:true,personalIntelligence:true,editorialSafety:true};
  const base={ok:true,service:"briefs",version:"1.0.0",mvp:"complete",productionStatus:readiness.status,requiredConfiguration:{ready:readiness.requiredReady,total:readiness.requiredTotal},starterCorpus:{ready:true,topics:STARTER_TOPICS.length},intelligence,distribution,time:new Date().toISOString()};
  if(!process.env.DATABASE_URL)return NextResponse.json({...base,database:"not-configured",briefMode:"research-plus-local-personal-plus-public-authority",degradedReason:"Persistent learning, accounts and living history require DATABASE_URL."});
  try{const sql=db();await sql`select 1 as ok`;return NextResponse.json({...base,database:"ready",briefMode:"living-intelligence"});}
  catch(error){return NextResponse.json({...base,database:"unavailable",briefMode:"safe-degraded-research",degradedReason:"Persistent database unavailable",databaseError:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined});}
}

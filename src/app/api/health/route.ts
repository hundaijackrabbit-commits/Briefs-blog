import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STARTER_TOPICS } from "@/lib/knowledge/starter";

export const dynamic="force-dynamic";
export async function GET(){
  const distribution={publicBriefs:true,sitemap:true,rss:true,newsSitemap:true,publicApi:"v1",exports:["markdown","csv","json"],emailDelivery:Boolean(process.env.RESEND_API_KEY&&process.env.BRIEFS_FROM_EMAIL)};
  const base={ok:true,service:"briefs",version:"0.9.0",starterCorpus:{ready:true,topics:STARTER_TOPICS.length},distribution,time:new Date().toISOString()};
  if(!process.env.DATABASE_URL) return NextResponse.json({...base,database:"not-configured",briefMode:"intent-routed-research-plus-local-personal-plus-public-authority"});
  try{const sql=db();await sql`select 1 as ok`;return NextResponse.json({...base,database:"ready",briefMode:"database-plus-research-plus-personal-plus-authority-distribution"});}
  catch(error){return NextResponse.json({...base,database:"unavailable",briefMode:"research-plus-local-personal-plus-public-authority",databaseError:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined});}
}

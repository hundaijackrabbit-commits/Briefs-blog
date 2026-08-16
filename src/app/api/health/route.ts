import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STARTER_TOPICS } from "@/lib/knowledge/starter";

export const dynamic="force-dynamic";

export async function GET(){
  const base={ok:true,service:"briefs",version:"0.6.0",starterCorpus:{ready:true,topics:STARTER_TOPICS.length},time:new Date().toISOString()};
  if(!process.env.DATABASE_URL) return NextResponse.json({...base,database:"not-configured",briefMode:"starter-corpus-plus-live-research"});
  try{
    const sql=db(); await sql`select 1 as ok`;
    return NextResponse.json({...base,database:"ready",briefMode:"database-plus-live-research"});
  }catch(error){
    return NextResponse.json({...base,database:"unavailable",briefMode:"starter-corpus-plus-live-research",databaseError:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined});
  }
}

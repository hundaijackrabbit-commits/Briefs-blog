import { NextResponse } from "next/server";
import { STARTER_TOPICS } from "@/lib/knowledge/starter";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({version:"1.2.0",databaseConfigured:Boolean(process.env.DATABASE_URL),persistentResearchMemory:Boolean(process.env.DATABASE_URL),historicalState:Boolean(process.env.DATABASE_URL),livingChangeStream:Boolean(process.env.DATABASE_URL),fallbackReady:true,starterTopics:STARTER_TOPICS.map(t=>({id:t.id,name:t.name,dynamic:t.dynamic,sourceCount:t.sources.length,factCount:t.facts.length}))},{headers:{"cache-control":"no-store"}});}

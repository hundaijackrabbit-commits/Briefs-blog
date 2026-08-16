import { NextRequest, NextResponse } from "next/server";
import { runDailyEngine } from "@/lib/engine/daily";

export const maxDuration = 60;
export async function GET(request:NextRequest){
  const expected=process.env.CRON_SECRET;
  if(!expected) return NextResponse.json({error:"CRON_SECRET is not configured"},{status:503});
  if(request.headers.get("authorization")!==`Bearer ${expected}`) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{return NextResponse.json({ok:true,result:await runDailyEngine()});}
  catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:"Unknown failure"},{status:500});}
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic="force-dynamic";

export async function GET(){
  const base={ok:true,service:"briefs",version:"0.4.1",time:new Date().toISOString()};
  if(!process.env.DATABASE_URL) return NextResponse.json({...base,database:"not-configured",mode:"public-safe"});
  try{
    const sql=db();
    await sql`select 1 as ok`;
    return NextResponse.json({...base,database:"ready"});
  }catch(error){
    return NextResponse.json({...base,ok:false,database:"unavailable",error:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined},{status:503});
  }
}

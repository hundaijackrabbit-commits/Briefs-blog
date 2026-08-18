import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";
import { createReaderSession, normalizeEmail, READER_COOKIE, verifyPassword } from "@/lib/personal/auth";

export async function POST(request:NextRequest){
  const rate=allowRequest(request,"auth",10,10*60*1000);
  if(!rate.ok) return NextResponse.json({error:"Too many authentication attempts. Try again later."},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
  if(!process.env.DATABASE_URL) return NextResponse.json({error:"Reader accounts require the Briefs production database"},{status:503});
  const body=await request.json().catch(()=>null) as {email?:string;password?:string}|null;
  const email=normalizeEmail(body?.email||""); const password=body?.password||"";
  const sql=db(); const rows=await sql`select id,email,password_hash from reader_accounts where email=${email} limit 1`;
  const user=rows[0];
  if(!user||!verifyPassword(password,String(user.password_hash))) return NextResponse.json({error:"Invalid email or password"},{status:401});
  const token=await createReaderSession(String(user.id));
  const response=NextResponse.json({user:{id:String(user.id),email:String(user.email)}});
  response.cookies.set(READER_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}

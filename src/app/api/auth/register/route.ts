import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";
import { createReaderSession, hashPassword, normalizeEmail, READER_COOKIE } from "@/lib/personal/auth";

export async function POST(request:NextRequest){
  const rate=allowRequest(request,"auth",10,10*60*1000);
  if(!rate.ok) return NextResponse.json({error:"Too many authentication attempts. Try again later."},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
  if(!process.env.DATABASE_URL) return NextResponse.json({error:"Reader accounts require the Briefs production database"},{status:503});
  const body=await request.json().catch(()=>null) as {email?:string;password?:string}|null;
  const email=normalizeEmail(body?.email||""); const password=body?.password||"";
  if(!email.includes("@")) return NextResponse.json({error:"Enter a valid email"},{status:400});
  if(password.length<10) return NextResponse.json({error:"Use at least 10 characters"},{status:400});
  try{
    const sql=db();
    const rows=await sql`insert into reader_accounts(email,password_hash) values(${email},${hashPassword(password)}) returning id,email`;
    const token=await createReaderSession(String(rows[0].id));
    const response=NextResponse.json({user:{id:String(rows[0].id),email:String(rows[0].email)}},{status:201});
    response.cookies.set(READER_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
    return response;
  }catch(error){
    const message=error instanceof Error?error.message:"Registration failed";
    if(/unique|duplicate/i.test(message)) return NextResponse.json({error:"An account already exists for that email"},{status:409});
    return NextResponse.json({error:"Registration failed"},{status:500});
  }
}

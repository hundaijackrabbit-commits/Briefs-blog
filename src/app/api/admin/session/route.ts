import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue } from "@/lib/admin-session";

export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>null) as {token?:string}|null;
  const expected=process.env.ADMIN_TOKEN;
  if(!expected) return NextResponse.json({error:"ADMIN_TOKEN is not configured"},{status:503});
  if(!body?.token||body.token!==expected) return NextResponse.json({error:"Invalid admin token"},{status:401});
  const response=NextResponse.json({ok:true});
  response.cookies.set(ADMIN_COOKIE,await adminCookieValue(expected),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*8});
  return response;
}

export async function DELETE(){
  const response=NextResponse.json({ok:true});
  response.cookies.set(ADMIN_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
  return response;
}

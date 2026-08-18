import { NextRequest, NextResponse } from "next/server";
import { READER_COOKIE, revokeReaderSession } from "@/lib/personal/auth";

export async function POST(request:NextRequest){
  await revokeReaderSession(request.cookies.get(READER_COOKIE)?.value);
  const response=NextResponse.json({ok:true});
  response.cookies.set(READER_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
  return response;
}

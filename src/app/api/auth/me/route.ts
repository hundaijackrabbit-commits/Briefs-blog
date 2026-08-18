import { NextRequest, NextResponse } from "next/server";
import { readerFromRequest } from "@/lib/personal/auth";

export async function GET(request:NextRequest){
  const user=await readerFromRequest(request);
  return NextResponse.json({user,database:Boolean(process.env.DATABASE_URL)});
}

import { NextRequest, NextResponse } from "next/server";
import { runDailyEngine } from "@/lib/engine/daily";

export async function GET(request:NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({error:"Unauthorized"},{status:401});
  const result = await runDailyEngine();
  return NextResponse.json({ ok:true, result });
}

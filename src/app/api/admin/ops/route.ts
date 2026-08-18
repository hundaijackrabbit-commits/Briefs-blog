import { NextRequest,NextResponse } from "next/server";
import { ADMIN_COOKIE,validAdminCookie } from "@/lib/admin-session";
import { productionReadiness } from "@/lib/ops/readiness";
import { operationalSnapshot } from "@/lib/ops/telemetry";

async function allowed(req:NextRequest){
  const secret=process.env.ADMIN_TOKEN;
  const bearer=req.headers.get("authorization");
  if(secret&&bearer===`Bearer ${secret}`) return true;
  return validAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value,secret);
}
export async function GET(req:NextRequest){
  if(!(await allowed(req))) return NextResponse.json({error:"Unauthorized"},{status:401});
  return NextResponse.json({version:"1.2.0",readiness:productionReadiness(),operations:await operationalSnapshot(),time:new Date().toISOString()},{headers:{"cache-control":"no-store"}});
}

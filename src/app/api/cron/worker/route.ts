import { NextRequest, NextResponse } from "next/server";
import { processOne } from "@/lib/engine/worker";
export const maxDuration=60;
export async function GET(req:NextRequest){const secret=process.env.CRON_SECRET;if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});const worker=`vercel-${crypto.randomUUID()}`;const limit=Math.max(1,Math.min(20,Number(req.nextUrl.searchParams.get('limit')||5)));const results:Awaited<ReturnType<typeof processOne>>[]=[];for(let i=0;i<limit;i++){const r=await processOne(worker);results.push(r);if(r.status==='idle')break;}return NextResponse.json({ok:true,results});}

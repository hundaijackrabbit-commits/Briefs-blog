import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
function allowed(req:NextRequest){const t=process.env.ADMIN_TOKEN;return !!t&&req.headers.get("authorization")===`Bearer ${t}`;}
export async function GET(req:NextRequest){
  if(!allowed(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const sql=db();
  const [run]=await sql`select * from intelligence_runs order by started_at desc limit 1`;
  const [jobs]=await sql`select count(*)::int total,count(*) filter(where status='dead')::int dead,count(*) filter(where status in ('pending','retrying'))::int queued,count(*) filter(where status='running')::int running from jobs`;
  const [reviews]=await sql`select count(*)::int open from review_queue where status='open'`;
  const [sources]=await sql`select count(*)::int total,count(*) filter(where consecutive_failures>=3)::int degraded from sources where is_active=true`;
  return NextResponse.json({run:run??null,jobs,reviews,sources});
}

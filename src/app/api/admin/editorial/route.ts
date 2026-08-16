import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approveRevision,rejectRevision,publishRevision,rollbackRevision } from "@/lib/engine/publisher";

function allowed(req:NextRequest){const token=process.env.ADMIN_TOKEN;return !!token&&req.headers.get('authorization')===`Bearer ${token}`;}

export async function GET(req:NextRequest){
  if(!allowed(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const sql=db();
  const rows=await sql`select er.id,er.status,er.review_mode,er.risk_class,er.rationale,er.quality_score,er.quality_blockers,er.created_at,b.slug,b.title,bs.section_key,bs.heading from editorial_revisions er join briefs b on b.id=er.brief_id join brief_sections bs on bs.id=er.section_id order by case er.status when 'proposed' then 0 when 'approved' then 1 else 2 end,er.created_at desc limit 200`;
  return NextResponse.json({items:rows});
}

export async function POST(req:NextRequest){
  if(!allowed(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null) as {id?:string;action?:string;actor?:string;reason?:string}|null;
  if(!body?.id||!body.action) return NextResponse.json({error:'id and action are required'},{status:400});
  try{
    const actor=body.actor||'admin';
    if(body.action==='approve') return NextResponse.json(await approveRevision(body.id,actor));
    if(body.action==='reject') return NextResponse.json(await rejectRevision(body.id,actor,body.reason));
    if(body.action==='publish') return NextResponse.json(await publishRevision(body.id,actor));
    if(body.action==='rollback') return NextResponse.json(await rollbackRevision(body.id,actor,body.reason));
    return NextResponse.json({error:'Unknown action'},{status:400});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:409});}
}

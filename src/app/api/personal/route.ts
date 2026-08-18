import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readerFromRequest } from "@/lib/personal/auth";

async function requireReader(request:NextRequest){
  const reader=await readerFromRequest(request);
  if(!reader) throw new Error("UNAUTHORIZED");
  return reader;
}

export async function GET(request:NextRequest){
  try{
    const reader=await requireReader(request); const sql=db();
    const preferences=(await sql`select default_depth,default_perspective,digest_enabled,min_importance,last_digest_at from reader_preferences where account_id=${reader.id}::uuid`)[0]||null;
    const packs=await sql`select p.id,p.name,p.description,p.created_at,coalesce(json_agg(json_build_object('id',i.id,'subject',i.subject,'entityId',i.entity_id,'createdAt',i.created_at) order by i.created_at) filter(where i.id is not null),'[]'::json) items from brief_packs p left join brief_pack_items i on i.pack_id=p.id where p.account_id=${reader.id}::uuid group by p.id order by p.created_at`;
    const notifications=await sql`select id,title,body,subject,created_at,read_at from reader_notifications where account_id=${reader.id}::uuid order by created_at desc limit 25`;
    return NextResponse.json({user:reader,preferences,packs,notifications});
  }catch(error){
    return NextResponse.json({error:error instanceof Error&&error.message==="UNAUTHORIZED"?"Sign in to sync Briefs across devices":"Personal intelligence unavailable"},{status:error instanceof Error&&error.message==="UNAUTHORIZED"?401:503});
  }
}

export async function POST(request:NextRequest){
  try{
    const reader=await requireReader(request); const sql=db();
    const body=await request.json().catch(()=>null) as {action?:string;packId?:string;name?:string;description?:string;subject?:string;entityId?:string;depth?:string;perspective?:string;digestEnabled?:boolean;minImportance?:number;notificationId?:string}|null;
    if(!body?.action) return NextResponse.json({error:"action is required"},{status:400});
    if(body.action==="create-pack"){
      const rows=await sql`insert into brief_packs(account_id,name,description) values(${reader.id}::uuid,${(body.name||"My Briefs").trim().slice(0,80)},${(body.description||"").trim().slice(0,240)}) returning id,name,description`;
      return NextResponse.json({pack:rows[0]},{status:201});
    }
    if(body.action==="follow"){
      let packId=body.packId;
      if(!packId){
        const existing=await sql`select id from brief_packs where account_id=${reader.id}::uuid order by created_at limit 1`;
        packId=existing[0]?.id?String(existing[0].id):String((await sql`insert into brief_packs(account_id,name) values(${reader.id}::uuid,'My Briefs') returning id`)[0].id);
      }
      const owns=await sql`select 1 from brief_packs where id=${packId}::uuid and account_id=${reader.id}::uuid`;
      if(!owns.length) return NextResponse.json({error:"Pack not found"},{status:404});
      const subject=(body.subject||"").trim().slice(0,200); if(!subject) return NextResponse.json({error:"subject is required"},{status:400});
      const rows=await sql`insert into brief_pack_items(pack_id,subject,entity_id) values(${packId}::uuid,${subject},${body.entityId||null}) on conflict(pack_id,lower(subject)) do update set entity_id=coalesce(excluded.entity_id,brief_pack_items.entity_id) returning id,subject`;
      return NextResponse.json({item:rows[0]});
    }
    if(body.action==="unfollow"){
      const subject=(body.subject||"").trim().slice(0,200);
      await sql`delete from brief_pack_items using brief_packs where brief_pack_items.pack_id=brief_packs.id and brief_packs.account_id=${reader.id}::uuid and lower(brief_pack_items.subject)=lower(${subject})`;
      return NextResponse.json({ok:true});
    }
    if(body.action==="preferences"){
      const depth=body.depth||"standard"; const perspective=body.perspective||"general"; const min=Math.max(0,Math.min(100,Number(body.minImportance??65)));
      await sql`insert into reader_preferences(account_id,default_depth,default_perspective,digest_enabled,min_importance) values(${reader.id}::uuid,${depth},${perspective},${body.digestEnabled??true},${min}) on conflict(account_id) do update set default_depth=excluded.default_depth,default_perspective=excluded.default_perspective,digest_enabled=excluded.digest_enabled,min_importance=excluded.min_importance,updated_at=now()`;
      return NextResponse.json({ok:true});
    }
    if(body.action==="read-notification"&&body.notificationId){
      await sql`update reader_notifications set read_at=coalesce(read_at,now()) where id=${body.notificationId}::uuid and account_id=${reader.id}::uuid`;
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:"Unknown action"},{status:400});
  }catch(error){
    return NextResponse.json({error:error instanceof Error&&error.message==="UNAUTHORIZED"?"Sign in to use synced personal intelligence":"Personal intelligence unavailable"},{status:error instanceof Error&&error.message==="UNAUTHORIZED"?401:503});
  }
}

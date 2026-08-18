import type { NextRequest } from "next/server";
import type { BriefContextSnapshot, BriefRequest, BriefResult } from "@/lib/types";
import { db } from "@/lib/db";
import { readerFromRequest } from "@/lib/personal/auth";

export async function persistConversationTurn(request:NextRequest,briefRequest:BriefRequest,result:BriefResult,context:BriefContextSnapshot){
  if(!process.env.DATABASE_URL) return context;
  try{
    const reader=await readerFromRequest(request);
    if(!reader) return context;
    const sql=db();
    let conversationId=context.conversationId;
    if(conversationId){
      const owns=await sql`select id from brief_conversations where id=${conversationId}::uuid and account_id=${reader.id}::uuid and expires_at>now()`;
      if(!owns.length) conversationId=undefined;
    }
    if(!conversationId){
      const rows=await sql`insert into brief_conversations(account_id,root_subject,last_subject,context) values(${reader.id}::uuid,${context.rootSubject},${result.subject},${sql.json(JSON.parse(JSON.stringify(context)))}) returning id`;
      conversationId=String(rows[0].id);
    }else{
      await sql`update brief_conversations set last_subject=${result.subject},context=${sql.json(JSON.parse(JSON.stringify(context)))},updated_at=now(),expires_at=now()+interval '30 days' where id=${conversationId}::uuid`;
    }
    await sql`insert into brief_turns(conversation_id,query,resolved_subject,intent,claim_ids,source_ids) values(${conversationId}::uuid,${briefRequest.subject},${result.subject},${result.intent||null},${result.claimIds},${result.evidenceIds})`;
    return {...context,conversationId};
  }catch{return context;}
}

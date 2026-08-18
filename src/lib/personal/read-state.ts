import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { readerFromRequest } from "@/lib/personal/auth";

function keyFor(subject:string){return subject.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);}

export async function recordBriefRead(request:NextRequest,subject:string,knowledgeCutoff:string,changes:Array<{changedAt:string}>){
  const reader=await readerFromRequest(request);
  if(!reader||!process.env.DATABASE_URL) return null;
  try{
    const sql=db(); const key=keyFor(subject);
    const previous=(await sql`select last_read_at,last_knowledge_cutoff,last_change_count from reader_read_states where account_id=${reader.id}::uuid and subject_key=${key}`)[0];
    const lastReadAt=previous?.last_read_at?new Date(previous.last_read_at):null;
    const newChanges=lastReadAt?changes.filter(c=>new Date(c.changedAt)>lastReadAt).length:changes.length;
    await sql`insert into reader_read_states(account_id,subject_key,subject,last_read_at,last_knowledge_cutoff,last_change_count) values(${reader.id}::uuid,${key},${subject},now(),${knowledgeCutoff}::timestamptz,${changes.length}) on conflict(account_id,subject_key) do update set subject=excluded.subject,last_read_at=excluded.last_read_at,last_knowledge_cutoff=excluded.last_knowledge_cutoff,last_change_count=excluded.last_change_count`;
    return {lastReadAt:lastReadAt?.toISOString()||null,newChanges,caughtUp:newChanges===0};
  }catch{return null;}
}

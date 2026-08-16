import { db } from "@/lib/db";
import type { BriefRequest } from "@/lib/types";

export async function queueResearchRequest(request:BriefRequest,reason:string,entityIds:string[]=[]){
  if(!process.env.DATABASE_URL) return null;
  try{
    const sql=db();
    const rows=await sql`insert into research_requests(subject,entity_ids,reason,priority,status,requested_depth,requested_perspective) values(${request.subject},${entityIds},${reason},50,'queued',${request.depth},${request.perspective}) returning id`;
    return rows[0]?.id??null;
  }catch(error){
    console.error("Unable to queue research request",error);
    return null;
  }
}

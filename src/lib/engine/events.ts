import { createHash } from "crypto";
import { db } from "@/lib/db";
import { importanceScore } from "@/lib/engine/importance";

function tokens(s:string){return new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(x=>x.length>3));}
function similarity(a:string,b:string){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let same=0;for(const x of A)if(B.has(x))same++;return same/(A.size+B.size-same);}

export async function clusterRecentSource(sourceId:string){
  const sql=db();
  const docs=await sql`select d.*,s.tier from source_documents d join sources s on s.id=d.source_id where d.source_id=${sourceId} and d.retrieved_at>now()-interval '2 days' order by coalesce(d.published_at,d.retrieved_at) desc limit 100`;
  let created=0;
  for(const doc of docs){
    const recent=await sql`select * from events where updated_at>now()-interval '3 days' order by updated_at desc limit 80`;
    let best:any=null,bestScore=0;
    for(const ev of recent){const score=similarity(doc.title,ev.title);if(score>bestScore){best=ev;bestScore=score;}}
    if(best && bestScore>=0.62){
      const ids=Array.from(new Set([...(best.document_ids||[]),doc.id]));
      await sql`update events set document_ids=${ids}::uuid[],updated_at=now(),importance_score=least(100,importance_score+2) where id=${best.id}::uuid`;
    }else{
      const key=createHash("sha1").update(`${doc.title}|${new Date(doc.published_at||doc.retrieved_at).toISOString().slice(0,10)}`).digest("hex");
      const score=importanceScore({sourceTier:doc.tier,sourceCount:1,entityCount:0,novelty:70,reach:50,persistence:50});
      const rows=await sql`insert into events(event_key,title,summary,occurred_at,status,confidence,importance_score,document_ids) values(${key},${doc.title},${doc.excerpt},${doc.published_at||doc.retrieved_at},'developing',${doc.tier==='A'?'high':'medium'},${score},array[${doc.id}]::uuid[]) on conflict(event_key) do nothing returning id`;
      created+=rows.length;
    }
  }
  return {documents:docs.length,eventsCreated:created};
}

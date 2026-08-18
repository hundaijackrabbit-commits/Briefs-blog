import { createHash } from "node:crypto";
import { db } from "@/lib/db";

function fingerprint(accountId:string,subject:string,ids:string[]){
  return createHash("sha256").update(`${accountId}|${subject}|${ids.sort().join(",")}`).digest("hex");
}

export async function runPersonalDigest(){
  if(!process.env.DATABASE_URL) return {status:"database-not-configured",accounts:0,notifications:0};
  const sql=db();
  const readers=await sql`
    select a.id,coalesce(p.min_importance,65) min_importance,p.last_digest_at
    from reader_accounts a
    left join reader_preferences p on p.account_id=a.id
    where a.status='active' and coalesce(p.digest_enabled,true)=true
    order by a.created_at
    limit 250
  `;
  let notifications=0;
  for(const reader of readers as any[]){
    const since=reader.last_digest_at?new Date(reader.last_digest_at):new Date(Date.now()-24*60*60*1000);
    const items=await sql`
      select distinct i.subject
      from brief_pack_items i join brief_packs p on p.id=i.pack_id
      where p.account_id=${String(reader.id)}::uuid
    `;
    for(const item of items as any[]){
      const changes=await sql`
        select id,summary,importance,observed_at
        from observed_changes
        where lower(subject) like ${`%${String(item.subject).toLowerCase()}%`}
          and observed_at>${since}
          and importance>=${Number(reader.min_importance)}
          and status in ('candidate','accepted','published')
        order by importance desc,observed_at desc limit 8
      `;
      if(!changes.length) continue;
      const ids=changes.map((c:any)=>String(c.id)); const fp=fingerprint(String(reader.id),String(item.subject),ids);
      const title=`${changes.length} meaningful change${changes.length===1?"":"s"} in ${item.subject}`;
      const body=changes.slice(0,3).map((c:any)=>c.summary).join(" · ");
      const inserted=await sql`insert into reader_notifications(account_id,subject,title,body,fingerprint) values(${String(reader.id)}::uuid,${String(item.subject)},${title},${body},${fp}) on conflict(account_id,fingerprint) do nothing returning id`;
      notifications+=inserted.length;
    }
    await sql`insert into reader_preferences(account_id,last_digest_at) values(${String(reader.id)}::uuid,now()) on conflict(account_id) do update set last_digest_at=now(),updated_at=now()`;
  }
  return {status:"completed",accounts:readers.length,notifications};
}

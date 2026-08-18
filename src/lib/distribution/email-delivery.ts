import { db } from "@/lib/db";
import { renderDigestEmail } from "@/lib/distribution/email";

async function resend(to:string,subject:string,html:string){
  const key=process.env.RESEND_API_KEY; const from=process.env.BRIEFS_FROM_EMAIL;
  if(!key||!from) return {ok:false,disabled:true,error:"email-not-configured"};
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({from,to:[to],subject,html}),signal:AbortSignal.timeout(12000)});
  const body=await response.json().catch(()=>({}));
  if(!response.ok) return {ok:false,disabled:false,error:String((body as any)?.message||`email-http-${response.status}`)};
  return {ok:true,disabled:false,id:String((body as any)?.id||"")};
}

export async function deliverPendingDigestEmails(){
  if(!process.env.DATABASE_URL) return {status:"database-not-configured",accounts:0,delivered:0,failed:0};
  if(!process.env.RESEND_API_KEY||!process.env.BRIEFS_FROM_EMAIL) return {status:"email-not-configured",accounts:0,delivered:0,failed:0};
  const sql=db();
  const rows=await sql`
    select a.id account_id,a.email,n.id notification_id,n.subject,n.title,n.body,n.fingerprint,n.created_at
    from reader_accounts a
    join reader_preferences p on p.account_id=a.id and p.digest_enabled=true
    join reader_notifications n on n.account_id=a.id and n.email_sent_at is null
    where a.status='active'
    order by a.id,n.created_at
    limit 500
  `;
  const grouped=new Map<string,{email:string;items:any[]}>();
  for(const row of rows as any[]){const key=String(row.account_id);const group=grouped.get(key)||{email:String(row.email),items:[]};group.items.push(row);grouped.set(key,group);}
  let delivered=0,failed=0;
  for(const [accountId,group] of grouped){
    const items=group.items.slice(0,20); const fingerprint=`digest:${items.map(i=>i.fingerprint).join(":")}`.slice(0,1000);
    const prior=await sql`select 1 from distribution_deliveries where channel='email' and account_id=${accountId}::uuid and fingerprint=${fingerprint} and status='sent' limit 1`;
    if(prior.length) continue;
    const result=await resend(group.email,`Briefs · ${items.length} meaningful update${items.length===1?"":"s"}`,renderDigestEmail(items));
    const providerId:string|null=result.ok?(result.id??null):null;
    const deliveryError:string|null=result.ok?null:(result.error??"unknown-email-error");
    await sql`insert into distribution_deliveries(account_id,channel,destination,fingerprint,status,provider_id,error,metadata) values(${accountId}::uuid,'email',${group.email},${fingerprint},${result.ok?"sent":"failed"},${providerId},${deliveryError},${sql.json(JSON.parse(JSON.stringify({notificationIds:items.map(i=>String(i.notification_id))})))}) on conflict(channel,account_id,fingerprint) do update set status=excluded.status,provider_id=excluded.provider_id,error=excluded.error,updated_at=now()`;
    if(result.ok){await sql`update reader_notifications set email_sent_at=now() where id=any(${items.map(i=>String(i.notification_id))}::uuid[])`;delivered+=items.length;}else failed++;
  }
  return {status:failed?"partial":"completed",accounts:grouped.size,delivered,failed};
}

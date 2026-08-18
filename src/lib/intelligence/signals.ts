import { db } from "@/lib/db";
export type BriefSignal={topic:string;mentions:number;priorMentions:number;sourceFamilies:number;averageImportance:number;velocity:number;score:number;calculatedAt:string};

export async function computeSignals(limit=25):Promise<BriefSignal[]>{
  if(!process.env.DATABASE_URL)return [];
  const sql=db();
  const rows=await sql`
    with current_window as (
      select lower(subject) topic,count(*)::int mentions,count(distinct coalesce(source_family,'unknown'))::int families,coalesce(avg(importance),0)::float avg_importance
      from observed_changes where observed_at>=now()-interval '7 days' group by lower(subject)
    ), prior_window as (
      select lower(subject) topic,count(*)::int mentions from observed_changes where observed_at>=now()-interval '14 days' and observed_at<now()-interval '7 days' group by lower(subject)
    )
    select c.topic,c.mentions,c.families,c.avg_importance,coalesce(p.mentions,0)::int prior_mentions
    from current_window c left join prior_window p using(topic)
    order by c.mentions desc,c.avg_importance desc limit ${limit}`;
  const calculatedAt=new Date().toISOString();const result:BriefSignal[]=[];
  for(const row of rows as any[]){
    const mentions=Number(row.mentions),prior=Number(row.prior_mentions),families=Number(row.families),avg=Math.round(Number(row.avg_importance));const velocity=prior===0?mentions:Math.round(((mentions-prior)/Math.max(1,prior))*100);const score=Math.max(0,Math.min(100,Math.round(Math.min(40,mentions*8)+Math.min(25,families*8)+avg*.25+Math.min(10,Math.max(0,velocity/10)))));
    result.push({topic:String(row.topic),mentions,priorMentions:prior,sourceFamilies:families,averageImportance:avg,velocity,score,calculatedAt});
    await sql`insert into brief_signals(topic,window_days,mention_count,prior_mention_count,source_diversity,average_importance,velocity,score,calculated_at) values(${String(row.topic)},7,${mentions},${prior},${families},${avg},${velocity},${score},${calculatedAt})`;
  }
  return result.sort((a,b)=>b.score-a.score);
}

export async function latestSignals(limit=20):Promise<BriefSignal[]>{
  if(!process.env.DATABASE_URL)return [];
  try{const sql=db();const rows=await sql`select distinct on(topic) topic,mention_count,prior_mention_count,source_diversity,average_importance,velocity,score,calculated_at from brief_signals order by topic,calculated_at desc`;return (rows as any[]).map(r=>({topic:String(r.topic),mentions:Number(r.mention_count),priorMentions:Number(r.prior_mention_count),sourceFamilies:Number(r.source_diversity),averageImportance:Number(r.average_importance),velocity:Number(r.velocity),score:Number(r.score),calculatedAt:new Date(r.calculated_at).toISOString()})).sort((a,b)=>b.score-a.score).slice(0,limit);}catch{return [];}
}

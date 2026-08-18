import { db } from "@/lib/db";
import { STARTER_TOPICS, findStarterTopic } from "@/lib/knowledge/starter";

export type PublicBriefClaim={
  id:string;
  predicate:string;
  value:string;
  confidence:string;
  verificationStatus:string;
  evidence:{sourceId:string;sourceName:string;sourceUrl:string;tier:string;excerpt:string|null}[];
};
export type PublicBrief={
  slug:string;
  title:string;
  deck:string;
  category:string;
  answer:string;
  whyItMatters:string;
  context:string;
  watchNext:string[];
  freshnessScore:number;
  readingMinutes:number;
  lastVerifiedAt:string|null;
  lastSubstantialUpdateAt:string|null;
  createdAt:string|null;
  updatedAt:string|null;
  claims:PublicBriefClaim[];
  sourceMode:"database"|"starter";
  dynamic:boolean;
};

function starterToPublic(slug:string):PublicBrief|null{
  const topic=findStarterTopic(slug.replace(/-/g," "))||STARTER_TOPICS.find(t=>t.id===slug);
  if(!topic) return null;
  const byId=new Map(topic.sources.map(source=>[source.id,source]));
  return {
    slug:topic.id,title:topic.name,deck:topic.quickSummary,category:topic.category,answer:topic.summary,
    whyItMatters:topic.whyItMatters,context:topic.dynamic?"This is a verified baseline. Time-sensitive claims require live-source refresh before being treated as current.":"This is an evergreen Brief maintained against reference evidence.",
    watchNext:topic.watchItems,freshnessScore:topic.dynamic?70:100,readingMinutes:4,lastVerifiedAt:topic.knowledgeCutoff,lastSubstantialUpdateAt:topic.knowledgeCutoff,createdAt:null,updatedAt:topic.knowledgeCutoff,
    claims:topic.facts.map(f=>({id:f.id,predicate:f.label,value:f.value,confidence:f.confidence,verificationStatus:"corroborated",evidence:f.sourceIds.map(id=>byId.get(id)).filter(Boolean).map(source=>({sourceId:(source as any).id,sourceName:(source as any).name,sourceUrl:(source as any).url,tier:(source as any).tier,excerpt:null}))})),
    sourceMode:"starter",dynamic:topic.dynamic
  };
}

export async function getPublicBrief(slug:string):Promise<PublicBrief|null>{
  const safe=slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,120);
  if(!safe) return null;
  if(process.env.DATABASE_URL){
    try{
      const sql=db();
      const brief=(await sql`select id,slug,title,deck,category,answer,why_it_matters,context,watch_next,freshness_score,reading_minutes,last_verified_at,last_substantial_update_at,created_at,updated_at from briefs where slug=${safe} and status='published' limit 1`)[0] as any;
      if(brief){
        const rows=await sql`
          select c.id,c.predicate,c.value_text,c.confidence,c.verification_status,bc.display_order,
            coalesce(json_agg(json_build_object(
              'sourceId',s.id,'sourceName',s.name,'sourceUrl',coalesce(d.canonical_url,s.url),'tier',s.tier,'excerpt',ce.excerpt
            ) order by s.tier,d.published_at desc nulls last) filter(where ce.id is not null),'[]'::json) evidence
          from brief_claims bc
          join claims c on c.id=bc.claim_id
          left join claim_evidence ce on ce.claim_id=c.id and ce.stance='supports'
          left join source_documents d on d.id=ce.document_id
          left join sources s on s.id=d.source_id
          where bc.brief_id=${String(brief.id)}::uuid and c.verification_status<>'retracted'
          group by c.id,bc.display_order
          order by bc.display_order,c.created_at
        `;
        return {
          slug:String(brief.slug),title:String(brief.title),deck:String(brief.deck||""),category:String(brief.category||"Brief"),answer:String(brief.answer||""),
          whyItMatters:String(brief.why_it_matters||""),context:String(brief.context||""),watchNext:Array.isArray(brief.watch_next)?brief.watch_next.map(String):[],
          freshnessScore:Number(brief.freshness_score??0),readingMinutes:Number(brief.reading_minutes??4),lastVerifiedAt:brief.last_verified_at?new Date(brief.last_verified_at).toISOString():null,
          lastSubstantialUpdateAt:brief.last_substantial_update_at?new Date(brief.last_substantial_update_at).toISOString():null,createdAt:brief.created_at?new Date(brief.created_at).toISOString():null,updatedAt:brief.updated_at?new Date(brief.updated_at).toISOString():null,
          claims:(rows as any[]).map(row=>({id:String(row.id),predicate:String(row.predicate),value:String(row.value_text),confidence:String(row.confidence),verificationStatus:String(row.verification_status),evidence:Array.isArray(row.evidence)?row.evidence.map((e:any)=>({sourceId:String(e.sourceId||""),sourceName:String(e.sourceName||"Source"),sourceUrl:String(e.sourceUrl||""),tier:String(e.tier||"C"),excerpt:e.excerpt?String(e.excerpt):null})).filter((e:any)=>e.sourceUrl):[]})),
          sourceMode:"database",dynamic:true
        };
      }
    }catch(error){console.error("Public Brief database fallback",error);}
  }
  return starterToPublic(safe);
}

export async function listPublicBriefs():Promise<Array<{slug:string;title:string;deck:string;category:string;updatedAt:string|null;sourceMode:"database"|"starter"}>>{
  const map=new Map<string,{slug:string;title:string;deck:string;category:string;updatedAt:string|null;sourceMode:"database"|"starter"}>();
  for(const topic of STARTER_TOPICS) map.set(topic.id,{slug:topic.id,title:topic.name,deck:topic.quickSummary,category:topic.category,updatedAt:topic.knowledgeCutoff,sourceMode:"starter"});
  if(process.env.DATABASE_URL){
    try{
      const sql=db();
      const rows=await sql`select slug,title,deck,category,coalesce(last_substantial_update_at,last_verified_at,updated_at) updated_at from briefs where status='published' order by coalesce(last_substantial_update_at,last_verified_at,updated_at) desc limit 1000`;
      for(const row of rows as any[]) map.set(String(row.slug),{slug:String(row.slug),title:String(row.title),deck:String(row.deck||""),category:String(row.category||"Brief"),updatedAt:row.updated_at?new Date(row.updated_at).toISOString():null,sourceMode:"database"});
    }catch(error){console.error("Public Brief list database fallback",error);}
  }
  return [...map.values()];
}

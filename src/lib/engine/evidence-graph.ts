import { db } from "@/lib/db";
import { verifyEvidence } from "@/lib/engine/verification";
import type { EvidenceAssessment, EvidenceStance, Tier } from "@/lib/types";

function host(url:string){try{return new URL(url).hostname.replace(/^www\./,"");}catch{return url;}}

export async function addEvidence(input:{claimId:string;documentId:string;stance:EvidenceStance;excerpt?:string|null;directness?:"direct"|"indirect"|"derived"}){
  const sql=db();
  const rows=await sql`select d.canonical_url,s.tier,s.id as source_id from source_documents d join sources s on s.id=d.source_id where d.id=${input.documentId}::uuid limit 1`;
  if(!rows[0]) throw new Error("Evidence document not found");
  const independenceKey=`${rows[0].source_id}:${host(rows[0].canonical_url)}`;
  await sql`insert into claim_evidence(claim_id,document_id,stance,excerpt,source_tier,independence_key,directness) values(${input.claimId}::uuid,${input.documentId}::uuid,${input.stance},${input.excerpt??null},${rows[0].tier},${independenceKey},${input.directness??'indirect'}) on conflict(claim_id,document_id,stance) do update set excerpt=excluded.excerpt,independence_key=excluded.independence_key,directness=excluded.directness`;
}

export async function assessClaimEvidence(claimId:string):Promise<EvidenceAssessment>{
  const sql=db();
  const rows=await sql`select source_tier,stance,coalesce(independence_key,d.source_id) as independence_key,directness from claim_evidence ce join source_documents d on d.id=ce.document_id where ce.claim_id=${claimId}::uuid`;
  const base=verifyEvidence(rows.map((r:any)=>({tier:r.source_tier as Tier,stance:r.stance,independentKey:r.independence_key})));
  const independentSources=new Set(rows.filter((r:any)=>r.stance==='supports').map((r:any)=>r.independence_key)).size;
  const primarySources=rows.filter((r:any)=>r.stance==='supports'&&r.source_tier==='A').length;
  const supporting=rows.filter((r:any)=>r.stance==='supports').length, conflicting=rows.filter((r:any)=>r.stance==='conflicts').length;
  const direct=rows.filter((r:any)=>r.stance==='supports'&&r.directness==='direct').length;
  const score=Math.max(0,Math.min(100,Math.round(primarySources*25+Math.min(3,independentSources)*15+Math.min(3,direct)*8-conflicting*30)));
  return {...base,independentSources,primarySources,supporting,conflicting,score};
}

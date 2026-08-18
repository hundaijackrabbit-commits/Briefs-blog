import { db } from "@/lib/db";
import type { PublicationAudience,StoryAngle } from "@/lib/publication/types";
import type { ResearchFinding,ResearchGraph } from "@/lib/research/types";
import { readerContract } from "@/lib/publication/audience";

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function words(value:string){return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(x=>x.length>2));}
function similarity(a:string,b:string){const A=words(a),B=words(b);if(!A.size||!B.size)return 0;let common=0;for(const w of A)if(B.has(w))common++;return common/Math.max(A.size,B.size);}
function claimStrength(f:ResearchFinding){return (f.confidence==="high"?20:f.confidence==="medium"?10:0)+(["confirmed","corroborated"].includes(f.verificationStatus)?16:f.verificationStatus==="reported"?6:0)+Math.min(12,f.sourceIds.length*4);}
function topFindings(graph:ResearchGraph,count=5){return [...graph.findings].sort((a,b)=>claimStrength(b)-claimStrength(a)).slice(0,count);}
function readablePredicate(value:string){return value.replace(/[_-]+/g," ").replace(/\s+/g," ").trim();}

async function recentTitles(){
  if(!process.env.DATABASE_URL)return [] as string[];
  try{const sql=db();const rows=await sql`select title from publication_articles where status in ('review','published') order by created_at desc limit 250`;return (rows as unknown as Array<{title:string}>).map(r=>String(r.title));}catch{return [];}
}

function noveltyAgainst(title:string,recent:string[]){let max=0;for(const other of recent)max=Math.max(max,similarity(title,other));return clamp(100-max*90);}

async function recentAngleKeys(){
  if(!process.env.DATABASE_URL)return [] as string[];
  try{const sql=db();const rows=await sql`select angle_key from publication_story_contracts order by created_at desc limit 20`;return (rows as unknown as Array<{angle_key:string}>).map(row=>String(row.angle_key));}catch{return [];}
}
function angleReusePenalty(key:string,recent:string[]){if(recent[0]===key)return 10;if(recent.slice(0,3).includes(key))return 7;const count=recent.filter(value=>value===key).length;return count>=3?5:count>=2?3:0;}

function audienceBonus(text:string,audience:PublicationAudience){const lower=text.toLowerCase();const terms=audience==="investor"?["revenue","earnings","margin","guidance","valuation","risk","growth"]:audience==="executive"?["decision","risk","timing","cost","strategy","impact"]:audience==="developer"?["api","architecture","implementation","performance","security","model"]:audience==="marketer"?["audience","customer","market","brand","demand","position"]:audience==="student"?["why","how","cause","history","means","explained"]:["why","what changed","matters","evidence","means"];return clamp(72+Math.min(24,terms.filter(t=>lower.includes(t)).length*6));}

export async function generateStoryAngles(graph:ResearchGraph,audience:PublicationAudience,keyword:string):Promise<StoryAngle[]>{
  const subject=graph.canonicalSubject||keyword;const findings=topFindings(graph,6);const first=findings[0];const second=findings[1];const recent=await recentTitles();const recentAngles=await recentAngleKeys();
  const candidates:Array<{key:string;title:string;thesis:string;claimIds:string[];risk:number}>=[];
  if(graph.plan.intent==="current"||graph.plan.freshness==="live")candidates.push({key:"change",title:`What actually changed in ${subject}`,thesis:first?`The most defensible way to understand the latest ${subject} update starts with ${readablePredicate(first.predicate).toLowerCase()}.`:`The latest ${subject} story is only worth publishing if the research identifies a material change.`,claimIds:findings.slice(0,4).map(f=>f.id),risk:32});
  if(first)candidates.push({key:"strongest-fact",title:`The ${readablePredicate(first.predicate)} detail that changes how to read ${subject}`,thesis:`A single well-supported fact can be more useful than a broad recap: ${first.valueText}.`,claimIds:[first.id,...findings.slice(1,3).map(f=>f.id)],risk:26});
  if(first&&second)candidates.push({key:"connection",title:`The connection inside ${subject} that is easy to miss`,thesis:`The useful story is the relationship between ${readablePredicate(first.predicate).toLowerCase()} and ${readablePredicate(second.predicate).toLowerCase()}, not a list of updates.`,claimIds:[first.id,second.id],risk:30});
  candidates.push({key:"consequence",title:`Why ${subject} matters now`,thesis:`The strongest article should explain the consequence of the verified evidence for the intended reader, without inflating the evidence into a larger claim.`,claimIds:findings.slice(0,4).map(f=>f.id),risk:28});
  if(graph.plan.intent==="compare")candidates.push({key:"difference",title:`${subject}: the difference that actually matters`,thesis:`A useful comparison should center the few differences that change a reader's decision or mental model.`,claimIds:findings.slice(0,5).map(f=>f.id),risk:24});
  if(graph.missingEvidence.length)candidates.push({key:"uncertainty",title:`What we know — and still don't — about ${subject}`,thesis:`The unresolved evidence is part of the story; the article should distinguish established findings from what remains open.`,claimIds:findings.slice(0,4).map(f=>f.id),risk:18});

  const sourceFamilies=new Set(graph.sources.map(s=>s.independenceFamily||s.provider)).size;const evidenceBase=clamp(graph.findings.length*6+graph.sources.length*4+sourceFamilies*10+(graph.confidence==="high"?18:graph.confidence==="medium"?9:0));
  const contract=readerContract(audience);
  return candidates.map(c=>{
    const novelty=noveltyAgainst(c.title,recent);const audienceScore=audienceBonus(`${c.title} ${c.thesis} ${contract.desiredOutcome}`,audience);const claimEvidence=c.claimIds.length?clamp(c.claimIds.map(id=>findings.find(f=>f.id===id)).filter(Boolean).reduce((sum,f)=>sum+claimStrength(f as ResearchFinding),0)/(c.claimIds.length*.48)):55;const evidence=clamp(evidenceBase*.65+claimEvidence*.35);const reusePenalty=angleReusePenalty(c.key,recentAngles);const score=clamp(evidence*.34+novelty*.28+audienceScore*.22+(100-c.risk)*.16-reusePenalty);
    return {...c,score,evidenceScore:evidence,noveltyScore:novelty,audienceScore,riskScore:c.risk,rationale:[`evidence ${evidence}/100`,`novelty ${novelty}/100`,`audience fit ${audienceScore}/100`,`risk ${c.risk}/100`,reusePenalty?`recent angle-form penalty -${reusePenalty}`:"angle form is fresh"]};
  }).sort((a,b)=>b.score-a.score).slice(0,5);
}

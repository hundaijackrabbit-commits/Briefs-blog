import { db } from "@/lib/db";
import type { GlobalEventCandidate,GlobalScoredCandidate } from "@/lib/publication/global-types";
import { scoreGlobalImportance } from "@/lib/publication/global-importance";
import { rankingInput } from "@/lib/publication/candidate-pool";

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
const STOP=new Set("the a an and or but for with from into over after before amid as at by to of in on is are was were be been being it its this that new latest update says world global today why what how when where matters explained".split(" "));
function tokens(value:string){return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(t=>t.length>2&&!STOP.has(t)));}
function similarity(a:string,b:string){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let same=0;for(const word of A)if(B.has(word))same++;return same/Math.max(1,Math.min(A.size,B.size));}
const STATE_CHANGE=["ceasefire","invasion","resign","resigns","resigned","elected","wins election","verdict","convicted","acquitted","approved","passes","enacted","signed","launches","launched","collapse","collapsed","default","attack","strikes","earthquake","erupts","deal reached","agreement signed","bankruptcy","assassination"];

type RecentFlagship={subject:string;category:string;editorial_day:string;mention_count:number;source_family_count:number;regions:string[]};
async function recentFlagships():Promise<RecentFlagship[]>{if(!process.env.DATABASE_URL)return [];try{const sql=db();const rows=await sql`select subject,category,editorial_day,mention_count,source_family_count,regions from publication_daily_flagships where editorial_day>=current_date-60 and editorial_day<current_date order by editorial_day desc limit 60`;return (rows as unknown as Array<{subject:string;category:string;editorial_day:string|Date;mention_count:number;source_family_count:number;regions:unknown}>).map(row=>({subject:String(row.subject),category:String(row.category),editorial_day:new Date(row.editorial_day).toISOString().slice(0,10),mention_count:Number(row.mention_count||0),source_family_count:Number(row.source_family_count||0),regions:Array.isArray(row.regions)?row.regions.map(String):[]}));}catch{return [];}}

function materialChange(candidate:GlobalEventCandidate,prior:RecentFlagship|undefined,sim:number){if(sim<0.48)return false;const text=`${candidate.subject} ${candidate.titles.join(" ")}`.toLowerCase();if(STATE_CHANGE.some(term=>text.includes(term)))return true;if(!prior)return false;const regionDelta=new Set(candidate.regions).size-new Set(prior.regions).size;return candidate.mentionCount>=Math.max(4,prior.mention_count*1.5)||candidate.domains.length>=prior.source_family_count+3||regionDelta>=2;}

function scoreWithHistory(candidate:GlobalEventCandidate,recent:RecentFlagship[]):GlobalScoredCandidate{
  const importance=scoreGlobalImportance(candidate);let maxSim=0;let closest:RecentFlagship|undefined;for(const prior of recent){const sim=similarity(candidate.subject,prior.subject);if(sim>maxSim){maxSim=sim;closest=prior;}}
  const sameCategoryYesterday=recent[0]?.category===candidate.category;const recentCategoryCount=recent.slice(0,5).filter(row=>row.category===candidate.category).length;
  const override=materialChange(candidate,closest,maxSim);let repeatPenalty=0;if(maxSim>=.72)repeatPenalty+=override?8:34;else if(maxSim>=.55)repeatPenalty+=override?5:24;else if(maxSim>=.40)repeatPenalty+=10;if(sameCategoryYesterday)repeatPenalty+=5;if(recentCategoryCount>=3)repeatPenalty+=6;
  const distinctivenessScore=clamp(100-maxSim*92-(sameCategoryYesterday?8:0)-Math.max(0,recentCategoryCount-2)*5+(override?16:0));
  const integrityScore=Number(candidate.candidateIntegrityScore||0);
  const integrityAdjustment=(integrityScore-70)*.12;
  const finalScore=clamp(importance.importanceScore*.74+distinctivenessScore*.18+importance.evidenceBreadth*.08-repeatPenalty*.55+integrityAdjustment);
  const rationale=[...importance.rationale,`discovery integrity ${integrityScore}/100`,`candidate eventhood ${Number(candidate.eventhoodScore||0)}/100`,`pairwise coherence ${Number(candidate.pairwiseCoherence||0)}/100`,`60-day distinctiveness ${distinctivenessScore}/100`,maxSim?`closest recent flagship similarity ${Math.round(maxSim*100)}%`:`no similar flagship found`,repeatPenalty?`repeat penalty -${repeatPenalty}`:"no repeat penalty",override?"material world-state change overrides most repetition penalty":"no material-change override needed"];
  return {...candidate,...importance,distinctivenessScore,repeatPenalty,finalScore,materialChangeOverride:override,rationale};
}

export async function scoreGlobalDistinctiveness(candidate:GlobalEventCandidate):Promise<GlobalScoredCandidate>{return scoreWithHistory(candidate,await recentFlagships());}
export async function rankGlobalCandidates(candidates:GlobalEventCandidate[]){const recent=await recentFlagships();return rankingInput(candidates).map(candidate=>scoreWithHistory(candidate,recent)).sort((a,b)=>b.finalScore-a.finalScore||b.importanceScore-a.importanceScore||b.evidenceBreadth-a.evidenceBreadth);}

import type { BriefRequest } from "@/lib/types";
import type { KnowledgeBundle,KnowledgeClaim } from "@/lib/knowledge/store";
import type { AnswerPlan,GroundedAnswer } from "@/lib/reader/types";

function clean(value:string){return value.replace(/\s+/g," ").trim();}
function sentence(value:string){const c=clean(value);return c?c.replace(/[.!?]+$/g,"")+".":"";}
function predicateSentence(claim:KnowledgeClaim){
  const text=clean(claim.text||"");
  if(text&&text.toLowerCase()!==`${claim.predicate}: ${claim.valueText}`.toLowerCase())return sentence(text);
  const p=claim.predicate.replace(/[_-]+/g," ").trim();
  if(!p)return sentence(claim.valueText);
  const subject=p.charAt(0).toUpperCase()+p.slice(1);
  return sentence(`${subject} is ${claim.valueText}`);
}
function scoreClaim(claim:KnowledgeClaim,plan:AnswerPlan,index:number){
  const hay=`${claim.predicate} ${claim.valueText} ${claim.text}`.toLowerCase();
  let score=50-index;
  for(let i=0;i<plan.factOrder.length;i++)if(hay.includes(plan.factOrder[i]))score+=18-i;
  if(claim.confidence==="high")score+=8;
  if(["confirmed","corroborated"].includes(claim.verificationStatus))score+=8;
  if(claim.sourceIds.length>1)score+=5;
  if(/\d/.test(claim.valueText))score+=plan.reader.audience==="investor"?7:2;
  return score;
}
function selectClaims(knowledge:KnowledgeBundle,plan:AnswerPlan,limit:number){
  return knowledge.claims.map((claim,index)=>({claim,index,score:scoreClaim(claim,plan,index)})).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.claim);
}
function leadFor(plan:AnswerPlan,knowledge:KnowledgeBundle,claims:KnowledgeClaim[]){
  if(plan.reader.goal==="catch-up"&&knowledge.changes.length)return sentence(knowledge.changes[0].summary);
  if(plan.reader.goal==="verify")return knowledge.sources.length?`Briefs currently has ${knowledge.sources.length} eligible source${knowledge.sources.length===1?"":"s"} attached to the evidence set for ${knowledge.subject}.`:`Briefs does not currently have inspectable source evidence for ${knowledge.subject}.`;
  const description=clean(knowledge.description);
  if(description&&description.length>35)return sentence(description);
  return claims[0]?predicateSentence(claims[0]):`Briefs does not yet have enough verified evidence to answer ${knowledge.subject} safely.`;
}
function implication(plan:AnswerPlan,knowledge:KnowledgeBundle,claims:KnowledgeClaim[]){
  if(clean(knowledge.whyItMatters))return clean(knowledge.whyItMatters);
  if(plan.reader.audience==="investor")return "The useful distinction is between a reported fact and what it changes about expectations, risk, or the earnings path.";
  if(plan.reader.audience==="executive")return "The useful question is what changes a decision, a risk, a cost, or the timing of action.";
  if(plan.reader.audience==="developer")return "The practical consequence is where the architecture, implementation constraint, or operating trade-off changes.";
  if(plan.reader.audience==="marketer")return "The useful consequence is whether audience behavior, positioning, demand, or channel economics actually change.";
  if(plan.reader.audience==="student")return "The goal is not to memorize the labels; it is to understand how the main facts connect.";
  if(knowledge.researchNeeded)return "The evidence is useful but incomplete, so the safest conclusion is narrower than the topic itself.";
  return claims.length?"The important part is how these facts fit together, not simply that each fact exists.":"";
}
function fallbackAnswer(request:BriefRequest,knowledge:KnowledgeBundle,plan:AnswerPlan):GroundedAnswer{
  const limit=request.depth==="flash"?1:request.depth==="quick"?2:request.depth==="standard"?4:8;
  const claims=selectClaims(knowledge,plan,limit);
  const lead=leadFor(plan,knowledge,claims);
  const rest=claims.map(predicateSentence).filter(s=>s&&s!==lead).slice(0,Math.max(0,limit-1));
  let summary=[lead,...rest].join(" ");
  if(knowledge.researchNeeded&&summary&&!/\b(evidence|uncertain|not enough|incomplete)\b/i.test(summary))summary+=` Evidence gaps remain, so Briefs is treating this as a ${knowledge.mode==="empty"?"coverage gap":"provisional answer"}.`;
  const why=implication(plan,knowledge,claims);
  const followups=plan.reader.goal==="decision"?["What evidence would change this conclusion?","What are the biggest risks?","What changed recently?"]:
    plan.reader.goal==="catch-up"?["What changed most materially?","What is still uncertain?","Show me the evidence."]:
    plan.reader.goal==="compare"?["Which differences matter most in practice?","Where are they actually similar?","What evidence is strongest?"]:
    ["What changed recently?","Why does this matter?","Show me the evidence."];
  return {summary,whyItMatters:sentence(why),claimIds:claims.map(c=>c.id),suggestedFollowups:followups,generatedBy:"briefs-reader-engine"};
}
function validExternal(value:unknown):value is {summary:string;whyItMatters?:string;claimIds:string[];suggestedFollowups?:string[]}{
  if(!value||typeof value!=="object")return false;const v=value as any;return typeof v.summary==="string"&&Array.isArray(v.claimIds)&&v.claimIds.every((x:unknown)=>typeof x==="string");
}

export async function composeReaderAnswer(request:BriefRequest,knowledge:KnowledgeBundle,plan:AnswerPlan):Promise<GroundedAnswer>{
  const url=process.env.BRIEFS_ANSWER_WRITER_URL;
  if(url&&knowledge.claims.length){
    try{
      const allowed=new Set(knowledge.claims.map(c=>c.id));
      const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...(process.env.BRIEFS_ANSWER_WRITER_TOKEN?{authorization:`Bearer ${process.env.BRIEFS_ANSWER_WRITER_TOKEN}`}:{})},body:JSON.stringify({task:"briefs-reader-answer",subject:knowledge.subject,reader:plan.reader,plan:{objective:plan.objective,opening:plan.opening,required:plan.required,avoid:plan.avoid,targetWords:plan.targetWords,uncertaintyRule:plan.uncertaintyRule,evidenceRule:plan.evidenceRule},claims:knowledge.claims.map(c=>({id:c.id,predicate:c.predicate,value:c.valueText,text:c.text,confidence:c.confidence,verificationStatus:c.verificationStatus,sourceIds:c.sourceIds})),changes:knowledge.changes,safety:{doNotInventFacts:true,doNotAddClaimIds:true,separateInference:true,avoidGenericAIStockPhrases:true}}),signal:AbortSignal.timeout(10_000)});
      if(response.ok){const candidate=await response.json();if(validExternal(candidate)&&candidate.claimIds.every(id=>allowed.has(id))){return {summary:clean(candidate.summary),whyItMatters:clean(candidate.whyItMatters||""),claimIds:candidate.claimIds,suggestedFollowups:Array.isArray(candidate.suggestedFollowups)?candidate.suggestedFollowups.map(String).slice(0,4):[],generatedBy:"configured-answer-writer"};}}
    }catch{/* deterministic reader-aware fallback below */}
  }
  return fallbackAnswer(request,knowledge,plan);
}

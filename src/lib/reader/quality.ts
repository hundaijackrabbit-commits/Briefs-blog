import type { BriefRequest } from "@/lib/types";
import type { KnowledgeBundle } from "@/lib/knowledge/store";
import type { AnswerPlan,AnswerQuality,GroundedAnswer } from "@/lib/reader/types";

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function words(text:string){return text.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(Boolean);}
const filler=["in today's","rapidly evolving","it is important to note","delve into","furthermore","ultimately","game-changer","only time will tell","this underscores"];
const jargon=["utilize","paradigm","synergy","ecosystem","leveraging","transformative","multifaceted","landscape"];

export function evaluateAnswerQuality(request:BriefRequest,knowledge:KnowledgeBundle,plan:AnswerPlan,answer:GroundedAnswer):AnswerQuality{
  const text=`${answer.summary} ${answer.whyItMatters}`.trim();const lower=text.toLowerCase();const tokenCount=words(text).length;
  const directness=clamp(100-(filler.filter(x=>lower.includes(x)).length*16)-(answer.summary.length>0&&answer.summary.split(/[.!?]/)[0].split(/\s+/).length>38?12:0));
  const allowed=new Set(knowledge.claims.map(c=>c.id));const validIds=answer.claimIds.filter(id=>allowed.has(id));const grounding=answer.claimIds.length?clamp(validIds.length/answer.claimIds.length*100):(knowledge.claims.length?25:100);
  const target=plan.targetWords;const clarity=clamp(100-Math.max(0,(tokenCount-target*1.35)/8)-jargon.filter(j=>lower.includes(j)).length*(plan.reader.expertise==="beginner"?8:2));
  let audienceFit=70;
  const audienceTerms=plan.reader.audience==="investor"?["risk","earnings","revenue","margin","expect","market","guidance"]:plan.reader.audience==="executive"?["decision","risk","timing","impact","cost","strategy"]:plan.reader.audience==="developer"?["technical","implementation","architecture","api","performance","constraint"]:plan.reader.audience==="marketer"?["audience","customer","market","position","demand","channel"]:plan.reader.audience==="student"?["understand","means","because","example","think of"]:["means","matters","evidence","change"];
  audienceFit=clamp(audienceFit+Math.min(24,audienceTerms.filter(t=>lower.includes(t)).length*6)+(plan.reader.goal==="catch-up"&&/changed|latest|recent/.test(lower)?8:0)+(plan.reader.goal==="verify"&&/evidence|source/.test(lower)?10:0));
  const uncertainty=clamp(knowledge.researchNeeded?( /uncertain|evidence gap|incomplete|provisional|not enough/.test(lower)?100:45):100);
  const specifics=(text.match(/\b\d[\d,.%$-]*\b/g)||[]).length+validIds.length;const specificity=clamp(Math.min(100,55+specifics*7));
  const warnings:string[]=[];if(directness<80)warnings.push("Answer still contains generic or indirect phrasing.");if(audienceFit<78)warnings.push("Answer does not sufficiently reflect the reader's goal and expertise.");if(grounding<100)warnings.push("One or more answer claim references are not present in the retrieved knowledge bundle.");if(uncertainty<80)warnings.push("Evidence gaps are not stated clearly enough.");if(clarity<75)warnings.push("Answer is too dense for the selected reading depth.");
  const score=clamp(directness*.18+audienceFit*.22+grounding*.25+clarity*.13+uncertainty*.12+specificity*.10);
  return {score,directness,audienceFit,grounding,clarity,uncertainty,specificity,warnings};
}

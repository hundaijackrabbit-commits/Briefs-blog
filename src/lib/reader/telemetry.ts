import { db } from "@/lib/db";
import type { AnswerPlan,AnswerQuality,GroundedAnswer } from "@/lib/reader/types";

export async function persistAnswerEvaluation(subject:string,intent:string,sourceMode:string,plan:AnswerPlan,answer:GroundedAnswer,quality:AnswerQuality){
  if(!process.env.DATABASE_URL)return false;
  try{const sql=db();await sql`insert into brief_answer_evaluations(subject,perspective,reader_goal,reader_expertise,intent,source_mode,total_score,audience_score,directness_score,grounding_score,clarity_score,uncertainty_score,specificity_score,generated_by,metadata) values(${subject},${plan.reader.audience},${plan.reader.goal},${plan.reader.expertise},${intent},${sourceMode},${quality.score},${quality.audienceFit},${quality.directness},${quality.grounding},${quality.clarity},${quality.uncertainty},${quality.specificity},${answer.generatedBy},${sql.json(JSON.parse(JSON.stringify({readerConfidence:plan.reader.confidence,warnings:quality.warnings})))})`;return true;}catch{return false;}
}

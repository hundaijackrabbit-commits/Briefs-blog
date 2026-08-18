import type { BriefRequest } from "@/lib/types";
import type { QueryIntentResult } from "@/lib/intelligence/query-intent";
import type { KnowledgeBundle } from "@/lib/knowledge/store";
import type { AnswerPlan,ReaderModel } from "@/lib/reader/types";

function targetWords(depth:BriefRequest["depth"]){return depth==="flash"?70:depth==="quick"?140:depth==="standard"?360:depth==="deep"?850:1300;}
function priorityTerms(reader:ReaderModel){
  if(reader.audience==="investor")return ["revenue","earnings","margin","guidance","growth","valuation","risk","cash","price"];
  if(reader.audience==="executive")return ["impact","risk","timing","cost","growth","strategy","demand","change"];
  if(reader.audience==="developer")return ["architecture","api","model","latency","performance","implementation","security","version"];
  if(reader.audience==="marketer")return ["audience","customer","market","brand","position","demand","conversion","channel"];
  if(reader.audience==="student")return ["definition","cause","effect","example","history","context"];
  return ["change","impact","cause","evidence","context"];
}

export function buildAnswerPlan(request:BriefRequest,intent:QueryIntentResult,reader:ReaderModel,knowledge:KnowledgeBundle):AnswerPlan{
  const objective=reader.goal==="catch-up"?`Explain the material change in ${knowledge.subject}, not the whole history.`:
    reader.goal==="decision"?`Help this ${reader.audience} understand what ${knowledge.subject} changes for a decision.`:
    reader.goal==="compare"?`Compare the subjects on meaningful differences instead of producing two mini biographies.`:
    reader.goal==="verify"?`Show what evidence supports the existing Brief on ${knowledge.subject}.`:
    reader.goal==="history"?`Explain ${knowledge.subject} chronologically with causal context.`:
    `Explain ${knowledge.subject} so the reader leaves with a usable mental model.`;
  const opening=reader.goal==="catch-up"?"Lead with the newest material change.":reader.goal==="decision"?"Lead with the consequence, then support it.":reader.goal==="verify"?"Lead with the evidence state, not a fresh narrative.":reader.goal==="compare"?"Lead with the strongest decision-relevant difference.":"Lead with the thing worth knowing; skip throat-clearing.";
  const required=[...new Set([...intent.answerContract,...reader.needs])];
  const avoid=[...new Set([...reader.avoid,"unsupported causal language","invented certainty","source-shaped phrasing"] )];
  return {subject:knowledge.subject,objective,opening,required,avoid,targetWords:targetWords(request.depth),factOrder:priorityTerms(reader),uncertaintyRule:"Say what is unknown directly. Do not turn missing evidence into a confident transition.",evidenceRule:"Every factual assertion must be traceable to retrieved claims or clearly labeled as interpretation.",reader};
}

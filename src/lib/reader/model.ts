import type { BriefRequest } from "@/lib/types";
import type { QueryIntentResult } from "@/lib/intelligence/query-intent";
import { depthToBudget,type ReaderExpertise,type ReaderGoal,type ReaderModel } from "@/lib/reader/types";

function inferGoal(subject:string,intent:QueryIntentResult,depth:BriefRequest["depth"]):ReaderGoal{
  const q=subject.toLowerCase();
  if(intent.intent==="evidence")return "verify";
  if(intent.intent==="previous_state"||intent.intent==="history")return "history";
  if(intent.intent==="compare")return "compare";
  if(intent.domain==="current"||/\b(what changed|latest|today|this week|since)\b/.test(q))return "catch-up";
  if(intent.domain==="finance"||/\b(should i|does this matter|what should|decision|risk|impact|worth)\b/.test(q))return "decision";
  if(/\b(to my boss|for my boss|for a client|for my team|explain .* to)\b/.test(q))return "translate";
  if(depth==="research"||/\b(research|paper|essay|sources|evidence)\b/.test(q))return "research";
  return "learn";
}

function expertiseFor(request:BriefRequest,goal:ReaderGoal):ReaderExpertise{
  const q=request.subject.toLowerCase();
  if(request.perspective==="developer"||request.perspective==="investor"||/\b(10-k|10-q|ebitda|api|sdk|kubernetes|latency|architecture|methodology|meta-analysis)\b/.test(q))return "specialist";
  if(request.perspective==="student"||/\b(beginner|simple terms|eli5|first time|what is|explain)\b/.test(q))return "beginner";
  if(goal==="research")return "informed";
  return "informed";
}

function needsFor(audience:BriefRequest["perspective"],goal:ReaderGoal){
  const base=goal==="catch-up"?["what changed","why it matters now","what remains unresolved"]:
    goal==="decision"?["decision-relevant consequence","downside or uncertainty","what would change the conclusion"]:
    goal==="compare"?["meaningful differences","shared baseline","trade-offs"]:
    goal==="verify"?["source provenance","claim-level support","uncertainty"]:
    goal==="history"?["chronology","causal context","what changed over time"]:
    goal==="research"?["evidence depth","source diversity","open questions"]:
    goal==="translate"?["plain-language meaning","practical implication","one memorable example"]:
    ["direct explanation","useful context","a durable mental model"];
  if(audience==="investor")return [...base,"market expectations","material risks"];
  if(audience==="executive")return [...base,"decision relevance","timing"];
  if(audience==="developer")return [...base,"implementation consequence","technical constraint"];
  if(audience==="marketer")return [...base,"audience implication","positioning or behavior"];
  if(audience==="student")return [...base,"definitions without condescension","clear causal links"];
  return base;
}

function toneFor(audience:BriefRequest["perspective"]){
  if(audience==="investor")return "Analytical, skeptical, numerate; separate fact from interpretation.";
  if(audience==="executive")return "Compact and consequence-first; protect the reader's time.";
  if(audience==="developer")return "Technically fluent, concrete, implementation-aware.";
  if(audience==="student")return "Clear and energetic; explain jargon once without talking down.";
  if(audience==="marketer")return "Commercially aware, audience-sensitive, specific rather than hype-driven.";
  return "Well-read, calm, curious, concise, and comfortable stating uncertainty plainly.";
}

export function inferReaderModel(request:BriefRequest,intent:QueryIntentResult):ReaderModel{
  const goal=inferGoal(request.subject,intent,request.depth);
  const q=request.subject.toLowerCase();
  const inferredAudience=request.perspective!=="general"?request.perspective:
    /\b(?:my boss|the boss|executive|leadership|board)\b/.test(q)?"executive":
    /\b(?:investor|stock|shares|valuation|earnings|portfolio)\b/.test(q)?"investor":
    /\b(?:developer|engineer|api|sdk|code|architecture|kubernetes)\b/.test(q)?"developer":
    /\b(?:student|essay|homework|class|exam|study guide)\b/.test(q)?"student":
    /\b(?:marketer|marketing|campaign|audience|customer acquisition|positioning)\b/.test(q)?"marketer":intent.effectivePerspective;
  const audience=inferredAudience;
  const explicit=request.perspective!=="general"||/\b(?:as|like)\s+(?:i(?:'|’)m\s+)?(?:a|an)\s+(executive|investor|developer|student|marketer)\b/i.test(request.subject)||/\b(?:my boss|the boss|for investors?|for developers?|for students?|for marketers?)\b/i.test(request.subject);
  const expertise=expertiseFor({...request,perspective:audience},goal);
  const likelyKnows=expertise==="specialist"?["domain basics","common terminology"]:expertise==="beginner"?[]:["basic context"];
  const avoid=[
    "generic scene-setting",
    "restating the question",
    ...(expertise==="specialist"?["introductory definitions the reader likely knows"]:[]),
    ...(expertise==="beginner"?["unexplained specialist jargon"]:[])
  ];
  const desiredOutcome=goal==="decision"?"The reader can explain the consequence, uncertainty, and next thing worth watching.":
    goal==="catch-up"?"The reader knows what materially changed and can ignore the surrounding noise.":
    goal==="compare"?"The reader can distinguish the options using the few differences that actually matter.":
    goal==="verify"?"The reader can inspect what supports the answer and what remains unproven.":
    goal==="research"?"The reader leaves with a defensible evidence map and clear unresolved questions.":
    goal==="history"?"The reader understands the sequence, causes, and what changed over time.":
    "The reader can explain the topic accurately in their own words.";
  return {audience,goal,expertise,timeBudget:depthToBudget(request.depth),likelyKnows,needs:needsFor(audience,goal),avoid,tone:toneFor(audience),desiredOutcome,confidence:explicit?98:intent.domain==="finance"?94:goal!=="learn"?88:72,inferred:!explicit};
}

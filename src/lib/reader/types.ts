import type { BriefDepth, BriefPerspective } from "@/lib/types";

export type ReaderGoal="learn"|"catch-up"|"decision"|"compare"|"research"|"translate"|"verify"|"history";
export type ReaderExpertise="beginner"|"informed"|"specialist";
export type ReaderTimeBudget="flash"|"short"|"standard"|"deep";

export type ReaderModel={
  audience:BriefPerspective;
  goal:ReaderGoal;
  expertise:ReaderExpertise;
  timeBudget:ReaderTimeBudget;
  likelyKnows:string[];
  needs:string[];
  avoid:string[];
  tone:string;
  desiredOutcome:string;
  confidence:number;
  inferred:boolean;
};

export type AnswerPlan={
  subject:string;
  objective:string;
  opening:string;
  required:string[];
  avoid:string[];
  targetWords:number;
  factOrder:string[];
  uncertaintyRule:string;
  evidenceRule:string;
  reader:ReaderModel;
};

export type GroundedAnswer={
  summary:string;
  whyItMatters:string;
  claimIds:string[];
  suggestedFollowups:string[];
  generatedBy:"briefs-reader-engine"|"configured-answer-writer";
};

export type AnswerQuality={
  score:number;
  directness:number;
  audienceFit:number;
  grounding:number;
  clarity:number;
  uncertainty:number;
  specificity:number;
  warnings:string[];
};

export function depthToBudget(depth:BriefDepth):ReaderTimeBudget{
  return depth==="flash"?"flash":depth==="quick"?"short":depth==="standard"?"standard":"deep";
}

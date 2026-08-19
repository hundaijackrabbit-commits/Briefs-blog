import type { ArticleDraft,OriginalityReport,PublicationQualityReport,StoryContract } from "@/lib/publication/types";
import type { ResearchGraph } from "@/lib/research/types";
import { evaluateVoice } from "@/lib/publication/voice";
import { evaluateAudienceFit } from "@/lib/publication/audience";

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function tokens(text:string){return text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean);}
function wordCount(text:string){return text.trim().split(/\s+/).filter(Boolean).length;}
function titleEvidenceScore(draft:ArticleDraft,graph:ResearchGraph){
  const title=new Set(tokens(draft.title));
  const subject=tokens(graph.canonicalSubject);
  const claimWords=new Set(graph.findings.flatMap(f=>tokens(`${f.predicate} ${f.valueText}`)).filter(w=>w.length>3));
  let overlap=subject.filter(w=>title.has(w)).length*18;
  for(const w of title)if(claimWords.has(w))overlap+=4;
  return clamp(45+overlap);
}
function specificityScore(text:string){
  const nums=(text.match(/\b\d[\d,.%$-]*\b/g)||[]).length;
  const vague=(text.toLowerCase().match(/\b(various|numerous|significant|important|many|some|things|aspects|factors)\b/g)||[]).length;
  return clamp(68+Math.min(28,nums*4)-vague*4);
}

const INTERNAL_META_PATTERNS:Array<{re:RegExp;label:string}>=[
  {re:/\bthe reader should\b/i,label:"the reader should"},
  {re:/\bthe article should\b/i,label:"the article should"},
  {re:/\bthe draft should\b/i,label:"the draft should"},
  {re:/\bthe writer should\b/i,label:"the writer should"},
  {re:/\bone source finding is summarized as\b/i,label:"one source finding is summarized as"},
  {re:/\bsource finding(?:s)?\b/i,label:"source finding"},
  {re:/\breader outcome\b/i,label:"reader outcome"},
  {re:/\bwithout borrowing source language\b/i,label:"without borrowing source language"},
  {re:/\bsource prose was not used as a writing template\b/i,label:"source prose was not used as a writing template"},
  {re:/\brecent reporting detail that changes how to read\b/i,label:"recent reporting detail that changes how to read"}
];

function readerReadyChecks(draft:ArticleDraft){
  const visible=[draft.title,draft.deck,...draft.sections.filter(s=>s.purpose!=="method").map(s=>`${s.heading}\n${s.body}`)].join("\n\n");
  const metaHits=INTERNAL_META_PATTERNS.filter(item=>item.re.test(visible)).map(item=>item.label);
  const nonMethod=draft.sections.filter(s=>s.purpose!=="method");
  const nonMethodWords=nonMethod.reduce((sum,s)=>sum+wordCount(s.body),0);
  const substantiveSections=nonMethod.filter(s=>wordCount(s.body)>=25).length;
  const deckWords=wordCount(draft.deck);
  const titleWords=wordCount(draft.title);
  const issues:string[]=[];
  if(metaHits.length)issues.push(`Reader-ready gate found internal/editorial meta-language: ${[...new Set(metaHits)].join(", ")}.`);
  if(nonMethodWords<160)issues.push(`Reader-ready gate requires at least 160 words of non-method narrative; draft has ${nonMethodWords}.`);
  if(substantiveSections<3)issues.push(`Reader-ready gate requires at least 3 substantive reader-facing sections; draft has ${substantiveSections}.`);
  if(deckWords<12)issues.push(`Reader-ready gate requires a useful deck of at least 12 words; draft has ${deckWords}.`);
  if(titleWords<4||titleWords>22)issues.push(`Reader-ready gate requires a concise, informative headline between 4 and 22 words; draft has ${titleWords}.`);
  return {issues,nonMethodWords,substantiveSections};
}

export function evaluatePublicationQuality(args:{draft:ArticleDraft;graph:ResearchGraph;originality:OriginalityReport;minSources:number;requirePrimary:boolean;minStoryScore:number;storyScore:number;independentFamilies:number;primarySources:number;storyContract:StoryContract;}):PublicationQualityReport{
  const {draft,graph,originality,storyContract}=args;
  const allowedClaims=new Set(graph.findings.map(f=>f.id));
  const usedClaims=new Set(draft.sections.flatMap(s=>s.claimIds));
  const unsupportedClaimIds=[...usedClaims].filter(id=>!allowedClaims.has(id));
  const evidenceCoverage=usedClaims.size?clamp([...usedClaims].filter(id=>allowedClaims.has(id)).length/usedClaims.size*100):0;
  const factualUngrounded=draft.sections.filter(s=>["answer","evidence","context"].includes(s.purpose||"")&&s.body.trim().length>80&&s.claimIds.length===0);
  const fullText=[draft.title,draft.deck,...draft.sections.map(s=>`${s.heading}\n${s.body}`)].join("\n\n");
  const voice=evaluateVoice(fullText);
  const audience=evaluateAudienceFit(draft);
  const diversity=clamp(args.independentFamilies*24+Math.min(args.primarySources,2)*12);
  const originalityScore=originality.passed?clamp(100-originality.maxSourceOverlap*220-originality.maxLibraryOverlap*120):clamp(55-originality.longestMatchingWords);
  const freshnessScore=graph.plan.freshness==="historical"?95:clamp(100-Math.max(0,(Date.now()-Date.parse(graph.knowledgeCutoff))/3_600_000)*2);
  const headlineScore=titleEvidenceScore(draft,graph);
  const specificity=specificityScore(fullText);
  const readerReady=readerReadyChecks(draft);

  const blockers:string[]=[];
  const warnings=[...voice.warnings,...originality.warnings,...audience.warnings];
  const minimumGroundedClaims=Math.min(2,graph.findings.length);

  if(usedClaims.size<minimumGroundedClaims)blockers.push(`Draft uses ${usedClaims.size} grounded claim(s); at least ${minimumGroundedClaims} are required.`);
  if(graph.sources.length<args.minSources)blockers.push(`Needs at least ${args.minSources} eligible sources.`);
  if(args.requirePrimary&&args.primarySources<1)blockers.push("A primary source is required for this keyword.");
  if(args.independentFamilies<2)blockers.push("Needs evidence from at least two independent source families.");
  if(!originality.passed)blockers.push("Originality gate failed.");
  if(unsupportedClaimIds.length)blockers.push(`${unsupportedClaimIds.length} draft claim reference(s) are not present in the research graph.`);
  if(factualUngrounded.length)blockers.push(`${factualUngrounded.length} factual section(s) lack claim-level grounding.`);
  if(graph.alignment&&!graph.alignment.passed)blockers.push(`Research subject alignment ${graph.alignment.score}/100 failed: ${graph.alignment.reasons.join(" ")}`);if(!graph.sufficient)blockers.push("Research is not sufficient to support publication.");
  if(args.storyScore<args.minStoryScore)blockers.push(`Story score ${args.storyScore} is below the ${args.minStoryScore} threshold.`);
  if(voice.score<76)blockers.push("Voice quality is below the V10.2 publication threshold.");
  if(audience.score<76)blockers.push("Audience fit is below the V10.2 publication threshold.");
  if(headlineScore<68)blockers.push("Headline is not sufficiently anchored to the researched subject/evidence.");
  if(!storyContract.strongestClaimIds.every(id=>allowedClaims.has(id)))blockers.push("Story contract references claims outside the research graph.");
  blockers.push(...readerReady.issues);

  if(draft.generatedBy==="briefs-deterministic")warnings.push("Deterministic fallback writer used; human editorial review is required before publication.");

  const totalScore=clamp(evidenceCoverage*.21+diversity*.14+originalityScore*.15+audience.score*.15+voice.score*.13+freshnessScore*.09+headlineScore*.07+specificity*.06);

  return {
    passed:blockers.length===0&&totalScore>=83,
    totalScore,
    evidenceCoverage,
    evidenceDiversity:diversity,
    originalityScore,
    audienceScore:audience.score,
    readerGoalScore:audience.goalScore,
    voiceScore:voice.score,
    freshnessScore,
    headlineScore,
    specificityScore:specificity,
    unsupportedFacts:unsupportedClaimIds.length+factualUngrounded.length,
    blockers,
    warnings:[...warnings,`Reader-ready narrative: ${readerReady.nonMethodWords} words across ${readerReady.substantiveSections} substantive sections.`,`Reader outcome: ${storyContract.readerOutcome}`,`Voice evaluator: ${voice.version}`]
  };
}

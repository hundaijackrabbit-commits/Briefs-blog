import type { ArticleDraft } from "@/lib/publication/types";
import type { ResearchGraph } from "@/lib/research/types";

const STOP=new Set("the a an and or but for with from into over after before amid as at by to of in on is are was were be been being it its this that these those new latest update says say said report reports world global today yesterday tomorrow live more most less than about could would should will may might has have had not no yes their his her our your who what why how when where which one two three first last major key top".split(" "));

const PROSE_SCAFFOLD_PATTERNS:Array<{re:RegExp;label:string}>=[
  {re:/\brepresented in the aligned evidence set\b/i,label:"represented in the aligned evidence set"},
  {re:/\brepresented in the research graph\b/i,label:"represented in the research graph"},
  {re:/\bresearch graph\b/i,label:"research graph"},
  {re:/\baligned evidence set\b/i,label:"aligned evidence set"},
  {re:/\bprovides? an independent account\b/i,label:"provides an independent account"},
  {re:/\bprovides? a separate account with context around\b/i,label:"provides a separate account with context around"},
  {re:/\badds? quantified context to\b/i,label:"adds quantified context to"},
  {re:/\badds? independently reported context to\b/i,label:"adds independently reported context to"},
  {re:/\bcontributes? additional reported detail involving\b/i,label:"contributes additional reported detail involving"},
  {re:/\bthe evidence records\b/i,label:"the evidence records"},
  {re:/\bverified value attached to\b/i,label:"verified value attached to"}
];

const DECK_META_PATTERNS:Array<{re:RegExp;label:string}>=[
  {re:/^\s*Briefs found\s+\d+\s+eligible source/i,label:"source-count methodology"},
  {re:/\bindependent source families\b/i,label:"source-family methodology"},
  {re:/\bthe evidence is coherent on\b/i,label:"evidence-coherence methodology"}
];

const EXTRACTION_RESIDUE_PATTERNS:Array<{re:RegExp;label:string}>=[
  {re:/\bcontext around\s+[a-z0-9.-]+(?:,\s*[a-z0-9.-]+){2,}\b/i,label:"comma-separated extraction residue"},
  {re:/\bcenters? on\s+[a-z0-9.-]+(?:,\s*[a-z0-9.-]+){2,}\b/i,label:"comma-separated extraction residue"}
];

const DEFAULT_INTERPRETIVE_BRIDGES=[
  "That distinction matters because the observed event and its downstream consequences are different questions; confidence in one does not automatically establish the other.",
  "The useful next step is to keep verified developments separate from projections until additional evidence changes the picture.",
  "That boundary is part of the answer, not a gap to fill with speculation."
];

function normalize(value:string){
  return String(value||"").toLowerCase().replace(/[^a-z0-9\s-]/g," ").replace(/-/g," ").replace(/\s+/g," ").trim();
}
function tokens(value:string){return normalize(value).split(/\s+/).filter(Boolean);}
function subjectTerms(subject:string){return [...new Set(tokens(subject).filter(t=>t.length>=4&&!STOP.has(t)))];}
function findAnswer(draft:ArticleDraft){return draft.sections.find(s=>s.purpose==="answer"||s.key==="brief"||/^what changed$/i.test(s.heading));}
function visibleNonMethod(draft:ArticleDraft){return [draft.title,draft.deck,...draft.sections.filter(s=>s.purpose!=="method").map(s=>`${s.heading}\n${s.body}`)].join("\n\n");}
function genericHeadlineShell(title:string,subject:string){const t=normalize(title),s=normalize(subject);if(!s||!t.includes(s))return false;return /^(why|what changed|briefing|why it matters)\b/.test(t);}

export type ReaderFacingProseIntegrityReport={
  issues:string[];
  warnings:string[];
  openingAnchorHits:number;
  openingAnchorRequired:number;
  genericBridgeCount:number;
};

export function evaluateReaderFacingProseIntegrity(draft:ArticleDraft,graph:ResearchGraph):ReaderFacingProseIntegrityReport{
  const issues:string[]=[];
  const warnings:string[]=[];
  const visible=visibleNonMethod(draft);

  const scaffoldHits=PROSE_SCAFFOLD_PATTERNS.filter(item=>item.re.test(visible)).map(item=>item.label);
  if(scaffoldHits.length)issues.push(`Reader-facing prose integrity gate found publication-process/scaffolding language: ${[...new Set(scaffoldHits)].join(", ")}.`);

  const deckMeta=DECK_META_PATTERNS.filter(item=>item.re.test(draft.deck)).map(item=>item.label);
  if(deckMeta.length)issues.push(`Reader-facing prose integrity gate rejected a methodology-first deck: ${[...new Set(deckMeta)].join(", ")}.`);

  const residueHits=EXTRACTION_RESIDUE_PATTERNS.filter(item=>item.re.test(visible)).map(item=>item.label);
  if(residueHits.length)issues.push(`Reader-facing prose integrity gate found extracted keyword/list residue: ${[...new Set(residueHits)].join(", ")}.`);

  const answer=findAnswer(draft);
  const terms=subjectTerms(graph.canonicalSubject);
  const answerTokens=new Set(tokens(answer?.body||""));
  const openingAnchorHits=terms.filter(t=>answerTokens.has(t)).length;
  const openingAnchorRequired=Math.min(2,terms.length);
  if(!answer)issues.push("Reader-facing prose integrity gate requires a clear opening answer section.");
  else if(openingAnchorRequired>0&&openingAnchorHits<openingAnchorRequired){
    issues.push(`Reader-facing prose integrity gate requires the opening answer to state the event itself; it contains ${openingAnchorHits}/${openingAnchorRequired} required subject anchors.`);
  }

  const genericBridgeCount=DEFAULT_INTERPRETIVE_BRIDGES.filter(sentence=>visible.includes(sentence)).length;
  if(genericBridgeCount>=2){
    issues.push(`Reader-facing prose integrity gate rejected generic length padding: ${genericBridgeCount} stock interpretive bridge sentences appear in the reader-facing article.`);
  }else if(genericBridgeCount===1){
    warnings.push("One bounded interpretive bridge sentence was used; editorial review should confirm it adds event-specific value.");
  }

  if(genericHeadlineShell(draft.title,graph.canonicalSubject)){
    warnings.push("Headline wraps the canonical event label in a generic shell; editorial rewrite is recommended.");
  }

  return {issues,warnings,openingAnchorHits,openingAnchorRequired,genericBridgeCount};
}

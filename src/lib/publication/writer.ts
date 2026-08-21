import type { ResearchFinding,ResearchGraph,ResearchSource } from "@/lib/research/types";
import type { ArticleDraft,ArticleSectionDraft,PublicationAudience,StoryContract } from "@/lib/publication/types";
import { readerContract } from "@/lib/publication/audience";
import { detectWritingDomain,domainMeaning,domainWatch,synthesizeReportingFinding } from "@/lib/publication/writer-synthesis";
import { originalitySafeHeadline,originalitySafeSubject } from "@/lib/publication/headline-originality";
import { augmentGroundedDepth } from "@/lib/publication/grounded-depth";
import { augmentInterpretiveDepth } from "@/lib/publication/interpretive-depth";
import { eventFirstDeck,eventFirstHeadline,eventFirstSentence,eventSpecificBridge,eventSpecificMeaning,eventSpecificUncertainty,eventSpecificWatch,isGenericReportingFinding } from "@/lib/publication/event-first-prose";

function clean(value:string){return value.replace(/\s+/g," ").trim();}
function sentence(value:string){const c=clean(value);return c?c.replace(/[.!?]+$/g,"")+".":"";}
function articleType(graph:ResearchGraph):ArticleDraft["articleType"]{return graph.plan.intent==="current"||graph.plan.freshness==="live"?"briefing":graph.plan.intent==="history"||graph.plan.intent==="explain"?"explainer":"analysis";}
function sourceMap(graph:ResearchGraph){return new Map(graph.sources.map(s=>[s.id,s] as const));}
function findingSource(f:ResearchFinding,graph:ResearchGraph):ResearchSource|undefined{const byId=sourceMap(graph);return f.sourceIds.map(id=>byId.get(id)).find((x):x is ResearchSource=>Boolean(x));}
function stripOutletSuffix(value:string){return clean(value).replace(/\s+[|–—-]\s+[^|–—-]{2,60}$/,"").replace(/\s*:\s*(WHO|CDC|UN|AP|Reuters)$/i,"").trim();}
function evidenceText(graph:ResearchGraph){return [graph.canonicalSubject,...graph.findings.map(f=>`${f.predicate} ${f.valueText} ${f.statement}`),...graph.sources.map(s=>`${s.title} ${s.excerpt||""}`)].join(" ");}
function proseSubject(graph:ResearchGraph){return originalitySafeSubject(graph.canonicalSubject,graph.sources.map(s=>s.title));}

function claimSentence(f:ResearchFinding,graph:ResearchGraph,index:number,domain:ReturnType<typeof detectWritingDomain>){
  const p=clean(f.predicate.replace(/[_-]+/g," "));const v=clean(f.valueText||f.statement||"");const source=findingSource(f,graph);
  if(/^(recent reporting|external context)$/i.test(p)){const event=eventFirstSentence(f,graph);if(event)return sentence(event);return sentence(synthesizeReportingFinding(v,proseSubject(graph),source?.name,domain,index));}
  if(v&&p){if(index%3===0)return sentence(`For ${p.toLowerCase()}, the evidence records ${v}`);if(index%3===1)return sentence(`The verified value attached to ${p.toLowerCase()} is ${v}`);return sentence(`${p.charAt(0).toUpperCase()+p.slice(1)} is represented in the research graph as ${v}`);}
  return sentence(v);
}
function selectedFindings(graph:ResearchGraph,ids:string[],fallback=6){const byId=new Map(graph.findings.map(f=>[f.id,f] as const));const selected=ids.map(id=>byId.get(id)).filter((x):x is ResearchFinding=>Boolean(x));return selected.length?selected:graph.findings.slice(0,fallback);}
function paragraph(findings:ResearchFinding[],graph:ResearchGraph,domain:ReturnType<typeof detectWritingDomain>,max=4){return findings.slice(0,max).map((f,i)=>claimSentence(f,graph,i,domain)).join(" ");}
function headlineFor(graph:ResearchGraph,contract:StoryContract){
  const subject=graph.canonicalSubject.replace(/\b\w/g,m=>m.toUpperCase());const facts=graph.findings.map(f=>clean(f.valueText||f.statement||""));const numeric=facts.find(x=>/\b\d[\d,.]*\b/.test(x));
  let preferred=eventFirstHeadline(graph);
  if(numeric){const n=(numeric.match(/\b\d[\d,.]*\b/)||[])[0];if(/infection/i.test(numeric))preferred=`${subject}: Reported Infections Pass ${n}`;else if(/dead|death/i.test(numeric))preferred=`${subject}: Death Toll Passes ${n}`;}
  if(!preferred){const strongest=facts.find(x=>/deadliest|emergency|sixth province|record/i.test(x));if(strongest&&stripOutletSuffix(strongest).split(/\s+/).length<=16)preferred=stripOutletSuffix(strongest);}
  if(!preferred)preferred=contract.angle&&contract.angle.length<=110?contract.angle:`What changed in ${graph.canonicalSubject}`;
  return originalitySafeHeadline(preferred,graph.canonicalSubject,graph.sources.map(s=>s.title));
}
function deckFor(graph:ResearchGraph,opening:string,evidence:string){return eventFirstDeck(opening,evidence)||clean(opening).slice(0,280);}

function deterministicDraft(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):ArticleDraft{
  const allEvidence=evidenceText(graph);const domain=detectWritingDomain(category,graph.canonicalSubject,allEvidence);const proseSubjectValue=proseSubject(graph);const strongest=selectedFindings(graph,contract.strongestClaimIds);const counter=selectedFindings(graph,contract.counterClaimIds,0);
  const openingCount=strongest.length&&strongest.every(isGenericReportingFinding)?1:strongest.length>=3?2:Math.min(2,strongest.length);
  const openingFindings=strongest.slice(0,openingCount);const usedOpening=new Set(openingFindings.map(f=>f.id));const remainingStrongest=strongest.slice(openingCount);
  const evidenceFindings=(remainingStrongest.length?remainingStrongest:graph.findings.filter(f=>!usedOpening.has(f.id))).slice(0,4);

  const opening=paragraph(openingFindings,graph,domain,2)||sentence(graph.description)||`The available evidence on ${proseSubjectValue} is still too thin for a confident briefing.`;
  const evidence=paragraph(evidenceFindings,graph,domain,4)||`The remaining evidence does not add a distinct second factual section without repeating the same claims.`;
  const meaning=eventSpecificMeaning(category,proseSubjectValue,allEvidence)||domainMeaning(domain,proseSubjectValue);
  const eventUncertainty=eventSpecificUncertainty(category,proseSubjectValue,allEvidence);const uncertainty=eventUncertainty|| (graph.missingEvidence.length?`The main unresolved issue is ${graph.missingEvidence.slice(0,2).join(" ")}`:counter.length?`Some evidence complicates the simplest reading. ${paragraph(counter,graph,domain,2)}`:`The current evidence is strong on the reported event, but weaker on downstream consequences that have not yet been directly observed.`);
  const watch=eventSpecificWatch(category,proseSubjectValue,allEvidence)||domainWatch(domain,proseSubjectValue,allEvidence);
  const method=`Briefs built this briefing from ${graph.findings.length} structured findings across ${graph.sources.length} eligible sources and ${new Set(graph.sources.map(s=>s.independenceFamily||s.provider)).size} independent source families.`;

  const depth=augmentGroundedDepth({
    answerBody:opening,
    evidenceBody:evidence,
    answerClaimIds:openingFindings.map(f=>f.id),
    evidenceClaimIds:evidenceFindings.map(f=>f.id),
    otherNarrativeText:[meaning,sentence(uncertainty),watch].join(" "),
    candidates:graph.findings.map((f,i)=>({id:f.id,sentence:claimSentence(f,graph,i+3,domain)})),
    targetNarrativeWords:180,
    targetEvidenceWords:24
  });

  const eventBridge=eventSpecificBridge(category,proseSubjectValue,allEvidence);
  const interpretive=augmentInterpretiveDepth({
    body:meaning,
    currentNarrativeWords:depth.narrativeWords,
    targetNarrativeWords:180,
    bridges:eventBridge?[eventBridge]:[]
  });

  const answer:ArticleSectionDraft={key:"brief",heading:"What changed",body:depth.answerBody,claimIds:depth.answerClaimIds,purpose:"answer"};
  const meaningSection:ArticleSectionDraft={key:"meaning",heading:"Why it matters",body:interpretive.body,claimIds:[],purpose:"analysis"};
  const evidenceSection:ArticleSectionDraft={key:"evidence",heading:"What the evidence says",body:depth.evidenceBody,claimIds:depth.evidenceClaimIds,purpose:"evidence"};
  const limitsSection:ArticleSectionDraft={key:"limits",heading:"What remains uncertain",body:sentence(uncertainty),claimIds:counter.map(f=>f.id),purpose:"watch"};
  const watchSection:ArticleSectionDraft={key:"watch",heading:"What to watch next",body:watch,claimIds:[],purpose:"analysis"};
  const methodSection:ArticleSectionDraft={key:"method",heading:"How Briefs reached this",body:method,claimIds:[],purpose:"method"};

  const sections=contract.angleKey==="uncertainty"?[answer,limitsSection,evidenceSection,meaningSection,watchSection,methodSection]:contract.angleKey==="strongest-fact"?[answer,evidenceSection,meaningSection,limitsSection,watchSection,methodSection]:contract.angleKey==="connection"?[answer,meaningSection,evidenceSection,limitsSection,watchSection,methodSection]:contract.angleKey==="consequence"?[answer,meaningSection,watchSection,evidenceSection,limitsSection,methodSection]:contract.angleKey==="difference"?[answer,evidenceSection,meaningSection,watchSection,limitsSection,methodSection]:[answer,meaningSection,evidenceSection,limitsSection,watchSection,methodSection];

  return {title:headlineFor(graph,contract),deck:deckFor(graph,opening,evidence),category,audience,articleType:articleType(graph),sections,claimIds:[...new Set([answer,evidenceSection,limitsSection].flatMap(section=>section.claimIds))],generatedBy:"briefs-deterministic"};
}

function validExternalDraft(value:unknown):value is ArticleDraft{if(!value||typeof value!=="object")return false;const d=value as Partial<ArticleDraft>;return typeof d.title==="string"&&typeof d.deck==="string"&&Array.isArray(d.sections)&&d.sections.every(s=>s&&typeof s.heading==="string"&&typeof s.body==="string"&&Array.isArray(s.claimIds));}

export async function composePublicationArticle(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):Promise<ArticleDraft>{
  const url=process.env.PUBLICATION_WRITER_URL;
  if(url){try{
    const allowed=new Set(graph.findings.map(f=>f.id));const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...(process.env.PUBLICATION_WRITER_TOKEN?{authorization:`Bearer ${process.env.PUBLICATION_WRITER_TOKEN}`}:{})},body:JSON.stringify({task:"briefs-publication-draft-v3",subject:graph.canonicalSubject,intent:graph.plan.intent,freshness:graph.plan.freshness,reader:readerContract(audience),story:contract,claims:graph.findings.map(f=>({id:f.id,subject:f.subject,predicate:f.predicate,value:f.valueText,confidence:f.confidence,verificationStatus:f.verificationStatus})),constraints:{doNotInventFacts:true,eachFactualSectionMustListClaimIds:true,claimIdsMustComeFromInput:true,doNotQuoteOrImitateSourceWording:true,avoidGenericAIStockPhrases:true,distinguishFactFromInference:true,writeToReaderGoal:true,neverExposeEditorialInstructions:true,neverSayTheReaderShould:true,minimumReaderFacingWords:180}}),signal:AbortSignal.timeout(12_000)});
    if(response.ok){const candidate=await response.json();if(validExternalDraft(candidate)&&candidate.sections.every(s=>s.claimIds.every(id=>allowed.has(id))))return {...candidate,audience,category,generatedBy:"configured-writer"};}
  }catch{/* safe deterministic fallback */}}
  return deterministicDraft(graph,audience,category,contract);
}

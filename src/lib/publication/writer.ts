import type { ResearchFinding,ResearchGraph } from "@/lib/research/types";
import type { ArticleDraft,ArticleSectionDraft,PublicationAudience,StoryContract } from "@/lib/publication/types";
import { readerContract } from "@/lib/publication/audience";

function clean(value:string){return value.replace(/\s+/g," ").trim();}
function sentence(value:string){const c=clean(value);return c?c.replace(/[.!?]+$/g,"")+".":"";}
function articleType(graph:ResearchGraph):ArticleDraft["articleType"]{return graph.plan.intent==="current"||graph.plan.freshness==="live"?"briefing":graph.plan.intent==="history"||graph.plan.intent==="explain"?"explainer":"analysis";}
function quoteFragment(value:string,maxWords=12){const words=clean(value).split(/\s+/).filter(Boolean);const clipped=words.slice(0,maxWords).join(" ");return {text:clipped,truncated:words.length>maxWords};}
function claimSentence(f:ResearchFinding,index:number){
  const statement=clean(f.statement||"");const p=f.predicate.replace(/[_-]+/g," ").trim();const v=clean(f.valueText);const sourceProse=/^(recent reporting|external context)$/i.test(p)||statement.split(/\s+/).length>16||v.split(/\s+/).length>16;
  if(sourceProse){const q=quoteFragment(statement||v);return sentence(`One source finding is summarized as “${q.text}${q.truncated?"…":""}”`);}
  if(statement&&statement.toLowerCase()!==`${f.predicate}: ${f.valueText}`.toLowerCase())return sentence(statement);
  if(index%3===0)return sentence(`${v} is the figure attached to ${p.toLowerCase()}`);
  if(index%3===1)return sentence(`On ${p.toLowerCase()}, the evidence points to ${v}`);
  return sentence(`${p.charAt(0).toUpperCase()+p.slice(1)} comes in at ${v}`);
}
function selectedFindings(graph:ResearchGraph,ids:string[],fallback=6){const byId=new Map(graph.findings.map(f=>[f.id,f] as const));const selected=ids.map(id=>byId.get(id)).filter((x):x is ResearchFinding=>Boolean(x));return selected.length?selected:graph.findings.slice(0,fallback);}
function paragraph(findings:ResearchFinding[],max=4){return findings.slice(0,max).map((f,i)=>claimSentence(f,i)).join(" ");}
function meaningFor(audience:PublicationAudience,contract:StoryContract){
  if(audience==="investor")return `For an investor, the article should separate what the evidence changes about expectations from what is still interpretation. ${contract.readerOutcome}`;
  if(audience==="executive")return `For an executive, the useful part is the consequence for timing, risk, or a decision—not the volume of source material. ${contract.readerOutcome}`;
  if(audience==="developer")return `For a developer, the article should turn the evidence into an implementation or architecture consequence where the sources support one. ${contract.readerOutcome}`;
  if(audience==="marketer")return `For a marketer, the article should connect the evidence to audience behavior, market position, or demand only where that connection is defensible. ${contract.readerOutcome}`;
  if(audience==="student")return `For a student, the article should make the causal chain easy to follow without flattening uncertainty. ${contract.readerOutcome}`;
  return contract.readerOutcome;
}

function deterministicDraft(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):ArticleDraft{
  const strongest=selectedFindings(graph,contract.strongestClaimIds);const counter=selectedFindings(graph,contract.counterClaimIds,0);
  const openingFindings=strongest.slice(0,3);const usedOpening=new Set(openingFindings.map(f=>f.id));
  const evidenceFindings=(strongest.slice(3).length?strongest.slice(3):graph.findings.filter(f=>!usedOpening.has(f.id))).slice(0,4);
  const opening=paragraph(openingFindings,3)||sentence(graph.description)||`Briefs researched ${graph.canonicalSubject}, but the evidence is still too thin for a confident article.`;
  const evidence=paragraph(evidenceFindings,4)||"The evidence set is too narrow to add a second factual section without repeating the opening.";
  const uncertainty=graph.missingEvidence.length?`The important limit is what the evidence still cannot establish: ${graph.missingEvidence.slice(0,2).join(" ")}`:counter.length?`There is also evidence that complicates the clean version of the story. ${paragraph(counter,2)}`:"The current evidence set does not contain a material unresolved gap, but that does not turn interpretation into fact.";
  const meaning=sentence(meaningFor(audience,contract));
  const method=`Briefs built this article from ${graph.findings.length} structured finding${graph.findings.length===1?"":"s"} across ${graph.sources.length} eligible source${graph.sources.length===1?"":"s"}. Source prose was not used as a writing template.`;
  const answer:ArticleSectionDraft={key:"brief",heading:contract.angleKey==="strongest-fact"?"The detail":"The brief",body:opening,claimIds:openingFindings.map(f=>f.id),purpose:"answer"};
  const evidenceSection:ArticleSectionDraft={key:"evidence",heading:contract.angleKey==="connection"?"The two pieces":"What the evidence actually says",body:evidence,claimIds:evidenceFindings.map(f=>f.id),purpose:evidenceFindings.length?"evidence":"analysis"};
  const meaningSection:ArticleSectionDraft={key:"meaning",heading:contract.angleKey==="connection"?"The connection":contract.angleKey==="consequence"?"The consequence":"Why it matters",body:meaning,claimIds:[],purpose:"analysis"};
  const limitsSection:ArticleSectionDraft={key:"limits",heading:contract.angleKey==="uncertainty"?"What we still don't know":"What would change the picture",body:sentence(uncertainty),claimIds:counter.map(f=>f.id),purpose:"watch"};
  const methodSection:ArticleSectionDraft={key:"method",heading:"How Briefs reached this",body:method,claimIds:[],purpose:"method"};
  let sections:ArticleSectionDraft[];
  if(contract.angleKey==="uncertainty")sections=[answer,limitsSection,evidenceSection,meaningSection,methodSection];
  else if(contract.angleKey==="connection")sections=[answer,evidenceSection,meaningSection,limitsSection,methodSection];
  else if(contract.angleKey==="strongest-fact")sections=[answer,meaningSection,evidenceSection,limitsSection,methodSection];
  else if(contract.angleKey==="consequence")sections=[answer,meaningSection,evidenceSection,limitsSection,methodSection];
  else sections=[answer,evidenceSection,meaningSection,limitsSection,methodSection];
  const deck=sentence(contract.thesis).slice(0,280);
  return {title:contract.angle,deck,category,audience,articleType:articleType(graph),sections,claimIds:[...new Set(sections.flatMap(section=>section.claimIds))],generatedBy:"briefs-deterministic"};
}

function validExternalDraft(value:unknown):value is ArticleDraft{if(!value||typeof value!=="object")return false;const d=value as Partial<ArticleDraft>;return typeof d.title==="string"&&typeof d.deck==="string"&&Array.isArray(d.sections)&&d.sections.every(s=>s&&typeof s.heading==="string"&&typeof s.body==="string"&&Array.isArray(s.claimIds));}

export async function composePublicationArticle(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):Promise<ArticleDraft>{
  const url=process.env.PUBLICATION_WRITER_URL;
  if(url){
    try{
      const allowed=new Set(graph.findings.map(f=>f.id));const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...(process.env.PUBLICATION_WRITER_TOKEN?{authorization:`Bearer ${process.env.PUBLICATION_WRITER_TOKEN}`}:{})},body:JSON.stringify({task:"briefs-publication-draft-v2",subject:graph.canonicalSubject,intent:graph.plan.intent,freshness:graph.plan.freshness,reader:readerContract(audience),story:contract,claims:graph.findings.map(f=>({id:f.id,subject:f.subject,predicate:f.predicate,value:f.valueText,confidence:f.confidence,verificationStatus:f.verificationStatus})),constraints:{doNotInventFacts:true,eachFactualSectionMustListClaimIds:true,claimIdsMustComeFromInput:true,doNotQuoteOrImitateSourceWording:true,avoidGenericAIStockPhrases:true,distinguishFactFromInference:true,writeToReaderGoal:true}}),signal:AbortSignal.timeout(12_000)});
      if(response.ok){const candidate=await response.json();if(validExternalDraft(candidate)&&candidate.sections.every(s=>s.claimIds.every(id=>allowed.has(id))))return {...candidate,audience,category,generatedBy:"configured-writer"};}
    }catch{/* safe deterministic fallback */}
  }
  return deterministicDraft(graph,audience,category,contract);
}

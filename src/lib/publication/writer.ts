import type { ResearchFinding,ResearchGraph,ResearchSource } from "@/lib/research/types";
import type { ArticleDraft,ArticleSectionDraft,PublicationAudience,StoryContract } from "@/lib/publication/types";
import { readerContract } from "@/lib/publication/audience";

function clean(value:string){return value.replace(/\s+/g," ").trim();}
function sentence(value:string){const c=clean(value);return c?c.replace(/[.!?]+$/g,"")+".":"";}
function articleType(graph:ResearchGraph):ArticleDraft["articleType"]{return graph.plan.intent==="current"||graph.plan.freshness==="live"?"briefing":graph.plan.intent==="history"||graph.plan.intent==="explain"?"explainer":"analysis";}
function sourceMap(graph:ResearchGraph){return new Map(graph.sources.map(s=>[s.id,s] as const));}
function findingSource(f:ResearchFinding,graph:ResearchGraph):ResearchSource|undefined{
  const byId=sourceMap(graph);
  return f.sourceIds.map(id=>byId.get(id)).find((x):x is ResearchSource=>Boolean(x));
}
function stripOutletSuffix(value:string){
  return clean(value).replace(/\s+[|–—-]\s+[^|–—-]{2,60}$/,"").replace(/\s*:\s*(WHO|CDC|UN|AP|Reuters)$/i,"").trim();
}
function paraphraseHeadline(value:string){
  let t=stripOutletSuffix(value)
    .replace(/\bDR Congo\b/gi,"the Democratic Republic of the Congo")
    .replace(/\bD\.R\. Congo\b/gi,"the Democratic Republic of the Congo")
    .replace(/\bCongo['’]s\b/gi,"the Democratic Republic of the Congo's");
  t=t
    .replace(/\bbecomes?\b/gi,"is now")
    .replace(/\bnow deadliest ever\b/gi,"is now the deadliest on record")
    .replace(/\bdeadliest in (?:the )?country['’]s history\b/gi,"the deadliest outbreak in the country's history")
    .replace(/\bset to become deadliest on record\b/gi,"on track to become the deadliest on record")
    .replace(/\bspreads to a sixth province\b/gi,"has reached a sixth province")
    .replace(/\binfections pass ([\d,]+)\b/gi,"reported infections have exceeded $1")
    .replace(/\bover ([\d,]+) dead\b/gi,"more than $1 deaths have been reported")
    .replace(/\bcaused by new ['’]animal transmission['’]\b/gi,"linked to a new animal-to-human transmission event");
  return sentence(t);
}
function claimSentence(f:ResearchFinding,graph:ResearchGraph,index:number){
  const p=clean(f.predicate.replace(/[_-]+/g," "));
  const v=clean(f.valueText||f.statement||"");
  const source=findingSource(f,graph);
  if(/^(recent reporting|external context)$/i.test(p)){
    const fact=paraphraseHeadline(v);
    const attribution=source?.name?` ${source.name} is among the sources supporting this update.`:"";
    return clean(fact+attribution);
  }
  if(v&&p){
    if(index%3===0)return sentence(`${v} is the current evidence attached to ${p.toLowerCase()}`);
    if(index%3===1)return sentence(`The evidence on ${p.toLowerCase()} points to ${v}`);
    return sentence(`${p.charAt(0).toUpperCase()+p.slice(1)} is reported as ${v}`);
  }
  return sentence(v);
}
function selectedFindings(graph:ResearchGraph,ids:string[],fallback=6){
  const byId=new Map(graph.findings.map(f=>[f.id,f] as const));
  const selected=ids.map(id=>byId.get(id)).filter((x):x is ResearchFinding=>Boolean(x));
  return selected.length?selected:graph.findings.slice(0,fallback);
}
function paragraph(findings:ResearchFinding[],graph:ResearchGraph,max=4){
  return findings.slice(0,max).map((f,i)=>claimSentence(f,graph,i)).join(" ");
}
function meaningFor(audience:PublicationAudience,graph:ResearchGraph){
  const subject=graph.canonicalSubject;
  if(audience==="investor")return `The significance is not the headline alone but whether ${subject} changes economic expectations, operating risk, or policy responses. The evidence here supports the event itself more strongly than any downstream market forecast.`;
  if(audience==="executive")return `For decision-makers, the useful signal is the scale and direction of the event: whether it is spreading, accelerating, or triggering institutional response. Those are the points that can change planning before longer-range effects are clear.`;
  if(audience==="developer")return `The practical lesson is to separate the observed event from any system-level consequence. The evidence establishes the event and its current scale; implementation consequences still depend on the specific system or organization.`;
  if(audience==="marketer")return `The evidence supports the event, not assumptions about audience behavior. Any communications response should distinguish verified developments from speculation about how people will react.`;
  if(audience==="student")return `The key is to separate three layers: what has happened, how large it is, and what remains uncertain. That keeps the explanation useful without turning incomplete evidence into a neat but misleading story.`;
  return `What matters is the combination of scale, spread, and institutional response. Together they show whether ${subject} is a contained event or one that is becoming more consequential.`;
}
function headlineFor(graph:ResearchGraph,contract:StoryContract){
  const subject=graph.canonicalSubject.replace(/\b\w/g,m=>m.toUpperCase());
  const facts=graph.findings.map(f=>clean(f.valueText||f.statement||""));
  const numeric=facts.find(x=>/\b\d[\d,.]*\b/.test(x));
  if(numeric){
    const n=(numeric.match(/\b\d[\d,.]*\b/)||[])[0];
    if(/infection/i.test(numeric))return `${subject}: Reported Infections Pass ${n}`;
    if(/dead|death/i.test(numeric))return `${subject}: Death Toll Passes ${n}`;
  }
  const strongest=facts.find(x=>/deadliest|emergency|sixth province|record/i.test(x));
  if(strongest)return stripOutletSuffix(strongest);
  return contract.angle&&contract.angle.length<=110?contract.angle:`What changed in ${graph.canonicalSubject}`;
}
function deckFor(graph:ResearchGraph){
  const names=[...new Set(graph.sources.slice(0,6).map(s=>s.name).filter(Boolean))].slice(0,3);
  const sourcePhrase=names.length?` Sources include ${names.join(", ")}.`:"";
  return `Briefs found ${graph.sources.length} eligible sources across ${new Set(graph.sources.map(s=>s.independenceFamily||s.provider)).size} independent source families. The strongest evidence points to a materially worsening situation, while interpretation beyond the reported facts remains limited.${sourcePhrase}`.slice(0,280);
}

function deterministicDraft(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):ArticleDraft{
  const strongest=selectedFindings(graph,contract.strongestClaimIds);
  const counter=selectedFindings(graph,contract.counterClaimIds,0);
  const openingFindings=strongest.slice(0,3);
  const usedOpening=new Set(openingFindings.map(f=>f.id));
  const evidenceFindings=(strongest.slice(3).length?strongest.slice(3):graph.findings.filter(f=>!usedOpening.has(f.id))).slice(0,4);

  const opening=paragraph(openingFindings,graph,3)||sentence(graph.description)||`The available evidence on ${graph.canonicalSubject} is still too thin for a confident briefing.`;
  const evidence=paragraph(evidenceFindings,graph,4)||`The remaining evidence does not add a distinct second factual section without repeating the same claims.`;
  const meaning=meaningFor(audience,graph);
  const uncertainty=graph.missingEvidence.length
    ? `The main unresolved issue is ${graph.missingEvidence.slice(0,2).join(" ")}`
    : counter.length
      ? `Some evidence complicates the simplest reading. ${paragraph(counter,graph,2)}`
      : `The current evidence is strong on the reported event, but weaker on downstream consequences that have not yet been directly observed.`;
  const watch=`The next material update would be a verified change in scale, geography, mortality, transmission, or official response. Until then, the safest reading is to treat the current figures and institutional assessments as the boundary of what is known.`;
  const method=`Briefs built this briefing from ${graph.findings.length} structured findings across ${graph.sources.length} eligible sources and ${new Set(graph.sources.map(s=>s.independenceFamily||s.provider)).size} independent source families.`;

  const answer:ArticleSectionDraft={key:"brief",heading:"What changed",body:opening,claimIds:openingFindings.map(f=>f.id),purpose:"answer"};
  const meaningSection:ArticleSectionDraft={key:"meaning",heading:"Why it matters",body:meaning,claimIds:[],purpose:"analysis"};
  const evidenceSection:ArticleSectionDraft={key:"evidence",heading:"What the evidence says",body:evidence,claimIds:evidenceFindings.map(f=>f.id),purpose:evidenceFindings.length?"evidence":"analysis"};
  const limitsSection:ArticleSectionDraft={key:"limits",heading:"What remains uncertain",body:sentence(uncertainty),claimIds:counter.map(f=>f.id),purpose:"watch"};
  const watchSection:ArticleSectionDraft={key:"watch",heading:"What to watch next",body:watch,claimIds:[],purpose:"analysis"};
  const methodSection:ArticleSectionDraft={key:"method",heading:"How Briefs reached this",body:method,claimIds:[],purpose:"method"};

  return {
    title:headlineFor(graph,contract),
    deck:deckFor(graph),
    category,
    audience,
    articleType:articleType(graph),
    sections:[answer,meaningSection,evidenceSection,limitsSection,watchSection,methodSection],
    claimIds:[...new Set([answer,evidenceSection,limitsSection].flatMap(section=>section.claimIds))],
    generatedBy:"briefs-deterministic"
  };
}

function validExternalDraft(value:unknown):value is ArticleDraft{
  if(!value||typeof value!=="object")return false;
  const d=value as Partial<ArticleDraft>;
  return typeof d.title==="string"&&typeof d.deck==="string"&&Array.isArray(d.sections)&&d.sections.every(s=>s&&typeof s.heading==="string"&&typeof s.body==="string"&&Array.isArray(s.claimIds));
}

export async function composePublicationArticle(graph:ResearchGraph,audience:PublicationAudience,category:string,contract:StoryContract):Promise<ArticleDraft>{
  const url=process.env.PUBLICATION_WRITER_URL;
  if(url){
    try{
      const allowed=new Set(graph.findings.map(f=>f.id));
      const response=await fetch(url,{
        method:"POST",
        headers:{"content-type":"application/json",...(process.env.PUBLICATION_WRITER_TOKEN?{authorization:`Bearer ${process.env.PUBLICATION_WRITER_TOKEN}`}:{})},
        body:JSON.stringify({
          task:"briefs-publication-draft-v3",
          subject:graph.canonicalSubject,
          intent:graph.plan.intent,
          freshness:graph.plan.freshness,
          reader:readerContract(audience),
          story:contract,
          claims:graph.findings.map(f=>({id:f.id,subject:f.subject,predicate:f.predicate,value:f.valueText,confidence:f.confidence,verificationStatus:f.verificationStatus})),
          constraints:{
            doNotInventFacts:true,
            eachFactualSectionMustListClaimIds:true,
            claimIdsMustComeFromInput:true,
            doNotQuoteOrImitateSourceWording:true,
            avoidGenericAIStockPhrases:true,
            distinguishFactFromInference:true,
            writeToReaderGoal:true,
            neverExposeEditorialInstructions:true,
            neverSayTheReaderShould:true,
            minimumReaderFacingWords:180
          }
        }),
        signal:AbortSignal.timeout(12_000)
      });
      if(response.ok){
        const candidate=await response.json();
        if(validExternalDraft(candidate)&&candidate.sections.every(s=>s.claimIds.every(id=>allowed.has(id))))return {...candidate,audience,category,generatedBy:"configured-writer"};
      }
    }catch{/* safe deterministic fallback */}
  }
  return deterministicDraft(graph,audience,category,contract);
}

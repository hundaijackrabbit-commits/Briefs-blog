import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/prose-integrity.ts")).href);
const {evaluateReaderFacingProseIntegrity}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const badDraft={
  title:"Why 6.7-Magnitude Earthquake Shakes Peru matters now",
  deck:"Briefs found 3 eligible sources across 3 independent source families. The evidence is coherent on what changed in 6.7-Magnitude Earthquake Shakes Peru, while downstream consequences remain less certain than the event itself.",
  sections:[
    {key:"brief",heading:"What changed",body:"The New York Times provides an independent account represented in the aligned evidence set. DW.com provides a separate account with context around strong, southern, andes.",claimIds:["a","b"],purpose:"answer"},
    {key:"meaning",heading:"Why it matters",body:"The useful distinction is between the observed event, the evidence explaining it, and consequences that remain uncertain. For 6.7-Magnitude Earthquake Shakes Peru, those layers should stay separate until additional measurements or authoritative assessments narrow the uncertainty. That distinction matters because the observed event and its downstream consequences are different questions; confidence in one does not automatically establish the other. The useful next step is to keep verified developments separate from projections until additional evidence changes the picture. That boundary is part of the answer, not a gap to fill with speculation.",claimIds:[],purpose:"analysis"},
    {key:"evidence",heading:"What the evidence says",body:"AP News adds quantified context to 6.7-Magnitude Earthquake Shakes Peru: the report includes 6.7 and centers on southern, andes, immediate.",claimIds:["c"],purpose:"evidence"},
    {key:"limits",heading:"What remains uncertain",body:"The current evidence is strong on the reported event, but weaker on downstream consequences that have not yet been directly observed.",claimIds:[],purpose:"watch"},
    {key:"method",heading:"How Briefs reached this",body:"Briefs built this briefing from 3 structured findings across 3 eligible sources and 3 independent source families.",claimIds:[],purpose:"method"}
  ]
};
const graph={canonicalSubject:"6.7-Magnitude Earthquake Shakes Peru"};

const bad=evaluateReaderFacingProseIntegrity(badDraft,graph);
assert(bad.issues.length>=4,"actual Peru-style draft is rejected",JSON.stringify(bad.issues));
assert(bad.issues.some(x=>/scaffolding/i.test(x)),"source-process prose is a blocker");
assert(bad.issues.some(x=>/methodology-first deck/i.test(x)),"methodology-first deck is a blocker");
assert(bad.issues.some(x=>/event itself/i.test(x)),"opening must state the event");
assert(bad.issues.some(x=>/keyword\/list residue/i.test(x)),"extraction residue is a blocker");
assert(bad.issues.some(x=>/generic length padding/i.test(x)),"multiple stock bridge sentences are a blocker");
assert(bad.openingAnchorHits===0,"bad opening contains no canonical event anchors",String(bad.openingAnchorHits));

const goodDraft={
  title:"Peru's 6.7-Magnitude Earthquake: What We Know",
  deck:"A magnitude 6.7 earthquake struck Peru's southern Andes; early reports were still assessing its immediate effects.",
  sections:[
    {key:"brief",heading:"What changed",body:"A magnitude 6.7 earthquake shook southern Peru, with reporting centered on the Andes region.",claimIds:["a"],purpose:"answer"},
    {key:"meaning",heading:"Why it matters",body:"The quake is significant because its strength warrants close attention to verified damage assessments and official response as those become available.",claimIds:[],purpose:"analysis"},
    {key:"evidence",heading:"What the evidence says",body:"AP, DW and The New York Times independently reported the earthquake and its location in southern Peru.",claimIds:["a","b"],purpose:"evidence"},
    {key:"limits",heading:"What remains uncertain",body:"The immediate extent of damage and disruption was not yet established in the evidence available to this briefing.",claimIds:[],purpose:"watch"},
    {key:"method",heading:"How Briefs reached this",body:"Method transparency belongs here, not in the reader-facing answer.",claimIds:[],purpose:"method"}
  ]
};
const good=evaluateReaderFacingProseIntegrity(goodDraft,graph);
assert(good.issues.length===0,"clean reader-facing fixture passes integrity gate",JSON.stringify(good.issues));
assert(good.openingAnchorHits>=2,"clean opening states the event",String(good.openingAnchorHits));

const attributed={...goodDraft,sections:goodDraft.sections.map(s=>s.key==="evidence"?{...s,body:"AP reports the magnitude and location, while DW independently reports the same earthquake in southern Peru."}:s)};
const attributedResult=evaluateReaderFacingProseIntegrity(attributed,graph);
assert(attributedResult.issues.length===0,"normal source attribution is not falsely blocked",JSON.stringify(attributedResult.issues));

if(process.exitCode)throw new Error("Reader-facing prose integrity regression failed");
console.log("Reader-facing prose integrity regression suite passed.");

import path from "node:path";
import { pathToFileURL } from "node:url";

const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/writer-synthesis.ts")).href);
const event=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/event-identity.ts")).href);
const {detectWritingDomain,domainDeckClause,domainMeaning,domainWatch,longestSharedRun,synthesizeReportingFinding}=mod;
const {buildEventAnchor,eventAlignmentComponents}=event;
function assert(ok,label){console.log(ok?"PASS":"FAIL",label);if(!ok)process.exitCode=1;}

const subject="Global Government Bond Yields Hit Multiyear Highs";
const headlines=[
  "US chip stocks slide as government borrowing costs hit multiyear highs",
  "The 30-year Treasury yield just hit a 19-year high. Three things could drive it even higher",
  "Bond Sell-Off Sends Borrowing Costs to Highest Level Since 2007",
  "US 30-year yields hit highest level since 2007 as war, oil worries fester",
  "Governments’ borrowing costs hit further multi-decade highs as US-Iran peace hopes fade"
];
const all=headlines.join(" ");
const domain=detectWritingDomain("Markets",subject,all);
assert(domain==="markets","bond-yield event selects markets writing domain");
for(let i=0;i<headlines.length;i++){
  const out=synthesizeReportingFinding(headlines[i],subject,["FT","CNBC","NYT","Reuters","Guardian"][i],domain,i);
  assert(longestSharedRun(out,headlines[i])<10,`source ${i+1} is synthesized rather than headline-copied`);
}
const meaning=domainMeaning(domain,subject),watch=domainWatch(domain,subject,all),deck=domainDeckClause(domain,subject,all);
assert(!/mortality|transmission|outbreak/i.test(`${meaning} ${watch} ${deck}`),"markets prose contains no health-domain residue");
assert(/yield|borrowing|market/i.test(`${meaning} ${watch} ${deck}`),"markets prose is domain-aware");

const anchor=buildEventAnchor(subject,[subject,...headlines],"2026-08-18T19:45:00.000Z");
assert(anchor.geographyTerms.length===0,"supporting-title geography does not redefine global subject geography");
assert(anchor.actionTerms.includes("move"),"market movement verb becomes an event action");
const noAction=buildEventAnchor("Chile Earthquake Damage Assessment",["Chile Earthquake Damage Assessment"],null);
const noActionScore=eventAlignmentComponents(noAction,"Chile earthquake damage assessment");
assert(noAction.actionTerms.length===0&&noActionScore.action===0,"missing action dimension is neutral, not reported as 100");

if(process.exitCode)throw new Error("Writer/calibration regression failed");
console.log("Deterministic synthesis and alignment calibration regression passed.");

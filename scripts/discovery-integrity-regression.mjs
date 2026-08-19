import path from "node:path";import { pathToFileURL } from "node:url";
const root=process.cwd();
const event=await import(pathToFileURL(path.join(root,"src/lib/publication/event-identity.ts")).href);
const integrity=await import(pathToFileURL(path.join(root,"src/lib/publication/candidate-integrity.ts")).href);
const {buildEventAnchor,clusterCoherenceScore}=event;
const {evaluateCandidateIntegrity}=integrity;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const droneSubject="The Missing Piece of America’s Drone Supply Chain";
const droneTitles=[
  "Trump Announces Drone Tariffs to Bolster U.S. Supply Chains and Counter China",
  "Humanoid Robots Need a Supply Chain in North America",
  "China trade relationship dealt another setback"
];
const droneAnchor=buildEventAnchor(droneSubject,[droneSubject,...droneTitles],"2026-08-18T20:10:57.000Z");
const drone=evaluateCandidateIntegrity({eventAnchor:droneAnchor,titles:droneTitles,clusterCoherence:clusterCoherenceScore(droneAnchor,droneTitles)});
assert(drone.highSignalTerms.includes("drone"),"drone remains the high-signal anchor",JSON.stringify(drone.highSignalTerms));
assert(!drone.highSignalTerms.includes("supply")&&!drone.highSignalTerms.includes("chain"),"generic supply-chain terms are downweighted");
assert(drone.highSignalSupport<2,"generic supply-chain article cannot corroborate drone event",`(${drone.highSignalSupport})`);
assert(drone.candidateIntegrityPassed===false,"drone editorial-framing collage is rejected upstream",`score=${drone.candidateIntegrityScore}`);

const bondSubject="Global Government Bond Yields Hit Multiyear Highs";
const bondTitles=[
  "Global Government Bond Yields Hit Multiyear Highs",
  "The 30-year Treasury yield just hit a 19-year high",
  "Bond sell-off sends borrowing costs to highest level since 2007",
  "US 30-year yields hit highest level since 2007"
];
const bondAnchor=buildEventAnchor(bondSubject,bondTitles,"2026-08-18T19:45:00.000Z");
const bond=evaluateCandidateIntegrity({eventAnchor:bondAnchor,titles:bondTitles,clusterCoherence:clusterCoherenceScore(bondAnchor,bondTitles)});
assert(bond.highSignalSupport>=2,"coherent bond story has multi-title high-signal support",`(${bond.highSignalSupport})`);
assert(bond.candidateIntegrityPassed===true,"coherent concrete bond event survives upstream gate",`score=${bond.candidateIntegrityScore}`);

const ceasefireSubject="Israel and Iran Sign Ceasefire Agreement";
const ceasefireTitles=[
  "Israel and Iran sign ceasefire agreement",
  "Israel Iran ceasefire agreement signed",
  "Ceasefire agreement signed by Israel and Iran"
];
const ceaseAnchor=buildEventAnchor(ceasefireSubject,ceasefireTitles,"2026-08-18T22:00:00.000Z");
const cease=evaluateCandidateIntegrity({eventAnchor:ceaseAnchor,titles:ceasefireTitles,clusterCoherence:clusterCoherenceScore(ceaseAnchor,ceasefireTitles)});
assert(cease.candidateIntegrityPassed===true,"action-led event can pass even with geography-heavy subject",`score=${cease.candidateIntegrityScore}`);

if(process.exitCode)throw new Error("Discovery-integrity regression failed");
console.log("Discovery Candidate Integrity regression suite passed.");

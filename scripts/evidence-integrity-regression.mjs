import fs from "node:fs";import path from "node:path";import { pathToFileURL } from "node:url";
const root=process.cwd();const event=await import(pathToFileURL(path.join(root,"src/lib/publication/event-identity.ts")).href);
const {buildEventAnchor,clusterCoherenceScore,eventhoodScore,pairwiseClusterCoherence}=event;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}
const badSubject="The Missing Piece of America’s Drone Supply Chain";
const badTitles=["Trump announces new tariffs on imported industrial goods","Humanoid Robots Need a Supply Chain in North America","China trade relationship dealt another setback"];
const badAnchor=buildEventAnchor(badSubject,[badSubject,...badTitles],"2026-08-19T00:00:00.000Z");
const badPair=pairwiseClusterCoherence(badTitles),badCluster=clusterCoherenceScore(badAnchor,badTitles),badEventhood=eventhoodScore(badAnchor,badTitles);
assert(badPair<45,"unrelated business headlines have low pairwise coherence",`(${badPair})`);
assert(badCluster<52,"editorial-framing drone near-miss fails cluster coherence",`(${badCluster})`);
assert(badEventhood<45,"editorial framing fails eventhood without corroborated concrete change",`(${badEventhood})`);

const goodSubject="Global Government Bond Yields Hit Multiyear Highs";
const goodTitles=["Global Government Bond Yields Hit Multiyear Highs","The 30-year Treasury yield just hit a 19-year high","Bond sell-off sends borrowing costs to highest level since 2007","US 30-year yields hit highest level since 2007"];
const goodAnchor=buildEventAnchor(goodSubject,goodTitles,"2026-08-18T19:45:00.000Z");
const goodCluster=clusterCoherenceScore(goodAnchor,goodTitles),goodEventhood=eventhoodScore(goodAnchor,goodTitles);
assert(goodCluster>=52,"coherent bond-yield event still clears cluster gate",`(${goodCluster})`);
assert(goodEventhood>=45,"concrete bond-yield move clears eventhood gate",`(${goodEventhood})`);

const subjectSource=fs.readFileSync(path.join(root,"src/lib/publication/subject-alignment.ts"),"utf8");
assert(!subjectSource.includes("`${f.subject} ${f.predicate}"),"assigned subject is absent from source evidence text");
const quality=fs.readFileSync(path.join(root,"src/lib/publication/quality.ts"),"utf8");
assert(quality.includes("Evidence-depth gate requires the evidence section to cite at least one grounded claim."),"zero-claim evidence section is explicitly blocked");
assert(quality.includes("Evidence-depth gate rejected an empty-evidence placeholder."),"empty evidence placeholder is explicitly blocked");
if(process.exitCode)throw new Error("Evidence-integrity regression failed");console.log("Evidence-integrity near-miss regression suite passed.");

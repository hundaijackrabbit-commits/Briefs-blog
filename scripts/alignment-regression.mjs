import path from "node:path";
import { pathToFileURL } from "node:url";
const moduleUrl=pathToFileURL(path.join(process.cwd(),"src/lib/publication/event-identity.ts")).href;
const {buildEventAnchor,titleEventAlignment,anchorPreservingQuery,clusterCoherenceScore}=await import(moduleUrl);

function assert(ok,label){console.log(ok?"PASS":"FAIL",label);if(!ok)process.exitCode=1;}
const anchor=buildEventAnchor("Middle East Banks Grow African Presence",[
  "Middle East Banks Grow African Presence",
  "Gulf banks expand their footprint across African markets"
],new Date().toISOString());

const exact=titleEventAlignment(anchor,"Middle East banks grow African presence");
const related=titleEventAlignment(anchor,"Gulf banks expand their footprint across African markets");
const trafficking=titleEventAlignment(anchor,"Meth trafficking across Middle East becoming more advanced, UNODC warns");
const military=titleEventAlignment(anchor,"Top US Middle East commander visits long-deployed aircraft carrier");
const query=anchorPreservingQuery("middle east",anchor);
const goodCluster=clusterCoherenceScore(anchor,[
  "Middle East banks grow African presence",
  "Gulf banks expand their footprint across African markets"
]);
const mixedCluster=clusterCoherenceScore(anchor,[
  "Middle East banks grow African presence",
  "Meth trafficking across Middle East becoming more advanced, UNODC warns",
  "Top US Middle East commander visits long-deployed aircraft carrier"
]);

assert(exact>=90,"exact same event scores very high");
assert(related>=70,"paraphrased same event remains aligned");
assert(trafficking<45,"same geography / wrong event is rejected");
assert(military<45,"same geography / wrong military event is rejected");
assert(query!=="middle east"&&query.includes("bank")&&query.includes("expand"),"broad query is repaired with distinctive event terms");
assert(goodCluster>=75,"coherent event cluster passes");
assert(mixedCluster<=55&&goodCluster-mixedCluster>=25,"mixed regional cluster loses coherence");
if(process.exitCode)throw new Error("Alignment regression suite failed");
console.log("Near-miss alignment regression suite passed.");

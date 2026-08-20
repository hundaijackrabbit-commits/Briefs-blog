import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/grounded-depth.ts")).href);
const {augmentGroundedDepth}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const filler=n=>Array.from({length:n},(_,i)=>`w${i}`).join(" ");
const result=augmentGroundedDepth({
  answerBody:filler(20),
  evidenceBody:filler(11),
  answerClaimIds:["a"],
  evidenceClaimIds:["b"],
  otherNarrativeText:filler(109),
  candidates:[
    {id:"c",sentence:filler(15)},
    {id:"d",sentence:filler(15)},
    {id:"e",sentence:filler(15)},
    {id:"f",sentence:filler(15)}
  ],
  targetNarrativeWords:180,
  targetEvidenceWords:24
});
assert(result.narrativeWords>=180,"140-word deterministic fixture reaches grounded 180-word target",String(result.narrativeWords));
assert(result.evidenceWords>=24,"11-word evidence fixture reaches grounded evidence target",String(result.evidenceWords));
assert(new Set([...result.answerClaimIds,...result.evidenceClaimIds]).size===result.answerClaimIds.length+result.evidenceClaimIds.length,"claim IDs remain unique across factual sections");

const duplicate=augmentGroundedDepth({
  answerBody:filler(20),evidenceBody:filler(11),answerClaimIds:["a"],evidenceClaimIds:["b"],
  otherNarrativeText:filler(109),
  candidates:[{id:"a",sentence:filler(50)},{id:"b",sentence:filler(50)}],
  targetNarrativeWords:180,targetEvidenceWords:24
});
assert(duplicate.narrativeWords===140,"already-used claims are not repeated merely to pass depth gates",String(duplicate.narrativeWords));
assert(duplicate.evidenceWords===11,"writer leaves article blocked when no new grounded evidence exists",String(duplicate.evidenceWords));

if(process.exitCode)throw new Error("Grounded narrative-depth regression failed");
console.log("Grounded narrative-depth regression suite passed.");

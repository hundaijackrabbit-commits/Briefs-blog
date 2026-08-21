import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/interpretive-depth.ts")).href);
const {augmentInterpretiveDepth}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const thin=augmentInterpretiveDepth({body:"Why it matters.",currentNarrativeWords:137,targetNarrativeWords:180});
assert(thin.narrativeWords>=180,"137-word fixture clears 180-word writer target",String(thin.narrativeWords));
assert(thin.added.length>0,"thin draft receives bounded connective prose",String(thin.added.length));
assert(!/the reader should/i.test(thin.body),"connective prose exposes no reader-instruction meta-language");
assert(!/\bdefinitely\b|\bcertainly\b|\bproves?\b/i.test(thin.body),"connective prose makes no certainty claims");

const ready=augmentInterpretiveDepth({body:"Already sufficient.",currentNarrativeWords:185,targetNarrativeWords:180});
assert(ready.narrativeWords===185,"already-ready draft is unchanged",String(ready.narrativeWords));
assert(ready.added.length===0,"no prose is added when target is already met",String(ready.added.length));

const bounded=augmentInterpretiveDepth({body:"x",currentNarrativeWords:0,targetNarrativeWords:500});
assert(bounded.added.length<=3,"repair remains bounded to fixed bridge set",String(bounded.added.length));

if(process.exitCode)throw new Error("Bounded interpretive-depth regression failed");
console.log("Bounded interpretive-depth regression suite passed.");

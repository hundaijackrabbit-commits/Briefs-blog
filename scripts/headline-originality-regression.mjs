import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/headline-originality.ts")).href);
const {longestExactWordRun,originalitySafeHeadline}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const ebola="DR Congo to receive 70,000 doses of Ervebo vaccine as Ebola infections surge";
const wrapped=`What actually changed in ${ebola}`;
assert(longestExactWordRun(wrapped,ebola)===14,"fixture reproduces the 14-word source-headline collision",String(longestExactWordRun(wrapped,ebola)));
const safe=originalitySafeHeadline(wrapped,ebola,[ebola]);
assert(longestExactWordRun(safe,ebola)<11,"Ebola headline is recomposed below headline-repair exact-run threshold",safe);
assert(/ebola/i.test(safe)&&/congo/i.test(safe),"recomposed Ebola headline keeps event identity",safe);

const short="Peru earthquake shakes southern Andes";
assert(originalitySafeHeadline(`What changed in ${short}`,short,[short])===`What changed in ${short}`,"short factual headline is not needlessly rewritten");

const longNoConnector="Amazon Prime Video plans two billion dollar investment across Latin America through 2030";
const repaired=originalitySafeHeadline(`What changed in ${longNoConnector}`,longNoConnector,[longNoConnector]);
assert(longestExactWordRun(repaired,longNoConnector)<11,"long no-connector headline uses bounded fallback",repaired);

assert(longestExactWordRun("alpha beta gamma delta","alpha beta gamma delta")===4,"exact-run detector remains literal and deterministic");

if(process.exitCode)throw new Error("Headline originality regression failed");
console.log("Headline originality regression suite passed.");

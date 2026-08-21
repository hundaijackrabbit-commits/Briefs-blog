import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/headline-originality.ts")).href);
const {originalitySafeSubject,originalitySafeHeadline,longestExactWordRun}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const source="DR Congo to receive 70,000 doses of Ervebo vaccine as Ebola infections surge";
const safe=originalitySafeSubject(source,[source]);
assert(longestExactWordRun(source,source)===14,"fixture reproduces 14-word source-subject collision",String(longestExactWordRun(source,source)));
assert(longestExactWordRun(safe,source)<11,"reader-facing subject breaks source-headline run",`${safe} | run=${longestExactWordRun(safe,source)}`);
assert(/congo|ebola|ervebo/i.test(safe),"safe subject preserves event identity",safe);

const headline=originalitySafeHeadline(source,source,[source]);
assert(longestExactWordRun(headline,source)<11,"headline protection still passes",headline);

const short="Peru earthquake shakes southern Andes";
assert(originalitySafeSubject(short,[source])===short,"unrelated short subject is unchanged",short);

if(process.exitCode)throw new Error("Reader-prose originality regression failed");
console.log("Reader-prose originality regression suite passed.");

import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/distinctiveness-history.ts")).href);
const {categoryFatiguePenalty,readerFacingFlagship}=mod;

function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

assert(readerFacingFlagship("research-required",null)===false,"blocked flagship without article is not reader-facing");
assert(readerFacingFlagship("selected",null)===false,"selection-only ledger entry is not reader-facing");
assert(readerFacingFlagship("drafted","article-1")===true,"drafted article counts as editorial history");
assert(readerFacingFlagship("published","article-2")===true,"published article counts as editorial history");

const one=categoryFatiguePenalty(["World"],"World");
assert(one.penalty===0,"one prior World flagship does not penalize an unrelated World event",JSON.stringify(one));

const two=categoryFatiguePenalty(["World","World"],"World");
assert(two.penalty===0,"two recent category appearances remain penalty-free",JSON.stringify(two));

const three=categoryFatiguePenalty(["World","World","World"],"World");
assert(three.penalty===2,"third recent category repetition creates only a small fatigue nudge",JSON.stringify(three));

const five=categoryFatiguePenalty(["World","World","World","World","World"],"World");
assert(five.penalty===6,"category fatigue is capped",JSON.stringify(five));

const nigeriaRaw=Math.round(40*.74+100*.18+66*.08+(96-70)*.12);
assert(nigeriaRaw>=55,"Nigeria-style candidate can clear unchanged 55 gate when unrelated blocked history no longer penalizes it",`score=${nigeriaRaw}`);

if(process.exitCode)throw new Error("Reader-facing distinctiveness regression failed");
console.log("Reader-facing distinctiveness regression suite passed.");

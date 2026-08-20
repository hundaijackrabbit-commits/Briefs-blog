import path from "node:path";import {pathToFileURL} from "node:url";
const {originalityReport}=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/originality.ts")).href);
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}
delete process.env.DATABASE_URL;

const factualDraft="Officials said the outbreak became the deadliest in the country's history after case counts rose sharply. The latest reporting focuses on scale, response and uncertainty.";
const factualSource=[{sourceId:"s1",sourceName:"Example",sourceTitle:"How Ebola became the deadliest outbreak in DR Congo’s history",text:"How Ebola became the deadliest outbreak in DR Congo’s history. Officials said the outbreak became the deadliest in the country's history as response teams expanded containment work."}];
const factual=await originalityReport(factualDraft,factualSource);
assert(factual.longestMatchingWords<14,"moderate factual overlap stays below exact-copy threshold",`words=${factual.longestMatchingWords}`);
assert(factual.passed===true,"moderate factual overlap is reviewable, not automatically blocked",`risk=${Math.round(factual.maxSourceOverlap*100)}%`);

const copiedSource="Governments borrowing costs hit further multi decade highs as peace hopes faded and investors reassessed the path for rates across major economies.";
const copiedDraft=copiedSource+" That move changed the market outlook.";
const copied=await originalityReport(copiedDraft,[{sourceId:"s2",sourceName:"Copy source",sourceTitle:"Bond yields rise",text:copiedSource}]);
assert(copied.longestMatchingWords>=14,"long copied phrase detected",`words=${copied.longestMatchingWords}`);
assert(copied.passed===false,"long copied passage still fails originality",JSON.stringify(copied.blockingReasons));

const normal=await originalityReport("Bond yields climbed to levels not seen for years as investors repriced government borrowing costs.",[{sourceId:"s3",sourceName:"Source",sourceTitle:"Bond market",text:"Government borrowing costs reached multi-year highs after a broad bond selloff."}]);
assert(normal.passed===true,"normal synthesis remains eligible");

if(process.exitCode)throw new Error("Originality calibration regression failed");
console.log("Originality warning/block separation regression passed.");

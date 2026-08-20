import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/alignment-repair-union.ts")).href);
const {mergeResearchGraphs,betterAlignment}=mod;

function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}
const now=new Date().toISOString();
const src=(id,family,title)=>({id,provider:"external",name:family,title,url:`https://${family}/${id}`,tier:"B",kind:"reporting",retrievedAt:now,publishedAt:now,excerpt:title,authority:82,independenceFamily:family});
const finding=(id,sourceId,text)=>({id,subject:"Peru earthquake",predicate:"Recent reporting",valueText:text,statement:text,sourceIds:[sourceId],confidence:"medium",verificationStatus:"reported"});
const graph=(id,sources,findings)=>({runId:id,plan:{original:"q",normalized:"q",intent:"current",subjects:["q"],freshness:"live",maxSources:10},canonicalSubject:"Peru earthquake",description:"",findings,sources,discoveredUrls:sources.map(s=>s.url),missingEvidence:[],confidence:"medium",sufficient:true,generatedAt:now,knowledgeCutoff:now,iterations:[],stopReason:"sufficient"});

const dw=src("dw","dw.com","Peru: Strong earthquake shakes southern Andes");
const ap=src("ap","apnews.com","Magnitude 6.7 earthquake shakes Peru southern Andes");
const reuters=src("reuters","reuters.com","Strong quake strikes southern Peru, no major damage reported");

const initial=graph("initial",[dw,ap],[finding("f-dw","dw",dw.title),finding("f-ap","ap",ap.title)]);
const repair=graph("repair",[ap,reuters],[finding("f-ap","ap",ap.title),finding("f-reuters","reuters",reuters.title)]);
const merged=mergeResearchGraphs([initial,repair],"Peru: Strong earthquake shakes southern Andes");

assert(merged.sources.length===3,"two bounded repair attempts union to three distinct sources",String(merged.sources.length));
assert(new Set(merged.sources.map(s=>s.independenceFamily)).size===3,"repair union preserves three independent families");
assert(merged.findings.length===3,"duplicate findings are deduped across repair attempts",String(merged.findings.length));

const fail2={version:"1.0",selectedSubject:"x",anchor:{version:"1.0",subject:"x",distinctiveTerms:[],actionTerms:[],topicTerms:[],geographyTerms:[],entityTerms:[],eventTime:null},queries:["a"],sourceScores:[],alignedSourceIds:["dw","ap"],rejectedSourceIds:[],staleSourceIds:[],alignedFamilies:2,score:90,entityCoverage:100,actionCoverage:100,temporalAlignment:100,coverageRatio:67,clusterCoherence:81,passed:false,repaired:false,reasons:["need 3"]};
const pass3={...fail2,queries:["a","b"],alignedSourceIds:["dw","ap","reuters"],alignedFamilies:3,score:84,coverageRatio:100,passed:true,repaired:true,reasons:[]};
const chosen=betterAlignment({graph:initial,alignment:fail2},{graph:merged,alignment:pass3});
assert(chosen.alignment.passed===true,"passing three-source repair union beats a higher-scoring two-source failure");
assert(chosen.alignment.score===84,"repair union does not require lowering alignment score thresholds",String(chosen.alignment.score));

if(process.exitCode)throw new Error("Alignment repair-union regression failed");
console.log("Alignment repair-union regression suite passed.");

import path from "node:path";import { pathToFileURL } from "node:url";
const root=process.cwd();
const mod=await import(pathToFileURL(path.join(root,"src/lib/publication/candidate-pool.ts")).href);
const {orderDiscoveryCandidates,rankingInput}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const weak=Array.from({length:70},(_,i)=>({
  subject:`single-domain-${i}`,
  domains:["one.example"],
  mentionCount:1,
  candidateIntegrityScore:95-i%4
}));
const viableProspect={
  subject:"multi-domain coherent event",
  domains:["one.example","two.example","three.example"],
  mentionCount:4,
  candidateIntegrityScore:67
};
const ordered=orderDiscoveryCandidates([...weak,viableProspect]);
assert(ordered[0].subject===viableProspect.subject,"multi-domain evidence prospect is not buried by integrity-only ordering");
const ranked=rankingInput(ordered);
assert(ranked.some(x=>x.subject===viableProspect.subject),"bounded ranking pool still includes viable multi-domain prospect");
assert(ranked.length===71,"ranking pool keeps all candidates when under 120",`(${ranked.length})`);

const many=Array.from({length:150},(_,i)=>({domains:["x"],mentionCount:1,candidateIntegrityScore:70,subject:String(i)}));
assert(rankingInput(many).length===120,"ranking remains bounded at 120 candidates");

if(process.exitCode)throw new Error("Candidate-pool regression failed");
console.log("Candidate Pool Ordering regression suite passed.");

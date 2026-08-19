import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const discovery=read("src/lib/publication/global-discovery.ts");
const distinct=read("src/lib/publication/distinctiveness.ts");
const editorial=read("src/lib/publication/global-editorial.ts");
const pool=read("src/lib/publication/candidate-pool.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [discovery.includes("orderDiscoveryCandidates")&&!discovery.includes("candidateIntegrityScore||0)-Number(a.candidateIntegrityScore"),"discovery no longer pre-ranks primarily by integrity"],
  [pool.includes("b.domains.length-a.domains.length")&&pool.includes("b.mentionCount-a.mentionCount"),"candidate pool prioritizes evidence-prospect signals before integrity tiebreak"],
  [distinct.includes("rankingInput(candidates)")&&!distinct.includes("candidates.slice(0,50).map"),"global ranking evaluates the full bounded discovery pool"],
  [pool.includes("limit=120"),"ranking pool remains bounded at 120 candidates"],
  [editorial.includes("[global-editorial] no viable candidates")&&editorial.includes("candidateIntegrityScore"),"zero-viable runs emit ranking diagnostics"],
  [editorial.includes("candidate.domains.length>=2&&candidate.evidenceBreadth>=42&&candidate.finalScore>=55"),"existing viability thresholds are preserved"],
  [systems.includes("Candidate Pool Ordering & Viability Diagnostics"),"systems ledger records the ordering repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Candidate-pool architecture check passed (${checks.length} checks).`);

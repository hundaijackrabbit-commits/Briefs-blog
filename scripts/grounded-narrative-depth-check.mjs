import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const quality=read("src/lib/publication/quality.ts");
const helper=read("src/lib/publication/grounded-depth.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [writer.includes('from "@/lib/publication/grounded-depth"'),"deterministic writer imports grounded-depth augmentation"],
  [writer.includes("augmentGroundedDepth({"),"deterministic fallback runs grounded depth augmentation"],
  [writer.includes("targetNarrativeWords:180"),"writer targets a safety margin above reader-ready minimum"],
  [writer.includes("targetEvidenceWords:24"),"writer targets a safety margin above evidence-depth minimum"],
  [helper.includes("used.has(candidate.id)"),"already-used claims are not duplicated for padding"],
  [quality.includes("if(nonMethodWords<160)"),"160-word reader-ready gate remains unchanged"],
  [quality.includes("if(evidenceWords<12)"),"12-word evidence-depth gate remains unchanged"],
  [systems.includes("Grounded Narrative Depth Repair"),"systems ledger records the repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Grounded narrative-depth architecture check passed (${checks.length} checks).`);

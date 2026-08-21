import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const quality=read("src/lib/publication/quality.ts");
const gate=read("src/lib/publication/prose-integrity.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [quality.includes('evaluateReaderFacingProseIntegrity'),"quality evaluator imports prose-integrity gate"],
  [quality.includes('const proseIntegrity=evaluateReaderFacingProseIntegrity(draft,graph);'),"quality evaluator runs prose-integrity gate"],
  [quality.includes('blockers.push(...readerReady.issues,...evidenceDepth,...proseIntegrity.issues);'),"prose-integrity issues are hard blockers"],
  [quality.includes('...proseIntegrity.warnings'),"prose-integrity warnings are preserved"],
  [gate.includes('methodology-first deck'),"methodology-first deck is rejected"],
  [gate.includes('publication-process/scaffolding language'),"publication scaffolding is rejected"],
  [gate.includes('extracted keyword/list residue'),"extraction residue is rejected"],
  [gate.includes('opening answer to state the event itself'),"opening must state the event"],
  [gate.includes('generic length padding'),"multiple stock bridge sentences are rejected"],
  [quality.includes('if(nonMethodWords<160)'),"160-word reader-ready gate remains unchanged"],
  [systems.includes('Reader-Facing Prose Integrity Gate'),"systems ledger records prose-integrity gate"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Reader-facing prose integrity architecture check passed (${checks.length} checks).`);

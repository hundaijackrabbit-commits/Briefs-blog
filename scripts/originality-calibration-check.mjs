import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const orig=read("src/lib/publication/originality.ts"),quality=read("src/lib/publication/quality.ts"),pipeline=read("src/lib/publication/pipeline.ts"),types=read("src/lib/publication/types.ts"),systems=read("SYSTEMS.md");
const checks=[
 [orig.includes("blockingReasons")&&orig.includes("hardExact"),"warnings and hard blockers are separate"],
 [orig.includes("Math.sqrt(A.size*B.size)"),"short-source n-gram inflation normalized"],
 [orig.includes("longestMatchingWords>=14"),"14+ exact words still hard-fail"],
 [orig.includes("maxSourceOverlap>=.34"),"very high source overlap still hard-fails"],
 [quality.includes("originality.blockingReasons"),"quality reports precise originality blockers"],
 [quality.includes("overlapPenalty")&&quality.includes("phrasePenalty"),"originality score is continuous"],
 [pipeline.includes("blockingReasons:originality.blockingReasons"),"pipeline persists blocker telemetry"],
 [types.includes("blockingReasons:string[]"),"blocker telemetry is typed"],
 [systems.includes("Originality Warning/Block Separation"),"systems ledger updated"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Originality calibration architecture check passed (${checks.length} checks).`);

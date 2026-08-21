import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const quality=read("src/lib/publication/quality.ts");
const systems=read("SYSTEMS.md");
const helper=read("src/lib/publication/interpretive-depth.ts");
const checks=[
  [writer.includes('from "@/lib/publication/interpretive-depth"'),"writer imports bounded interpretive-depth helper"],
  [writer.includes("augmentInterpretiveDepth({"),"deterministic writer can add epistemic connective prose"],
  [writer.includes("currentNarrativeWords:depth.narrativeWords"),"interpretive repair runs only after grounded finding expansion"],
  [writer.includes("targetNarrativeWords:180"),"writer retains the 180-word safety target"],
  [quality.includes("if(nonMethodWords<160)"),"160-word reader-ready publication gate remains unchanged"],
  [helper.includes("not a gap to fill with speculation"),"repair explicitly resists speculative padding"],
  [!helper.includes("the reader should"),"repair avoids internal reader-instruction language"],
  [systems.includes("Bounded Interpretive Depth"),"systems ledger records bounded interpretive depth"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Bounded interpretive-depth architecture check passed (${checks.length} checks).`);

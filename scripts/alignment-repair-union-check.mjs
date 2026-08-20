import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const research=read("src/lib/publication/research.ts");
const helper=read("src/lib/publication/alignment-repair-union.ts");
const alignment=read("src/lib/publication/subject-alignment.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [research.includes('from "@/lib/publication/alignment-repair-union"'),"publication research imports bounded repair-union helper"],
  [research.includes("mergeResearchGraphs([initialGraph,...repairs.map(repair=>repair.graph)]"),"repair variants are merged before final alignment choice"],
  [research.includes("betterAlignment"),"best research attempt prefers publication-passing aligned evidence"],
  [helper.includes("graphs.some(graph=>graph.sufficient)"),"merged graph preserves sufficiency only from real research attempts"],
  [helper.includes("alignment.alignedSourceIds.length"),"alignment choice explicitly values aligned-source count"],
  [alignment.includes("alignedSources.length<3"),"three-source alignment gate remains unchanged"],
  [alignment.includes("alignedFamilies<2"),"two-family minimum remains unchanged"],
  [systems.includes("Bounded Alignment Repair Evidence Union"),"systems ledger records repair-evidence union"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Alignment repair-union architecture check passed (${checks.length} checks).`);

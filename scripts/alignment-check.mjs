import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const required=[
  "src/lib/publication/event-identity.ts",
  "src/lib/publication/subject-alignment.ts",
  "src/lib/publication/research.ts",
  "scripts/alignment-regression.mjs",
  "PUBLICATION-1.2.2-ALIGNMENT.md"
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(root,f)).size<80);
if(missing.length){console.error("Alignment files missing/truncated:",missing.join(", "));process.exit(1);}
const pkg=JSON.parse(read("package.json"));
const globalTypes=read("src/lib/publication/global-types.ts");
const discovery=read("src/lib/publication/global-discovery.ts");
const research=read("src/lib/publication/research.ts");
const pipeline=read("src/lib/publication/pipeline.ts");
const quality=read("src/lib/publication/quality.ts");
const researchTypes=read("src/lib/research/types.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [pkg.version==="1.2.2","package version 1.2.2"],
  [globalTypes.includes("eventAnchor:ResearchEventAnchor")&&globalTypes.includes("clusterCoherence:number"),"global candidates carry event identity + coherence"],
  [discovery.includes("buildEventAnchor")&&discovery.includes("clusterCoherenceScore")&&discovery.includes("titleEventAlignment"),"discovery applies event identity before ranking"],
  [research.includes("anchorPreservingQuery")&&research.includes("alignmentQueryVariants")&&research.includes("evaluateResearchAlignment")&&research.includes("applyResearchAlignment"),"publication research preserves subject and runs bounded repair"],
  [pipeline.includes("selectedSubject?:string")&&pipeline.includes("Research subject alignment blocked drafting"),"selected subject survives into research and can block drafting"],
  [quality.includes("Research subject alignment")&&quality.includes("graph.alignment"),"publication quality has explicit alignment blocker"],
  [researchTypes.includes("ResearchSubjectAlignment")&&researchTypes.includes("sourceScores")&&researchTypes.includes("staleSourceIds"),"alignment telemetry persists with the research graph"],
  [systems.includes("Publication Engine 1.2.2")&&systems.includes("Research Subject Alignment Engine"),"canonical systems ledger includes 1.2.2 alignment systems"]
];
for(const [ok,name] of checks)console.log(ok?"PASS":"FAIL",name);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Publication Engine 1.2.2 alignment architecture check passed (${checks.length} checks).`);

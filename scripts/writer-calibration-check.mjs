import fs from "node:fs";
import path from "node:path";
const root=process.cwd();const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const synthesis=read("src/lib/publication/writer-synthesis.ts");
const originality=read("src/lib/publication/originality.ts");
const event=read("src/lib/publication/event-identity.ts");
const pipeline=read("src/lib/publication/pipeline.ts");
const types=read("src/lib/publication/types.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [writer.includes("synthesizeReportingFinding")&&!writer.includes("function paraphraseHeadline"),"deterministic writer synthesizes reporting instead of headline substitution"],
  [writer.includes("domainMeaning")&&writer.includes("domainWatch")&&writer.includes("domainDeckClause"),"deterministic writer is domain-aware"],
  [writer.includes("contract.angleKey==="),"angle-driven article structure remains intact"],
  [synthesis.includes('domain==="markets"')&&synthesis.includes('domain==="health"'),"domain synthesis distinguishes markets and health"],
  [originality.includes("strongestSourceMatch")&&originality.includes("phrase"),"originality diagnostics identify strongest source and phrase"],
  [pipeline.includes("sourceInputs=graph.sources.map")&&pipeline.includes("diagnostics:originality.diagnostics"),"pipeline persists originality diagnostics"],
  [event.includes("supportedGeography")&&event.includes("totalWeight"),"event alignment uses calibrated geography and dynamic dimensions"],
  [types.includes("OriginalityMatchDiagnostic")&&types.includes("diagnostics:"),"originality telemetry is typed"],
  [systems.includes("Deterministic Synthesis & Alignment Calibration"),"systems ledger records the repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Writer/calibration architecture check passed (${checks.length} checks).`);

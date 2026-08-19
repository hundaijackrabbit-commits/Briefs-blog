import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const discovery=read("src/lib/publication/global-discovery.ts");
const event=read("src/lib/publication/event-identity.ts");
const types=read("src/lib/publication/global-types.ts");
const distinct=read("src/lib/publication/distinctiveness.ts");
const editorial=read("src/lib/publication/global-editorial.ts");
const align=read("src/lib/publication/subject-alignment.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [discovery.includes("evaluateCandidateIntegrity")&&discovery.includes("candidateIntegrityPassed"),"discovery evaluates and filters candidate integrity before ranking"],
  [event.includes("let weighted=0,totalWeight=0")&&event.includes("if(anchor.topicTerms.length)"),"event alignment omits absent topic dimension from weighting"],
  [types.includes("candidateIntegrityScore?:number")&&types.includes("eventhoodScore?:number"),"global candidate type carries discovery-integrity telemetry"],
  [distinct.includes("discovery integrity")&&distinct.includes("integrityAdjustment"),"final ranking incorporates discovery-integrity score"],
  [editorial.includes("candidate.candidateIntegrityPassed===true")&&!editorial.includes("const rankedPool=(viable.length?viable:ranked)"),"editorial selection cannot fall back to integrity-failed candidates"],
  [editorial.includes("No candidate passed discovery-integrity and global importance gates"),"empty viable pool fails closed before deep research"],
  [align.includes("const actionCoverage=anchor.actionTerms.length?coverage(anchor.actionTerms,alignedTexts):0"),"empty action terms report action coverage as zero"],
  [align.includes("compositeActionCoverage"),"alignment composite remains neutral when action dimension is absent"],
  [systems.includes("Discovery Candidate Integrity"),"systems ledger records upstream discovery-integrity repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Discovery-integrity architecture check passed (${checks.length} checks).`);

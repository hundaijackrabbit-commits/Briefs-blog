import fs from "node:fs";
import path from "node:path";
const root=process.cwd();const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const required=["src/lib/reader/types.ts","src/lib/reader/model.ts","src/lib/reader/plan.ts","src/lib/reader/composer.ts","src/lib/reader/quality.ts","src/lib/reader/telemetry.ts","src/lib/publication/angles.ts","src/lib/publication/story-contract.ts","db/v10_2_refinement.sql","scripts/refinement-eval.mjs","V10.2-REFINEMENT.md"];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(root,f)).size<40);if(missing.length){console.error("V10.2 missing/truncated files:",missing.join(", "));process.exit(1);}
const pkg=JSON.parse(read("package.json"));const brief=read("src/lib/engine/brief-object.ts");const pipeline=read("src/lib/publication/pipeline.ts");const quality=read("src/lib/publication/quality.ts");const writer=read("src/lib/publication/writer.ts");const schema=read("db/schema.sql");const systems=read("SYSTEMS.md");
const checks=[
 [/^1\.2\./.test(pkg.version),"package remains on 1.2.x refinement line"],
 [brief.includes("inferReaderModel")&&brief.includes("buildAnswerPlan")&&brief.includes("composeReaderAnswer")&&brief.includes("evaluateAnswerQuality"),"Reader Model → Answer Plan → grounded composer → answer quality"],
 [pipeline.includes("generateStoryAngles")&&pipeline.includes("buildStoryContract")&&pipeline.includes("persistAngleCandidates"),"multi-angle editorial planning + story contract"],
 [quality.includes("evaluateAudienceFit")&&quality.includes("headlineScore")&&quality.includes("specificityScore"),"semantic audience/headline/specificity publication grading"],
 [/briefs-publication-draft-v[23]/.test(writer)&&writer.includes("story:contract")&&writer.includes("claimIdsMustComeFromInput"),"writer contract is evidence-bound"],
 [schema.includes("publication_angle_candidates")&&schema.includes("publication_story_contracts")&&schema.includes("brief_answer_evaluations"),"V10.2 persistence schema"],
 [systems.includes("Reader Intelligence Engine")&&systems.includes("Story Angle Intelligence")&&systems.includes("Answer Quality Lab"),"canonical system ledger includes refinement systems"]
];
for(const [ok,name] of checks)console.log(ok?"PASS":"FAIL",name);if(checks.some(([ok])=>!ok))process.exit(1);console.log(`V10.2 refinement architecture check passed (${checks.length} checks).`);

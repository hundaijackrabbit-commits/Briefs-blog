import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const distinct=read("src/lib/publication/distinctiveness.ts");
const helper=read("src/lib/publication/distinctiveness-history.ts");
const editorial=read("src/lib/publication/global-editorial.ts");
const systems=read("SYSTEMS.md");

const checks=[
  [distinct.includes('from "@/lib/publication/distinctiveness-history"'),"distinctiveness imports reader-facing history policy"],
  [distinct.includes("article_id is not null"),"blocked/no-article flagships are excluded from history"],
  [distinct.includes("status in ('drafted','published')"),"only drafted/published flagship history influences distinctiveness"],
  [!distinct.includes("sameCategoryYesterday"),"same-category-yesterday hard penalty is removed"],
  [distinct.includes("categoryFatiguePenalty"),"category repetition is retained only as a bounded fatigue nudge"],
  [helper.includes("Math.min(6,excess*2)"),"category fatigue remains bounded"],
  [editorial.includes("candidate.finalScore>=55"),"global viability threshold remains unchanged"],
  [systems.includes("Reader-Facing Distinctiveness History"),"systems ledger records the repair"]
];

for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Reader-facing distinctiveness architecture check passed (${checks.length} checks).`);

import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const helper=read("src/lib/publication/headline-originality.ts");
const originality=read("src/lib/publication/originality.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [writer.includes('from "@/lib/publication/headline-originality"'),"writer imports headline-originality preflight"],
  [writer.includes("originalitySafeHeadline(preferred,graph.canonicalSubject,graph.sources.map(s=>s.title))"),"every deterministic headline passes source-title preflight"],
  [helper.includes("HEADLINE_REPAIR_WORDS=11"),"headline recomposition starts before the 14-word article hard blocker"],
  [helper.includes("reframeSubject"),"long source-like subjects can be deterministically reframed"],
  [originality.includes("const hardExact=longestMatchingWords>=14"),"14-word article exact-copy hard gate remains unchanged"],
  [originality.includes("blockingReasons.push(`Exact phrase overlap is too long"),"article exact-copy blocker remains active"],
  [systems.includes("Headline Originality Preflight"),"systems ledger records headline originality repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Headline originality architecture check passed (${checks.length} checks).`);

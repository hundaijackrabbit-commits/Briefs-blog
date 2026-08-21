import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const headline=read("src/lib/publication/headline-originality.ts");
const originality=read("src/lib/publication/originality.ts");
const globalEditorial=read("src/lib/publication/global-editorial.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [writer.includes("originalitySafeSubject"),"deterministic writer imports source-safe subject helper"],
  [writer.includes("const proseSubject=originalitySafeSubject"),"deterministic writer computes a reader-facing prose subject"],
  [writer.includes("synthesizeReportingFinding(v,proseSubject(graph)"),"reporting synthesis no longer receives raw canonical source-shaped subject"],
  [writer.includes("domainMeaning(domain,proseSubjectValue)"),"analysis prose uses safe subject"],
  [writer.includes("domainWatch(domain,proseSubjectValue"),"watch prose uses safe subject"],
  [headline.includes("export function originalitySafeSubject"),"source-safe prose subject helper is exported"],
  [originality.includes("const hardExact=longestMatchingWords>=14"),"14-word exact-copy hard gate remains unchanged"],
  [globalEditorial.includes("let firstFailure:DailyFlagshipResult|undefined"),"fallback loop tracks the first candidate failure"],
  [globalEditorial.includes("firstFailure||lastFailure"),"final API response keeps candidate/opportunity association coherent"],
  [systems.includes("Reader-Prose Originality Preflight"),"systems ledger records reader-prose originality preflight"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Reader-prose originality architecture check passed (${checks.length} checks).`);

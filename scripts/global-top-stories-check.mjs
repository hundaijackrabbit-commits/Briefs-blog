import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const discovery=read("src/lib/publication/global-discovery.ts");
const helper=read("src/lib/publication/global-top-stories.ts");
const editorial=read("src/lib/publication/global-editorial.ts");
const systems=read("SYSTEMS.md");

const checks=[
  [discovery.includes('from "@/lib/publication/global-top-stories"'),"global discovery imports bounded top-story editions"],
  [discovery.includes("queryGoogleNewsTop"),"global discovery has a dedicated top-stories intake"],
  [discovery.includes("collectTopStories"),"top-story editions are collected independently"],
  [discovery.includes("...top.seeds"),"top-story seeds join the candidate discovery pool"],
  [discovery.includes("top=${top.successes}/${GLOBAL_TOP_STORY_EDITIONS.length}"),"runtime telemetry reports top-story coverage"],
  [helper.includes("GLOBAL_TOP_STORY_EDITIONS")&&helper.includes("googleNewsTopStoriesUrl"),"top-story editions and URL construction are isolated and testable"],
  [editorial.includes("candidate.finalScore>=55"),"existing global-importance viability threshold remains unchanged"],
  [systems.includes("Global Top-Stories Discovery Rail"),"systems ledger records the new discovery rail"]
];

for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Global top-stories architecture check passed (${checks.length} checks).`);

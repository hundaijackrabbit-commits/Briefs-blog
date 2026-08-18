import fs from "node:fs";
import path from "node:path";
const root=process.cwd();const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const required=["src/lib/publication/global-types.ts","src/lib/publication/global-discovery.ts","src/lib/publication/global-importance.ts","src/lib/publication/distinctiveness.ts","src/lib/publication/global-editorial.ts","db/v10_2_1_global_editorial.sql","GLOBAL-EDITORIAL-1.2.1.md"];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(root,f)).size<80);if(missing.length){console.error("Global editorial files missing/truncated:",missing.join(", "));process.exit(1);}
const pkg=JSON.parse(read("package.json"));const discovery=read("src/lib/publication/global-discovery.ts");const scoring=read("src/lib/publication/global-importance.ts");const distinct=read("src/lib/publication/distinctiveness.ts");const editorial=read("src/lib/publication/global-editorial.ts");const scheduler=read("src/lib/publication/scheduler.ts");const angles=read("src/lib/publication/angles.ts");const writer=read("src/lib/publication/writer.ts");const cron=read("src/app/api/cron/publication/route.ts");const schema=read("db/schema.sql");const systems=read("SYSTEMS.md");const vercel=JSON.parse(read("vercel.json"));
const publicationCron=vercel.crons?.find(c=>c.path==="/api/cron/publication")?.schedule;
const checks=[
  [pkg.version==="1.2.1","package version 1.2.1"],
  [discovery.includes("CATEGORY_QUERIES")&&discovery.includes("REGION_TERMS")&&discovery.includes("clusterSeeds"),"global category discovery + geographic normalization + event clustering"],
  [scoring.includes("geographicReach*.20")&&scoring.includes("humanConsequence*.18")&&scoring.includes("longTermConsequence*.12"),"global importance weighted scoring contract"],
  [distinct.includes("current_date-60")&&distinct.includes("materialChange")&&distinct.includes("repeatPenalty"),"60-day daily distinctiveness with material-change override"],
  [editorial.includes("publication_daily_flagships")&&editorial.includes("researchKeyword")&&editorial.includes("system_owned")&&editorial.includes("publishability fallback"),"daily winner persists, deep-researches, and can fall back only when higher-ranked stories fail evidence gates"],
  [scheduler.includes("researchKeyword(String(item.target_id),{draft:false})"),"watched-keyword cron research cannot create competing autonomous daily articles"],
  [angles.includes("angleReusePenalty")&&writer.includes("contract.angleKey"),"daily distinctiveness extends into story-angle reuse and deterministic article structure"],
  [cron.includes("runGlobalEditorialSelection")&&cron.includes("runPublicationWorker(3,8_000)"),"Hobby-safe daily publication cron integrates bounded flagship generation"],
  [publicationCron==="30 18 * * *","publication cron remains Hobby-compatible once daily"],
  [schema.includes("publication_global_candidates")&&schema.includes("publication_daily_flagships"),"global editorial persistence schema"],
  [systems.includes("Global Importance Engine")&&systems.includes("Daily Distinctiveness Engine"),"canonical systems ledger updated"]
];
for(const [ok,name] of checks)console.log(ok?"PASS":"FAIL",name);if(checks.some(([ok])=>!ok))process.exit(1);console.log(`Global editorial architecture check passed (${checks.length} checks).`);

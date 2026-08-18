import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "src/lib/intelligence/brief-context.ts",
  "src/lib/research/iteration.ts",
  "src/lib/personal/auth.ts",
  "src/lib/personal/read-state.ts",
  "src/lib/personal/digest.ts",
  "src/lib/personal/conversation.ts",
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/personal/route.ts",
  "src/app/my-briefs/page.tsx",
  "src/proxy.ts",
  "db/v8_migration.sql",
  "V8-BLUEPRINT.md",
  "COMPETITIVE-BENCHMARK-V8.md",
  "SYSTEMS.md"
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error("V8 missing files:",missing.join(", "));process.exit(1);}

const client=fs.readFileSync(path.join(root,"src/app/brief-me/brief-client.tsx"),"utf8");
const brief=fs.readFileSync(path.join(root,"src/lib/engine/brief-object.ts"),"utf8");
const research=fs.readFileSync(path.join(root,"src/lib/research/research-engine.ts"),"utf8");
const daily=fs.readFileSync(path.join(root,"src/lib/engine/daily.ts"),"utf8");
const proxy=fs.readFileSync(path.join(root,"src/proxy.ts"),"utf8");
const systems=fs.readFileSync(path.join(root,"SYSTEMS.md"),"utf8");
const schema=fs.readFileSync(path.join(root,"db/schema.sql"),"utf8");

const checks=[
  [client.includes("KEEP THE CONTEXT"),"follow-up UI"],
  [client.includes("claim-evidence"),"claim evidence drawer"],
  [client.includes("You’re caught up"),"finite caught-up state"],
  [client.includes("/api/personal"),"follow sync path"],
  [brief.includes("contextualizeRequest"),"Brief Context engine wiring"],
  [research.includes("evaluateResearchGaps"),"iterative research gap evaluator"],
  [research.includes("comparison"),"comparison result surface"],
  [daily.includes("runPersonalDigest"),"daily personal intelligence integration"],
  [proxy.includes('path.startsWith("/admin")'),"admin UI gate"],
  [schema.includes("reader_accounts"),"reader account schema"],
  [schema.includes("brief_packs"),"Brief Packs schema"],
  [schema.includes("reader_read_states"),"read-state schema"],
  [systems.includes("V1 — publication foundation"),"V1 preservation"],
  [systems.includes("V7 — query intelligence"),"V7 preservation"],
  [systems.includes("V10"),"V10 preservation"],
  [systems.includes("Evidence graph"),"evidence-engine preservation"],
  [systems.includes("Durable job queue"),"reliability preservation"]
];
const failed=checks.filter(([ok])=>!ok);
if(failed.length){for(const [,name] of failed) console.error("FAIL",name);process.exit(1);}
console.log(`V8 architecture check passed (${checks.length} checks).`);

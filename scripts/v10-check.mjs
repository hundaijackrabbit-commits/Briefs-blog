import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "src/lib/ops/readiness.ts","src/lib/ops/telemetry.ts","src/lib/research/providers/openalex.ts","src/lib/research/providers/web-page.ts",
  "src/lib/intelligence/signals.ts","src/lib/intelligence/monitor.ts","src/app/api/signals/route.ts","src/app/api/admin/ops/route.ts","src/app/admin/ops/page.tsx",
  "db/v10_migration.sql","V10-BLUEPRINT.md","COMPETITIVE-BENCHMARK-V10.md","SYSTEMS.md","scripts/v10-eval.mjs","scripts/db-doctor.mjs"
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(root,f)).size<30);
if(missing.length){console.error("V10 missing/truncated files:",missing.join(", "));process.exit(1);}
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const pkg=JSON.parse(read("package.json"));const research=read("src/lib/research/research-engine.ts");const store=read("src/lib/knowledge/store.ts");const brief=read("src/lib/engine/brief-object.ts");const daily=read("src/lib/engine/daily.ts");const schema=read("db/schema.sql");const systems=read("SYSTEMS.md");const next=read("next.config.ts");const health=read("src/app/api/health/route.ts");const intent=read("src/lib/intelligence/query-intent.ts");
const count=(needle)=>schema.split(needle).length-1;
const checks=[
 [pkg.version==="1.0.0","package version 1.0.0"],
 [research.includes("loadResearchMemory")&&research.includes("maxIterations")&&research.includes("researchDiscoveredPages"),"bounded iterative research + persistent memory"],
 [research.includes("openAlexProvider"),"scholarly provider routing"],
 [store.includes('intent.intent==="previous_state"')&&store.includes("mergeKnowledge"),"historical-memory + research merge"],
 [brief.includes("qualityScore")&&brief.includes("contradictionSummary"),"quality and disagreement surfacing"],
 [intent.includes('intent="evidence"')&&intent.includes('intent="previous_state"'),"evidence and prior-state follow-up intents"],
 [daily.includes("refreshTrackedSubjects")&&daily.includes("computeSignals"),"living monitoring + signals in daily run"],
 [schema.includes("research_memories")&&schema.includes("system_observations")&&schema.includes("provider_health")&&schema.includes("brief_signals"),"V10 persistence schema"],
 [count("create table if not exists change_candidates (")===1,"editorial change_candidates schema is not shadowed"],
 [count("create table if not exists observed_changes (")>=1,"reader-facing observed change stream"],
 [next.includes("X-Content-Type-Options")&&next.includes("X-Frame-Options")&&next.includes("Permissions-Policy"),"security headers"],
 [health.includes('mvp:"complete"')&&health.includes('version:"1.0.0"'),"V10 health contract"],
 [systems.includes("V10 — MVP completion — complete")&&systems.includes("Durable job queue")&&systems.includes("Evidence graph")&&systems.includes("Editorial policy engine")&&systems.includes("Reader accounts")&&systems.includes("Public API v1"),"canonical system ledger completion + preservation"]
];
const failed=checks.filter(([ok])=>!ok);for(const [ok,name] of checks)console.log(ok?"PASS":"FAIL",name);if(failed.length)process.exit(1);console.log(`V10 MVP architecture check passed (${checks.length} checks).`);

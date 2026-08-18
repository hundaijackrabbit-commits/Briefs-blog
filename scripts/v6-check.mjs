import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const must=[
  "src/lib/research/research-engine.ts",
  "src/lib/research/decompose.ts",
  "src/lib/research/rank.ts",
  "src/lib/research/persistence.ts",
  "src/lib/research/providers/wikipedia.ts",
  "src/lib/research/providers/wikidata.ts",
  "src/app/api/research/status/route.ts",
  "db/v6_migration.sql",
  "V6-BLUEPRINT.md",
  "SYSTEMS.md"
];
const failures=[];
for(const rel of must) if(!fs.existsSync(path.join(root,rel))) failures.push(`missing ${rel}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(Number(pkg.version.split(".").slice(0,2).join("."))<0.6) failures.push(`package version is ${pkg.version}, expected 0.6.0 or later`);
const store=fs.readFileSync(path.join(root,"src/lib/knowledge/store.ts"),"utf8");
if(!/researchSubject\(/.test(store)) failures.push("Knowledge Store does not invoke V6 research path");
if(!store.includes('"research"')) failures.push("Knowledge Store is missing research source mode");
const engine=fs.readFileSync(path.join(root,"src/lib/research/research-engine.ts"),"utf8");
for(const needle of ["decomposeResearchRequest","wikipediaProvider","wikidataProvider","sourceDiversity","persistResearchGraph","withBudget"]) if(!engine.includes(needle)) failures.push(`research engine missing ${needle}`);
const schema=fs.readFileSync(path.join(root,"db/schema.sql"),"utf8");
for(const table of ["research_runs","research_evidence","research_findings","research_contexts"]) if(!schema.includes(`create table if not exists ${table}`)) failures.push(`schema missing ${table}`);
const queue=fs.readFileSync(path.join(root,"src/lib/engine/queue.ts"),"utf8");
if(!queue.includes("JSON.parse(JSON.stringify(payload))")) failures.push("V4/V5 JSON-safe queue fix regressed");
const starter=fs.readFileSync(path.join(root,"src/lib/knowledge/starter.ts"),"utf8").toLowerCase();
if(starter.includes("austin powers")) failures.push("Austin Powers was hard-coded into starter corpus; V6 acceptance test must exercise generic research");
if(failures.length){console.error("V6 CHECK FAILED\n- "+failures.join("\n- "));process.exit(1);}
console.log("V6 CHECK PASSED — generic research path, providers, persistence, schema, and prior reliability fixes are present.");

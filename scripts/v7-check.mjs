import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "src/lib/intelligence/query-intent.ts",
  "src/lib/research/finance-engine.ts",
  "src/lib/research/providers/sec.ts",
  "src/lib/research/providers/alpha-vantage.ts",
  "src/lib/research/providers/gdelt.ts",
  "V7-BLUEPRINT.md","COMPETITIVE-BENCHMARK-V7.md","SYSTEMS.md"
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error("V7 missing files:",missing.join(", "));process.exit(1);}
const intent=fs.readFileSync(path.join(root,"src/lib/intelligence/query-intent.ts"),"utf8");
const finance=fs.readFileSync(path.join(root,"src/lib/research/finance-engine.ts"),"utf8");
const store=fs.readFileSync(path.join(root,"src/lib/knowledge/store.ts"),"utf8");
const client=fs.readFileSync(path.join(root,"src/app/brief-me/brief-client.tsx"),"utf8");
const systems=fs.readFileSync(path.join(root,"SYSTEMS.md"),"utf8");
const checks=[
  [intent.includes('"market_snapshot"'),"market snapshot intent"],
  [intent.includes('"market_move"'),"market movement intent"],
  [intent.includes('effectivePerspective'),"effective perspective routing"],
  [finance.includes("researchSecCompany"),"SEC finance path"],
  [finance.includes("ALPHA_VANTAGE_API_KEY"),"explicit quote-provider gap"],
  [store.includes('intent.domain==="finance"'),"knowledge-store finance router"],
  [store.includes('intent.domain==="current"'),"knowledge-store current router"],
  [client.includes("Primary only"),"source policy UI"],
  [client.includes("Market-data note"),"finance freshness disclaimer"],
  [systems.includes("Query Intent Engine"),"systems registry V7 intent engine"],
  [systems.includes("V10"),"V10 preservation"]
];
const failed=checks.filter(([ok])=>!ok);
if(failed.length){for(const [,name] of failed) console.error("FAIL",name);process.exit(1);}
console.log(`V7 architecture check passed (${checks.length} checks).`);

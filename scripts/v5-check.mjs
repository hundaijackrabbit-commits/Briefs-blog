import fs from "node:fs";
const required=[
  "src/lib/knowledge/starter.ts","src/lib/knowledge/store.ts","src/lib/engine/research-requests.ts",
  "src/app/api/knowledge/status/route.ts","db/v5_migration.sql","scripts/db-bootstrap.mjs","SYSTEMS.md"
];
let failed=false;
for(const file of required){if(!fs.existsSync(file)||fs.statSync(file).size<40){console.error("Missing/empty:",file);failed=true;}}
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="0.5.0"){console.error("Expected package version 0.5.0");failed=true;}
const api=fs.readFileSync("src/app/api/brief/route.ts","utf8");
if(api.includes("DATABASE_NOT_CONFIGURED")){console.error("V5 Brief API must degrade to starter corpus instead of hard-failing without DB");failed=true;}
const starter=fs.readFileSync("src/lib/knowledge/starter.ts","utf8");
if(!starter.includes("world-war-ii")||!starter.includes("ushmm-ww2")){console.error("WW2 starter knowledge pack missing");failed=true;}
if(failed) process.exit(1);
console.log("V5 Living Knowledge MVP check passed.");

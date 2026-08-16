import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const ts=require("typescript");

const source=fs.readFileSync(new URL("../src/lib/intelligence/query-intent.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(js,{module:mod,exports:mod.exports,require(){throw new Error("Unexpected runtime import in query-intent smoke test");},Set,RegExp,String,Boolean},{filename:"query-intent.js"});
const {classifyQuery}=mod.exports;
if(typeof classifyQuery!=="function") throw new Error("classifyQuery export missing");
const base={depth:"standard",perspective:"general",sourcePolicy:"verified",freshnessRequirement:"current",format:"web"};
const cases=[
  ["Apple stock","market_snapshot","finance","Apple","investor"],
  ["Why is Apple stock down today?","market_move","finance","Apple","investor"],
  ["AAPL earnings","financials","finance","AAPL","investor"],
  ["AAPL","market_snapshot","finance","AAPL","investor"],
  ["latest Anthropic news","current_update","current","latest Anthropic news","general"],
  ["Apple history","history","reference","Apple history","general"],
  ["Austin Powers","general","general","Austin Powers","general"]
];
let failed=0;
for(const [subject,intent,domain,entity,lens] of cases){
  const got=classifyQuery({...base,subject});
  const ok=got.intent===intent&&got.domain===domain&&got.entityQuery===entity&&got.effectivePerspective===lens;
  console.log(ok?"PASS":"FAIL",subject,"→",got.intent,got.domain,JSON.stringify(got.entityQuery),got.effectivePerspective);
  if(!ok) failed++;
}
if(failed){console.error(`${failed} intent smoke test(s) failed.`);process.exit(1);}
console.log(`V7 intent smoke test passed (${cases.length} cases).`);

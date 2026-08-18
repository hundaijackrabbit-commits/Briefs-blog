const base=(process.env.BRIEFS_EVAL_BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const cases=[
  {q:"Apple stock",intent:"market_snapshot",must:/AAPL|Apple/i,forbid:/history of apple|founded in/i},
  {q:"Why is Apple stock down today?",intent:"market_move",must:/Apple|AAPL/i,forbid:/history of apple/i},
  {q:"AAPL earnings",intent:"financials",must:/AAPL|earn|revenue|income/i},
  {q:"Austin Powers",must:/Austin Powers/i},
  {q:"WW2",must:/World War|WW2/i},
  {q:"Compare Nvidia vs AMD",intent:"compare",must:/Nvidia|AMD/i,comparison:true},
  {q:"latest Anthropic news",intent:"current_update",must:/Anthropic/i}
];
let failures=0; const rows=[];
async function brief(body){
  const started=Date.now();
  const res=await fetch(`${base}/api/brief`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({depth:"standard",perspective:"general",sourcePolicy:"verified",freshnessRequirement:"current",format:"web",...body})});
  return {res,body:await res.json(),latency:Date.now()-started};
}
for(const c of cases){
  try{
    const out=await brief({subject:c.q});
    const text=JSON.stringify(out.body);
    const ok=out.res.ok&&(!c.intent||out.body.result?.intent===c.intent)&&(!c.must||c.must.test(text))&&(!c.forbid||!c.forbid.test(text))&&(!c.comparison||out.body.result?.comparison?.length===2);
    rows.push({query:c.q,ok,intent:out.body.result?.intent||"",confidence:out.body.result?.confidence||"",sources:out.body.result?.sources?.length||0,latencyMs:out.latency});
    if(!ok) failures++;
  }catch(error){rows.push({query:c.q,ok:false,error:error instanceof Error?error.message:String(error)});failures++;}
}
try{
  const first=await brief({subject:"Apple stock"});
  const second=await brief({subject:"what about its revenue?",context:first.body.result?.context});
  const root=second.body.result?.context?.rootSubject||"";
  const ok=second.res.ok&&/Apple|AAPL/i.test(root)&&/revenue|financial|Apple|AAPL/i.test(JSON.stringify(second.body));
  rows.push({query:"follow-up context: Apple → revenue",ok,intent:second.body.result?.intent||"",sources:second.body.result?.sources?.length||0,latencyMs:second.latency});
  if(!ok) failures++;
}catch(error){rows.push({query:"follow-up context",ok:false,error:error instanceof Error?error.message:String(error)});failures++;}
console.table(rows);
if(failures){console.error(`${failures} V8 eval case(s) failed.`);process.exit(1);}
console.log("V8 deployed eval passed.");

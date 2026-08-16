const base=(process.env.BRIEFS_EVAL_BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const cases=[
  {q:"Apple stock",intent:"market_snapshot",must:/AAPL|Apple/i,source:/SEC|Alpha Vantage/i,forbid:/history of apple|founded in/i},
  {q:"Why is Apple stock down today?",intent:"market_move",must:/Apple|AAPL/i,source:/SEC|Reuters|AP|CNBC|Bloomberg|Alpha Vantage/i,forbid:/history of apple/i},
  {q:"AAPL earnings",intent:"financials",must:/AAPL|earn|revenue|income/i,source:/SEC/i},
  {q:"AAPL",intent:"market_snapshot",must:/AAPL/i,source:/SEC|Alpha Vantage/i},
  {q:"Austin Powers",must:/Austin Powers/i},
  {q:"WW2",must:/World War|WW2/i},
  {q:"latest Anthropic news",intent:"current_update",must:/Anthropic/i,forbid:/Briefs does not yet have enough verified knowledge/i}
];
let failures=0;
const rows=[];
for(const c of cases){
  const started=Date.now();
  try{
    const res=await fetch(`${base}/api/brief`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:c.q,depth:"standard",perspective:"general",sourcePolicy:"verified",freshnessRequirement:"current",format:"web"})});
    const body=await res.json();
    const text=JSON.stringify(body);
    const ok=res.ok&&(!c.intent||body.result?.intent===c.intent)&&(!c.must||c.must.test(text))&&(!c.source||c.source.test(text))&&(!c.forbid||!c.forbid.test(text));
    const sourceCount=body.result?.sources?.length||0;
    const latency=Date.now()-started;
    rows.push({query:c.q,ok,intent:body.result?.intent||"",confidence:body.result?.confidence||"",sourceMode:body.result?.sourceMode||"",sources:sourceCount,latencyMs:latency});
    console.log(ok?"PASS":"FAIL",c.q,"→",body.result?.intent,body.result?.subject,`(${sourceCount} sources, ${latency}ms)`);
    if(!ok) failures++;
  }catch(error){
    const latency=Date.now()-started;
    console.log("FAIL",c.q,"→",error instanceof Error?error.message:String(error),`(${latency}ms)`);
    rows.push({query:c.q,ok:false,intent:"",confidence:"",sourceMode:"",sources:0,latencyMs:latency});
    failures++;
  }
}
console.table(rows);
if(failures){console.error(`${failures} V7 eval case(s) failed.`);process.exit(1);}else console.log("V7 deployed eval passed.");

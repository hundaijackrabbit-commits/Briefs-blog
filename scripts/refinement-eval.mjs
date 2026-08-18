const base=(process.env.BRIEFS_EVAL_BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const cases=[
 {subject:"Explain quantum computing",perspective:"student",goal:"learn"},
 {subject:"Apple stock",perspective:"investor",goal:"decision"},
 {subject:"Latest Anthropic news",perspective:"executive",goal:"catch-up"},
 {subject:"Explain Kubernetes to my boss",perspective:"developer",goal:"translate"}
];
let failed=0;for(const c of cases){try{const r=await fetch(`${base}/api/brief`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:c.subject,depth:"standard",perspective:c.perspective,sourcePolicy:"verified",freshnessRequirement:/latest/i.test(c.subject)?"recent":"current",format:"web"})});const b=await r.json();const ok=r.ok&&b?.result?.reader&&b?.result?.answerQuality&&b.result.answerQuality.grounding>=80&&String(b.result.summary||"").length>20;console.log(ok?"PASS":"FAIL",c.subject,"→",b?.result?.reader?.audience,b?.result?.reader?.goal,"quality",b?.result?.answerQuality?.score);if(!ok)failed++;}catch(e){console.log("FAIL",c.subject,e instanceof Error?e.message:String(e));failed++;}}
if(failed)process.exit(1);console.log("V10.2 reader-answer evaluation passed.");

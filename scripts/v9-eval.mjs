const base=(process.env.BRIEFS_EVAL_BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const checks=[
  ["health","/api/health",r=>r.ok],
  ["public API status","/api/v1/status",r=>r.ok],
  ["robots","/robots.txt",r=>r.ok&&r.headers.get("content-type")?.includes("text")],
  ["sitemap","/sitemap.xml",r=>r.ok],
  ["RSS","/feed.xml",r=>r.ok&&r.headers.get("content-type")?.includes("rss")],
  ["llms.txt","/llms.txt",r=>r.ok],
  ["public WW2 Brief","/briefs/world-war-ii",r=>r.ok],
  ["Brief API WW2","/api/v1/brief?q=WW2&depth=quick",r=>r.ok],
  ["Markdown export","/api/export?q=WW2&format=markdown",r=>r.ok&&r.headers.get("content-type")?.includes("markdown")]
];
let failed=0;
for(const [name,path,test] of checks){
  const started=Date.now();
  try{const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});const ok=test(response);console.log(ok?"PASS":"FAIL",name,response.status,`${Date.now()-started}ms`);if(!ok)failed++;}
  catch(error){failed++;console.log("FAIL",name,error instanceof Error?error.message:String(error));}
}
if(failed){console.error(`V9 production evaluation failed (${failed}/${checks.length}).`);process.exit(1);}console.log(`V9 production evaluation passed (${checks.length} checks).`);

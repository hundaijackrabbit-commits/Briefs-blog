import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "src/lib/distribution/base-url.ts",
  "src/lib/distribution/public-brief.ts",
  "src/lib/distribution/renderers.ts",
  "src/lib/distribution/email.ts",
  "src/lib/distribution/email-delivery.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/feed.xml/route.ts",
  "src/app/news-sitemap.xml/route.ts",
  "src/app/llms.txt/route.ts",
  "src/app/api/v1/brief/route.ts",
  "src/app/api/v1/status/route.ts",
  "src/app/api/export/route.ts",
  "src/app/briefs/page.tsx",
  "src/app/briefs/[slug]/page.tsx",
  "src/app/briefs/[slug]/opengraph-image.tsx",
  "src/app/methodology/page.tsx",
  "src/app/developers/page.tsx",
  "db/v9_migration.sql",
  "V9-BLUEPRINT.md",
  "COMPETITIVE-BENCHMARK-V9.md",
  "SYSTEMS.md"
];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f))||fs.statSync(path.join(root,f)).size<20);
if(missing.length){console.error("V9 missing/truncated files:",missing.join(", "));process.exit(1);}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const systems=fs.readFileSync(path.join(root,"SYSTEMS.md"),"utf8");
const publicPage=fs.readFileSync(path.join(root,"src/app/briefs/[slug]/page.tsx"),"utf8");
const layout=fs.readFileSync(path.join(root,"src/app/layout.tsx"),"utf8");
const daily=fs.readFileSync(path.join(root,"src/lib/engine/daily.ts"),"utf8");
const schema=fs.readFileSync(path.join(root,"db/schema.sql"),"utf8");
const api=fs.readFileSync(path.join(root,"src/app/api/v1/brief/route.ts"),"utf8");
const checks=[
  [pkg.version==="0.9.0","package version 0.9.0"],
  [publicPage.includes('Article')&&publicPage.includes('BreadcrumbList'),"public Article/Breadcrumb structured data"],
  [publicPage.includes("claim-evidence"),"public claim evidence"],
  [layout.includes('SearchAction'),"WebSite SearchAction structured data"],
  [api.includes("allowRequest")&&api.includes("composeBrief"),"rate-limited public Brief API"],
  [daily.includes("deliverPendingDigestEmails"),"daily email delivery integration"],
  [schema.includes("distribution_deliveries"),"distribution delivery schema"],
  [schema.includes("public_api_observations"),"public API observation schema"],
  [systems.includes("V9 authority & distribution"),"V9 system registry"],
  [systems.includes("Durable job queue"),"V2 reliability preservation"],
  [systems.includes("Evidence graph"),"V3 evidence preservation"],
  [systems.includes("Editorial policy engine"),"V4 editorial preservation"],
  [systems.includes("V5 Knowledge Store"),"V5 knowledge preservation"],
  [systems.includes("Targeted external research orchestrator"),"V6 research preservation"],
  [systems.includes("Query Intent Engine"),"V7 intent preservation"],
  [systems.includes("Reader accounts"),"V8 personal preservation"],
  [systems.includes("V10"),"V10 scope preservation"]
];
const failed=checks.filter(([ok])=>!ok);
if(failed.length){for(const [,name] of failed)console.error("FAIL",name);process.exit(1);}
console.log(`V9 architecture check passed (${checks.length} checks).`);

import fs from "node:fs";

const required = [
  "db/v10_1_publication.sql",
  "src/lib/publication/types.ts",
  "src/lib/publication/audience.ts",
  "src/lib/publication/voice.ts",
  "src/lib/publication/originality.ts",
  "src/lib/publication/scoring.ts",
  "src/lib/publication/research.ts",
  "src/lib/publication/writer.ts",
  "src/lib/publication/quality.ts",
  "src/lib/publication/store.ts",
  "src/lib/publication/pipeline.ts",
  "src/lib/publication/revalidation.ts",
  "src/lib/publication/scheduler.ts",
  "src/lib/engine/brief-object.ts",
  "src/app/admin/publication/page.tsx",
  "src/app/admin/publication/publication-client.tsx",
  "src/app/api/admin/publication/route.ts",
  "src/app/api/cron/publication/route.ts",
  "src/app/articles/page.tsx",
  "src/app/articles/[slug]/page.tsx",
  "src/app/sitemap.ts",
  "src/app/feed.xml/route.ts",
  "src/app/news-sitemap.xml/route.ts",
  "SYSTEMS.md",
  "PUBLICATION-ENGINE.md"
];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) {
  console.error("Publication 1.1 check failed. Missing:", missing.join(", "));
  process.exit(1);
}
const daily = fs.readFileSync("src/lib/engine/daily.ts","utf8");
const systems = fs.readFileSync("SYSTEMS.md","utf8");
const brief = fs.readFileSync("src/lib/engine/brief-object.ts","utf8");
if (!daily.includes("schedulePublicationMaintenance") || !daily.includes("runPublicationWorker")) {
  console.error("Publication maintenance is not integrated into the daily engine.");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
if (!brief.includes("shapeForReader")) { console.error("Brief reader-shaping layer is missing."); process.exit(1); }
if (!systems.includes("Publication Engine 1.1") || !systems.includes("Daily Revalidation Engine")) {
  console.error("SYSTEMS.md does not include the Publication Engine 1.1 registry.");
  process.exit(1);
}
if (pkg.version !== "1.1.0") {
  console.error("Expected package version 1.1.0.");
  process.exit(1);
}
console.log("Publication Engine 1.1 architecture check passed (" + required.length + " files).");

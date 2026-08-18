import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
const file = path.join(process.cwd(),"db","v10_1_publication.sql");
const sql = postgres(url,{max:1,prepare:false,connect_timeout:15});
try {
  console.log("Applying Briefs Publication Engine 1.1 schema…");
  await sql.unsafe(fs.readFileSync(file,"utf8"));
  const [summary] = await sql`
    select
      (select count(*)::int from publication_keywords) keywords,
      (select count(*)::int from publication_articles) articles,
      (select count(*)::int from publication_update_proposals) update_proposals
  `;
  console.log("Publication schema ready:",summary);
} finally {
  await sql.end({timeout:5});
}

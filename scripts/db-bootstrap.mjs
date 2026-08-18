import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL is required. Set it in this shell before running db:bootstrap.");process.exit(1);}
const root=process.cwd();
const schema=fs.readFileSync(path.join(root,"db","schema.sql"),"utf8");
const publication=fs.readFileSync(path.join(root,"db","v10_1_publication.sql"),"utf8");
const refinement=fs.readFileSync(path.join(root,"db","v10_2_refinement.sql"),"utf8");
const globalEditorial=fs.readFileSync(path.join(root,"db","v10_2_1_global_editorial.sql"),"utf8");
const seed=fs.readFileSync(path.join(root,"db","seed.sql"),"utf8");
const sql=postgres(url,{max:1,prepare:false,connect_timeout:15});
try{
  // Publication tables are created first because the canonical schema now includes additive
  // post-MVP tables that reference them. All migrations are idempotent/additive.
  console.log("Applying Publication Engine base schema…");
  await sql.unsafe(publication);
  console.log("Applying Briefs canonical schema…");
  await sql.unsafe(schema);
  console.log("Applying V10.2 refinement schema…");
  await sql.unsafe(refinement);
  console.log("Applying Publication Engine 1.2.1 global editorial schema…");
  await sql.unsafe(globalEditorial);
  console.log("Loading starter knowledge…");
  await sql.unsafe(seed);
  const [summary]=await sql`
    select
      (select count(*)::int from entities) entities,
      (select count(*)::int from claims) claims,
      (select count(*)::int from sources) sources,
      (select count(*)::int from briefs) briefs,
      (select count(*)::int from publication_keywords) publication_keywords,
      (select count(*)::int from publication_articles) publication_articles,
      (select count(*)::int from publication_daily_flagships) daily_flagships
  `;
  console.log("Briefs knowledge database ready:",summary);
}finally{await sql.end({timeout:5});}

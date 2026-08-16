import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL is required. Set it in this shell before running db:bootstrap.");process.exit(1);}
const root=process.cwd();
const schema=fs.readFileSync(path.join(root,"db","schema.sql"),"utf8");
const seed=fs.readFileSync(path.join(root,"db","seed.sql"),"utf8");
const sql=postgres(url,{max:1,prepare:false,connect_timeout:15});
try{
  console.log("Applying Briefs schema…");
  await sql.unsafe(schema);
  console.log("Loading starter knowledge…");
  await sql.unsafe(seed);
  const [summary]=await sql`select (select count(*)::int from entities) entities,(select count(*)::int from claims) claims,(select count(*)::int from sources) sources,(select count(*)::int from briefs) briefs`;
  console.log("Briefs knowledge database ready:",summary);
}finally{await sql.end({timeout:5});}

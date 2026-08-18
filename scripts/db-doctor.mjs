import fs from "node:fs";
const schema=fs.readFileSync("db/schema.sql","utf8");
const staticFailures=[];
for(const needle of ["create table if not exists entities","create table if not exists claims","create table if not exists research_memories","create table if not exists observed_changes","create table if not exists system_observations","create table if not exists provider_health"])if(!schema.includes(needle))staticFailures.push(`schema missing: ${needle}`);
if((schema.match(/create table if not exists change_candidates \(/g)||[]).length!==1)staticFailures.push("editorial change_candidates must have exactly one table definition");
if((schema.match(/create table if not exists observed_changes \(/g)||[]).length<1)staticFailures.push("reader-facing observed_changes table missing");
if(staticFailures.length){console.error(staticFailures.join("\n"));process.exit(1);}
console.log("Static schema contract OK.");
if(!process.env.DATABASE_URL){console.log("DATABASE_URL is not set; live database doctor skipped.");process.exit(0);}
const {default:postgres}=await import("postgres");
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connect_timeout:15});
try{
  const required=["entities","claims","claim_evidence","research_runs","research_memories","observed_changes","system_observations","reader_accounts","briefs","editorial_revisions"];
  const missing=[];for(const name of required){const [row]=await sql`select to_regclass(${`public.${name}`}) name`;if(!row?.name)missing.push(name);}
  if(missing.length)throw new Error(`Missing production tables: ${missing.join(", ")}`);
  const [counts]=await sql`select (select count(*)::int from entities) entities,(select count(*)::int from claims) claims,(select count(*)::int from sources) sources,(select count(*)::int from research_memories) memories`;
  console.log("Production database contract OK:",counts);
}finally{await sql.end({timeout:5});}

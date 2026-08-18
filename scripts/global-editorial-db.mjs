import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
const url=process.env.DATABASE_URL;if(!url){console.error("DATABASE_URL is required.");process.exit(1);}const sqlText=fs.readFileSync(path.join(process.cwd(),"db","v10_2_1_global_editorial.sql"),"utf8");const sql=postgres(url,{max:1,prepare:false,connect_timeout:15});try{console.log("Applying Publication Engine 1.2.1 global editorial migration…");await sql.unsafe(sqlText);console.log("Global editorial database ready.");}finally{await sql.end({timeout:5});}

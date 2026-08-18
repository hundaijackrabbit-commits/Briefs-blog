import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
const url=process.env.DATABASE_URL;if(!url){console.error("DATABASE_URL is required.");process.exit(1);}const sqlText=fs.readFileSync(path.join(process.cwd(),"db","v10_2_refinement.sql"),"utf8");const sql=postgres(url,{max:1,prepare:false,connect_timeout:15});try{console.log("Applying V10.2 refinement migration…");await sql.unsafe(sqlText);console.log("V10.2 refinement database ready.");}finally{await sql.end({timeout:5});}

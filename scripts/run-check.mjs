import { spawnSync } from "node:child_process";
const file=process.argv[2];
if(!file){console.error("check file required");process.exit(2)}
const candidates=process.platform==="win32"?[["py",[file]],["python",[file]],["python3",[file]]]:[["python3",[file]],["python",[file]]];
for(const [cmd,args] of candidates){const r=spawnSync(cmd,args,{stdio:"inherit"});if(r.error?.code==="ENOENT") continue;process.exit(r.status??1)}
console.error("Python was not found. Install Python or run npm run typecheck && npm run build.");process.exit(127);

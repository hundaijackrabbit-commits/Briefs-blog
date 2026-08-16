export class TimeoutError extends Error {}
export async function withTimeout<T>(promise:Promise<T>, ms:number, label="operation"):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new TimeoutError(`${label} timed out after ${ms}ms`)),ms)});
  try{return await Promise.race([promise,timeout]);} finally{if(timer) clearTimeout(timer);}
}
export async function retry<T>(fn:(attempt:number)=>Promise<T>, opts:{attempts:number;baseMs?:number;maxMs?:number;shouldRetry?:(e:unknown)=>boolean}):Promise<T>{
  const base=opts.baseMs??400, max=opts.maxMs??5000;
  let last:unknown;
  for(let attempt=1;attempt<=opts.attempts;attempt++){
    try{return await fn(attempt);}catch(e){last=e;if(attempt===opts.attempts || opts.shouldRetry?.(e)===false) break; const wait=Math.min(max,base*2**(attempt-1))+Math.floor(Math.random()*200); await new Promise(r=>setTimeout(r,wait));}
  }
  throw last;
}
export function stableKey(...parts:(string|number|null|undefined)[]){return parts.map(v=>String(v??"").trim().toLowerCase()).join("|");}

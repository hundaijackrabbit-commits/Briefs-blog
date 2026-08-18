const DEFAULT_TIMEOUT=4500;

export async function fetchJson<T>(url:string,timeoutMs=DEFAULT_TIMEOUT):Promise<T>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(url,{signal:controller.signal,headers:{
      accept:"application/json",
      "user-agent":process.env.BRIEFS_USER_AGENT||"BriefsBlog/1.0 (+https://briefs.blog)"
    },cache:"no-store"});
    if(!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
    return await res.json() as T;
  }finally{clearTimeout(timer);}
}

export function stableResearchId(prefix:string,value:string){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `${prefix}-${(hash>>>0).toString(36)}`;
}

import type { NextRequest } from "next/server";

type Bucket={count:number;reset:number};
const buckets=new Map<string,Bucket>();

export function allowRequest(request:NextRequest,scope:string,limit=30,windowMs=5*60*1000){
  const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip=forwarded||request.headers.get("x-real-ip")||"unknown";
  const key=`${scope}:${ip}`; const now=Date.now();
  const existing=buckets.get(key);
  if(!existing||existing.reset<=now){buckets.set(key,{count:1,reset:now+windowMs});return {ok:true,retryAfter:0};}
  existing.count++;
  if(existing.count>limit) return {ok:false,retryAfter:Math.max(1,Math.ceil((existing.reset-now)/1000))};
  if(buckets.size>2000) for(const [k,v] of buckets) if(v.reset<=now) buckets.delete(k);
  return {ok:true,retryAfter:0};
}

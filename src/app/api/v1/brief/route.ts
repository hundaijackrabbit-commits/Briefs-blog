import { NextRequest, NextResponse } from "next/server";
import { composeBrief } from "@/lib/engine/brief-object";
import { allowRequest } from "@/lib/rate-limit";
import type { BriefDepth, BriefPerspective, BriefRequest } from "@/lib/types";
import { persistPublicApiObservation } from "@/lib/distribution/persistence";

const depths=new Set<BriefDepth>(["flash","quick","standard","deep","research"]);
const perspectives=new Set<BriefPerspective>(["general","executive","investor","developer","student","marketer"]);
function commonHeaders(){return {"cache-control":"no-store","access-control-allow-origin":"*","x-briefs-version":"0.9.0"};}
async function run(request:NextRequest,input:{subject?:string;depth?:string;perspective?:string;sourcePolicy?:BriefRequest["sourcePolicy"];freshnessRequirement?:BriefRequest["freshnessRequirement"]}){
  const rate=allowRequest(request,"public-api-v1",20,5*60*1000);if(!rate.ok)return NextResponse.json({error:"rate_limit",retryAfter:rate.retryAfter},{status:429,headers:{...commonHeaders(),"retry-after":String(rate.retryAfter)}});
  const subject=(input.subject||"").trim().slice(0,200);if(!subject)return NextResponse.json({error:"subject_required"},{status:400,headers:commonHeaders()});
  const depth=depths.has(input.depth as BriefDepth)?input.depth as BriefDepth:"standard";const perspective=perspectives.has(input.perspective as BriefPerspective)?input.perspective as BriefPerspective:"general";
  const shape:BriefRequest={subject,depth,perspective,sourcePolicy:input.sourcePolicy||"verified",freshnessRequirement:input.freshnessRequirement||(/\b(today|latest|now|news|current)\b/i.test(subject)?"recent":"current"),format:"api"};
  try{const output=await composeBrief(shape);void persistPublicApiObservation(shape,output.result);return NextResponse.json({apiVersion:"v1",...output},{headers:commonHeaders()});}catch(error){return NextResponse.json({error:"brief_unavailable",detail:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined},{status:503,headers:commonHeaders()});}
}
export async function GET(request:NextRequest){const q=request.nextUrl.searchParams;const rawSources=q.get("sources");const sourcePolicy=(rawSources&&["verified","primary-only","academic","news","all"].includes(rawSources)?rawSources:"verified") as BriefRequest["sourcePolicy"];return run(request,{subject:q.get("q")||undefined,depth:q.get("depth")||undefined,perspective:q.get("perspective")||undefined,sourcePolicy});}
export async function POST(request:NextRequest){const body=await request.json().catch(()=>({})) as any;return run(request,body);}
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"content-type"}});}

import { NextRequest, NextResponse } from "next/server";
import { composeBrief } from "@/lib/engine/brief-object";
import { allowRequest } from "@/lib/rate-limit";
import { renderBriefCsv, renderBriefMarkdown, safeFilename } from "@/lib/distribution/renderers";
import type { BriefDepth, BriefRequest } from "@/lib/types";

export async function GET(request:NextRequest){
  const rate=allowRequest(request,"export",12,5*60*1000);if(!rate.ok)return NextResponse.json({error:"Too many export requests"},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
  const q=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,200);if(!q)return NextResponse.json({error:"q is required"},{status:400});
  const format=(request.nextUrl.searchParams.get("format")||"markdown").toLowerCase(); const depth=(request.nextUrl.searchParams.get("depth")||"standard") as BriefDepth;
  const shape:BriefRequest={subject:q,depth:["flash","quick","standard","deep","research"].includes(depth)?depth:"standard",perspective:"general",sourcePolicy:"verified",freshnessRequirement:/\b(today|latest|now|current|news)\b/i.test(q)?"recent":"current",format:"api"};
  const {result}=await composeBrief(shape); const name=safeFilename(result.subject);
  if(format==="json") return new NextResponse(JSON.stringify(result,null,2),{headers:{"content-type":"application/json; charset=utf-8","content-disposition":`attachment; filename="${name}.json"`}});
  if(format==="csv") return new NextResponse(renderBriefCsv(result),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="${name}.csv"`}});
  return new NextResponse(renderBriefMarkdown(result),{headers:{"content-type":"text/markdown; charset=utf-8","content-disposition":`attachment; filename="${name}.md"`}});
}

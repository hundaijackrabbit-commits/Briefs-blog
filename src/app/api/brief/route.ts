import { NextRequest, NextResponse } from "next/server";
import { composeBrief } from "@/lib/engine/brief-object";
import { queueResearchRequest } from "@/lib/engine/research-requests";
import type { BriefDepth, BriefPerspective, BriefRequest as BriefRequestShape } from "@/lib/types";

const depths=new Set<BriefDepth>(["flash","quick","standard","deep","research"]);
const perspectives=new Set<BriefPerspective>(["general","executive","investor","developer","student","marketer"]);

export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>null) as Partial<BriefRequestShape>|null;
  if(!body?.subject?.trim()) return NextResponse.json({error:"subject is required"},{status:400});
  const depth=depths.has(body.depth as BriefDepth)?body.depth as BriefDepth:"standard";
  const perspective=perspectives.has(body.perspective as BriefPerspective)?body.perspective as BriefPerspective:"general";
  try{
    const requestShape:BriefRequestShape={subject:body.subject.trim().slice(0,200),entityIds:body.entityIds,timeRange:body.timeRange,depth,perspective,sourcePolicy:body.sourcePolicy??"verified",freshnessRequirement:body.freshnessRequirement??"current",format:body.format??"web"};
    const response=await composeBrief(requestShape);
    if(response.result.researchNeeded) void queueResearchRequest(requestShape,response.plan.missingEvidence.join("; ")||"Coverage gap",response.plan.resolvedEntityIds);
    return NextResponse.json(response,{headers:{"cache-control":"no-store"}});
  }catch(error){
    return NextResponse.json({error:"Brief engine unavailable",detail:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined},{status:503});
  }
}

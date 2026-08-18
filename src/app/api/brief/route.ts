import { NextRequest, NextResponse } from "next/server";
import { composeBrief } from "@/lib/engine/brief-object";
import { queueResearchRequest } from "@/lib/engine/research-requests";
import type { BriefContextSnapshot, BriefDepth, BriefPerspective, BriefRequest as BriefRequestShape } from "@/lib/types";
import { persistConversationTurn } from "@/lib/personal/conversation";
import { recordBriefRead } from "@/lib/personal/read-state";
import { allowRequest } from "@/lib/rate-limit";

const depths=new Set<BriefDepth>(["flash","quick","standard","deep","research"]);
const perspectives=new Set<BriefPerspective>(["general","executive","investor","developer","student","marketer"]);
const sourcePolicies=new Set(["verified","primary-only","academic","news","all"] as const);
const freshnessOptions=new Set(["current","recent","historical"] as const);

export async function POST(request:NextRequest){
  const rate=allowRequest(request,"brief",36,5*60*1000);
  if(!rate.ok) return NextResponse.json({error:"Too many Brief requests. Try again shortly."},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
  const body=await request.json().catch(()=>null) as Partial<BriefRequestShape>|null;
  if(!body?.subject?.trim()) return NextResponse.json({error:"subject is required"},{status:400});
  const depth=depths.has(body.depth as BriefDepth)?body.depth as BriefDepth:"standard";
  const perspective=perspectives.has(body.perspective as BriefPerspective)?body.perspective as BriefPerspective:"general";
  const sourcePolicy=sourcePolicies.has(body.sourcePolicy as any)?body.sourcePolicy:"verified";
  const freshnessRequirement=freshnessOptions.has(body.freshnessRequirement as any)?body.freshnessRequirement:"current";
  try{
    const context=body.context&&typeof body.context==="object"?body.context as BriefContextSnapshot:undefined;
    const requestShape:BriefRequestShape={subject:body.subject.trim().slice(0,200),entityIds:body.entityIds,timeRange:body.timeRange,depth,perspective,sourcePolicy,freshnessRequirement,format:body.format??"web",context};
    const response=await composeBrief(requestShape);
    if(response.result.researchNeeded) void queueResearchRequest(requestShape,response.plan.missingEvidence.join("; ")||"Coverage gap",response.plan.resolvedEntityIds);
    if(response.result.context) response.result.context=await persistConversationTurn(request,requestShape,response.result,response.result.context);
    const personal=await recordBriefRead(request,response.result.subject,response.result.knowledgeCutoff,response.result.keyChanges);
    return NextResponse.json({...response,personal},{headers:{"cache-control":"no-store"}});
  }catch(error){
    return NextResponse.json({error:"Brief engine unavailable",detail:process.env.NODE_ENV==="development"?(error instanceof Error?error.message:String(error)):undefined},{status:503});
  }
}

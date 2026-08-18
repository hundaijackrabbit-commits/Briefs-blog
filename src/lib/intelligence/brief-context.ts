import type { BriefContextSnapshot, BriefRequest, BriefResult } from "@/lib/types";

const referential=/\b(it|its|they|their|them|that|this|those|these|company|stock|share|same|again|what about|how about|and what|why)\b/i;

export function contextualizeRequest(request:BriefRequest):BriefRequest{
  const context=request.context;
  if(!context?.rootSubject||!referential.test(request.subject)) return request;
  const root=context.rootSubject.trim().slice(0,160);
  return {...request,subject:`${root} — follow-up: ${request.subject}`.slice(0,200),entityIds:request.entityIds?.length?request.entityIds:context.entityHints};
}

export function nextBriefContext(request:BriefRequest,result:BriefResult):BriefContextSnapshot{
  const previous=request.context;
  return {
    conversationId:previous?.conversationId,
    rootSubject:previous?.rootSubject||result.subject||request.subject,
    priorQueries:[...(previous?.priorQueries||[]),request.subject].slice(-8),
    entityHints:previous?.entityHints||[],
    claimIds:result.claimIds.slice(0,24),
    sourceIds:result.evidenceIds.slice(0,24),
    sourceHints:result.sources.slice(0,16),
    factHints:result.keyFacts.slice(0,12).map(f=>({id:f.claimId,predicate:f.label,value:f.value,text:f.text,sourceIds:f.sourceIds})),
    lastSummary:result.summary.slice(0,2000),
    knowledgeCutoff:result.knowledgeCutoff
  };
}

import type { PublicationAudience,StoryAngle,StoryContract } from "@/lib/publication/types";
import type { ResearchGraph } from "@/lib/research/types";
import { readerContract } from "@/lib/publication/audience";

export function buildStoryContract(graph:ResearchGraph,audience:PublicationAudience,angle:StoryAngle):StoryContract{
  const reader=readerContract(audience);const strongest=angle.claimIds.slice(0,5);const other=graph.findings.filter(f=>!strongest.includes(f.id));
  const counter=other.filter(f=>/conflict|however|but|uncertain|decline|risk|dispute/i.test(`${f.predicate} ${f.statement}`)).slice(0,3).map(f=>f.id);
  const cannotClaim=[
    ...(graph.missingEvidence.length?["Do not present unresolved evidence gaps as settled fact."]:[]),
    ...(graph.plan.freshness==="live"?["Do not imply that current reporting proves causality unless the source establishes it."]:[]),
    "Do not introduce factual assertions that cannot be mapped to the research graph.",
    "Do not imitate source wording or structure."
  ];
  return {angleKey:angle.key,angle:angle.title,thesis:angle.thesis,whyNow:graph.plan.freshness==="live"?`The evidence set is current through ${new Date(graph.knowledgeCutoff).toISOString()}.`:`The angle earns publication through evidence and explanatory value rather than artificial freshness.`,audience,readerOutcome:reader.desiredOutcome,differentiator:`Briefs should connect verified claims into a reader-specific explanation instead of recapping sources one by one.`,strongestClaimIds:strongest,counterClaimIds:counter,cannotClaim};
}

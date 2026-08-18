import type { ResearchGraph } from "@/lib/research/types";
import type { ArticleDraft, ArticleSectionDraft, PublicationAudience } from "@/lib/publication/types";
import { readerContract } from "@/lib/publication/audience";

function sentence(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean ? clean.replace(/[.!?]+$/, "") + "." : "";
}

function simpleClaim(predicate: string, value: string) {
  const p = predicate.replace(/[_-]+/g, " ").trim();
  if (!p) return sentence(value);
  return sentence(`${p.charAt(0).toUpperCase()}${p.slice(1)}: ${value}`);
}

function sectionBody(graph: ResearchGraph, start: number, count: number) {
  return graph.findings.slice(start, start + count)
    .map(f => simpleClaim(f.predicate, f.valueText))
    .filter(Boolean)
    .join(" ");
}

function articleType(graph: ResearchGraph): ArticleDraft["articleType"] {
  if (graph.plan.intent === "current" || graph.plan.freshness === "live") return "briefing";
  if (graph.plan.intent === "history" || graph.plan.intent === "explain") return "explainer";
  return "analysis";
}

function suggestedTitle(graph: ResearchGraph) {
  const subject = graph.canonicalSubject || graph.plan.original;
  if (graph.plan.intent === "current") return `What changed in ${subject} — and what matters now`;
  if (graph.plan.intent === "compare") return `${subject}: the comparison that matters`;
  if (graph.plan.intent === "finance") return `${subject}: the numbers and the story behind them`;
  return `${subject}: the part worth understanding`;
}

function deterministicDraft(graph: ResearchGraph, audience: PublicationAudience, category: string): ArticleDraft {
  const contract = readerContract(audience);
  const top = graph.findings.slice(0, 8);
  const briefBody = sectionBody(graph, 0, Math.min(3, top.length)) ||
    sentence(graph.description) ||
    `Briefs researched ${graph.canonicalSubject}, but the evidence is still too thin for a confident article.`;

  const why = graph.plan.intent === "current"
    ? `For ${contract.label.toLowerCase()}, the useful question is not simply what was published. It is what changed, which parts are well supported, and what would change the conclusion next.`
    : `The point is to give ${contract.label.toLowerCase()} a usable mental model without forcing them through the source material first.`;

  const evidence = graph.sources.slice(0, 6).map(s => `${s.name} (${s.kind}, Tier ${s.tier})`).join("; ");
  const missing = graph.missingEvidence.length
    ? `What remains unresolved: ${graph.missingEvidence.slice(0, 3).join(" ")}`
    : "The current evidence set does not contain a material unresolved gap.";

  const sections: ArticleSectionDraft[] = [
    { key: "brief", heading: "The brief", body: briefBody, claimIds: top.slice(0, 3).map(f => f.id) },
    { key: "evidence", heading: "What we know", body: sectionBody(graph, 3, 5) || briefBody, claimIds: top.slice(3, 8).map(f => f.id) },
    { key: "meaning", heading: "Why it matters", body: why, claimIds: [] },
    { key: "watch", heading: "What to watch", body: missing, claimIds: [] },
    { key: "sources", heading: "How this was researched", body: evidence ? `The evidence set includes ${evidence}.` : "Source coverage is not yet sufficient.", claimIds: [] }
  ];

  return {
    title: suggestedTitle(graph),
    deck: sentence(graph.description).slice(0, 260),
    category,
    audience,
    articleType: articleType(graph),
    sections,
    claimIds: [...new Set(sections.flatMap(s => s.claimIds))],
    generatedBy: "briefs-deterministic"
  };
}

function validExternalDraft(value: unknown): value is ArticleDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<ArticleDraft>;
  return typeof d.title === "string" && typeof d.deck === "string" && Array.isArray(d.sections) &&
    d.sections.every(s => s && typeof s.heading === "string" && typeof s.body === "string" && Array.isArray(s.claimIds));
}

export async function composePublicationArticle(
  graph: ResearchGraph,
  audience: PublicationAudience,
  category: string
): Promise<ArticleDraft> {
  const url = process.env.PUBLICATION_WRITER_URL;
  if (url) {
    try {
      // Only atomic structured claims and the reader contract are sent. Source prose/excerpts are deliberately excluded.
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.PUBLICATION_WRITER_TOKEN ? { authorization: `Bearer ${process.env.PUBLICATION_WRITER_TOKEN}` } : {})
        },
        body: JSON.stringify({
          task: "briefs-publication-draft",
          subject: graph.canonicalSubject,
          intent: graph.plan.intent,
          freshness: graph.plan.freshness,
          reader: readerContract(audience),
          claims: graph.findings.map(f => ({
            id: f.id,
            subject: f.subject,
            predicate: f.predicate,
            value: f.valueText,
            confidence: f.confidence,
            verificationStatus: f.verificationStatus
          })),
          constraints: {
            doNotInventFacts: true,
            eachFactualSectionMustListClaimIds: true,
            doNotQuoteOrImitateSourceWording: true,
            avoidGenericAIStockPhrases: true
          }
        }),
        signal: AbortSignal.timeout(12_000)
      });
      if (response.ok) {
        const candidate = await response.json();
        if (validExternalDraft(candidate)) return { ...candidate, audience, category, generatedBy: "configured-writer" };
      }
    } catch {
      // Safe fallback below.
    }
  }
  return deterministicDraft(graph, audience, category);
}

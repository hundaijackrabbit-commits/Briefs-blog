import type { PublicationAudience, ReaderContract } from "@/lib/publication/types";

const CONTRACTS: Record<PublicationAudience, ReaderContract> = {
  "smart-generalist": {
    key: "smart-generalist",
    label: "Smart general reader",
    assumedKnowledge: "The reader is informed and curious but is not assumed to know specialist jargon.",
    desiredOutcome: "The reader should be able to explain what happened, why it matters, and what remains uncertain.",
    tone: "Knowledgeable friend: calm, precise, curious, never condescending.",
    vocabulary: "Use specialist terms only when they add precision; explain uncommon terms in ordinary language.",
    openingInstruction: "Lead with the thing worth knowing, not a broad scene-setting paragraph."
  },
  executive: {
    key: "executive",
    label: "Executive",
    assumedKnowledge: "The reader understands business basics and is short on time.",
    desiredOutcome: "The reader should understand consequence, decision relevance, timing, and uncertainty.",
    tone: "Concise, decision-oriented, concrete.",
    vocabulary: "Business language is fine; remove ornamental technical detail.",
    openingInstruction: "Lead with the change and the decision consequence."
  },
  investor: {
    key: "investor",
    label: "Investor",
    assumedKnowledge: "The reader understands markets, filings, and basic accounting.",
    desiredOutcome: "The reader should understand the evidence, the market-relevant change, the risks, and what would falsify the thesis.",
    tone: "Analytical, skeptical, numerate.",
    vocabulary: "Financial terminology is allowed, but distinguish reported facts from interpretation.",
    openingInstruction: "Lead with the security-relevant fact or change, not company history."
  },
  developer: {
    key: "developer",
    label: "Developer",
    assumedKnowledge: "The reader is technically fluent and cares about implementation details.",
    desiredOutcome: "The reader should understand what changed technically, why it matters in practice, and where uncertainty remains.",
    tone: "Technical but readable, specific rather than promotional.",
    vocabulary: "Technical language is welcome when it earns its place.",
    openingInstruction: "Lead with the architectural or practical consequence."
  },
  student: {
    key: "student",
    label: "Student",
    assumedKnowledge: "The reader may be encountering the topic for the first time.",
    desiredOutcome: "The reader should leave with a durable mental model and the vocabulary to continue learning.",
    tone: "Clear, energetic, respectful.",
    vocabulary: "Prefer ordinary language and define unavoidable jargon once.",
    openingInstruction: "Lead with a concrete explanation or analogy, then add detail."
  },
  marketer: {
    key: "marketer",
    label: "Marketer",
    assumedKnowledge: "The reader understands audiences, positioning, campaigns, and customer behavior.",
    desiredOutcome: "The reader should understand the audience or market implication and what changes in practice.",
    tone: "Commercially aware without hype.",
    vocabulary: "Use marketing language only where it clarifies audience, channel, positioning, or behavior.",
    openingInstruction: "Lead with the audience or market implication."
  }
};

export function readerContract(key: string | null | undefined): ReaderContract {
  return CONTRACTS[(key || "smart-generalist") as PublicationAudience] || CONTRACTS["smart-generalist"];
}

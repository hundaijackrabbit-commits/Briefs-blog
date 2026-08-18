import type { ArticleDraft,AudienceFitReport,PublicationAudience,ReaderContract } from "@/lib/publication/types";

const CONTRACTS: Record<PublicationAudience, ReaderContract> = {
  "smart-generalist": {
    key: "smart-generalist",label: "Smart general reader",assumedKnowledge: "The reader is informed and curious but is not assumed to know specialist jargon.",desiredOutcome: "The reader should be able to explain what happened, why it matters, and what remains uncertain.",tone: "Knowledgeable friend: calm, precise, curious, never condescending.",vocabulary: "Use specialist terms only when they add precision; explain uncommon terms in ordinary language.",openingInstruction: "Lead with the thing worth knowing, not a broad scene-setting paragraph."
  },
  executive: {
    key: "executive",label: "Executive",assumedKnowledge: "The reader understands business basics and is short on time.",desiredOutcome: "The reader should understand consequence, decision relevance, timing, and uncertainty.",tone: "Concise, decision-oriented, concrete.",vocabulary: "Business language is fine; remove ornamental technical detail.",openingInstruction: "Lead with the change and the decision consequence."
  },
  investor: {
    key: "investor",label: "Investor",assumedKnowledge: "The reader understands markets, filings, and basic accounting.",desiredOutcome: "The reader should understand the evidence, the market-relevant change, the risks, and what would falsify the thesis.",tone: "Analytical, skeptical, numerate.",vocabulary: "Financial terminology is allowed, but distinguish reported facts from interpretation.",openingInstruction: "Lead with the security-relevant fact or change, not company history."
  },
  developer: {
    key: "developer",label: "Developer",assumedKnowledge: "The reader is technically fluent and cares about implementation details.",desiredOutcome: "The reader should understand what changed technically, why it matters in practice, and where uncertainty remains.",tone: "Technical but readable, specific rather than promotional.",vocabulary: "Technical language is welcome when it earns its place.",openingInstruction: "Lead with the architectural or practical consequence."
  },
  student: {
    key: "student",label: "Student",assumedKnowledge: "The reader may be encountering the topic for the first time.",desiredOutcome: "The reader should leave with a durable mental model and the vocabulary to continue learning.",tone: "Clear, energetic, respectful.",vocabulary: "Prefer ordinary language and define unavoidable jargon once.",openingInstruction: "Lead with a concrete explanation or analogy, then add detail."
  },
  marketer: {
    key: "marketer",label: "Marketer",assumedKnowledge: "The reader understands audiences, positioning, campaigns, and customer behavior.",desiredOutcome: "The reader should understand the audience or market implication and what changes in practice.",tone: "Commercially aware without hype.",vocabulary: "Use marketing language only where it clarifies audience, channel, positioning, or behavior.",openingInstruction: "Lead with the audience or market implication."
  }
};

export function readerContract(key: string | null | undefined): ReaderContract {
  return CONTRACTS[(key || "smart-generalist") as PublicationAudience] || CONTRACTS["smart-generalist"];
}

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}
function terms(audience:PublicationAudience){return audience==="investor"?["revenue","earnings","margin","guidance","risk","valuation","expectation","cash","growth"]:audience==="executive"?["decision","risk","timing","impact","cost","strategy","priority","trade-off"]:audience==="developer"?["implementation","architecture","api","performance","latency","security","model","constraint"]:audience==="marketer"?["audience","customer","market","positioning","demand","channel","behavior","brand"]:audience==="student"?["means","because","example","think of","in other words","why","how"]:["matters","means","change","evidence","uncertain","because"];
}

export function evaluateAudienceFit(draft:ArticleDraft):AudienceFitReport{
  const contract=readerContract(draft.audience);const text=[draft.title,draft.deck,...draft.sections.map(s=>s.body)].join(" ").toLowerCase();const opening=(draft.sections[0]?.body||draft.deck||"").toLowerCase();const signals=terms(draft.audience).filter(t=>text.includes(t)).length;
  const audienceSpecific=draft.audience==="smart-generalist"?82:clamp(62+signals*7);
  const goalScore=clamp(audienceSpecific+(text.includes("why")||text.includes("matters")?6:0)+(text.includes("uncertain")||text.includes("unknown")||text.includes("evidence")?6:0));
  const expertiseScore=clamp(92-(draft.audience==="student"?(text.match(/\b(?:ebitda|api|sdk|latency|basis points|multiple|throughput)\b/g)||[]).length*7:0));
  const openingScore=clamp(94-(opening.startsWith("in today's")||opening.startsWith("in the world of")?35:0)-(opening.split(/\s+/).slice(0,35).join(" ").includes("has become increasingly")?20:0));
  const jargonHits=(text.match(/\b(?:utilize|paradigm|synergy|transformative|multifaceted|leveraging|ecosystem|landscape)\b/g)||[]).length;const jargonScore=clamp(100-jargonHits*(draft.audience==="student"||draft.audience==="smart-generalist"?10:5));
  const score=clamp(goalScore*.34+expertiseScore*.23+openingScore*.25+jargonScore*.18);const warnings:string[]=[];if(signals===0&&draft.audience!=="smart-generalist")warnings.push(`The draft does not yet sound meaningfully tailored to a ${contract.label.toLowerCase()}.`);if(openingScore<80)warnings.push("Opening spends too much time setting the scene instead of delivering value.");if(expertiseScore<80)warnings.push("Vocabulary is too specialist for the selected audience.");if(jargonScore<80)warnings.push("Generic business/AI jargon is weakening audience clarity.");
  return {score,goalScore,expertiseScore,openingScore,jargonScore,warnings};
}

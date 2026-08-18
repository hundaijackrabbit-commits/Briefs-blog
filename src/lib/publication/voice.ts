import type { VoiceContract } from "@/lib/publication/types";

export const BRIEFS_VOICE: VoiceContract = {
  key: "briefs",
  description: "Well-read, calm, curious, concise, occasionally witty, and comfortable saying what is not known yet.",
  bannedPhrases: [
    "in today's rapidly evolving landscape",
    "it is important to note",
    "this underscores the importance of",
    "delve into",
    "furthermore",
    "ultimately",
    "only time will tell",
    "game-changer",
    "revolutionary landscape",
    "a testament to"
  ],
  principles: [
    "Write to a specific reader, not to the internet in general.",
    "Prefer concrete nouns and precise verbs.",
    "Vary sentence length and paragraph rhythm.",
    "Separate fact, inference, and opinion.",
    "Do not restate the headline as an introduction.",
    "Use uncertainty directly instead of vague hedging.",
    "Do not manufacture a conclusion when the evidence is mixed."
  ]
};

function countSentences(text: string) {
  return Math.max(1, text.split(/[.!?]+/).map(x => x.trim()).filter(Boolean).length);
}

export function evaluateVoice(text: string) {
  const lower = text.toLowerCase();
  const violations = BRIEFS_VOICE.bannedPhrases.filter(phrase => lower.includes(phrase));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = countSentences(text);
  const avgSentenceWords = words.length / sentences;
  const paragraphStarts = text.split(/\n+/).map(x => x.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase()).filter(Boolean);
  const repeatedStarts = paragraphStarts.length - new Set(paragraphStarts).size;
  let score = 100 - violations.length * 12 - Math.min(20, repeatedStarts * 5);
  if (avgSentenceWords > 28) score -= 12;
  if (avgSentenceWords < 7) score -= 8;
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    warnings: [
      ...violations.map(v => `Avoid stock phrase: "${v}"`),
      ...(avgSentenceWords > 28 ? ["Sentence rhythm is too dense."] : []),
      ...(repeatedStarts > 1 ? ["Several paragraphs begin the same way."] : [])
    ]
  };
}

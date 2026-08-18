import type { VoiceContract } from "@/lib/publication/types";

export const BRIEFS_VOICE: VoiceContract = {
  key: "briefs",version:"2.0",description: "Well-read, calm, curious, concise, occasionally witty, and comfortable saying what is not known yet.",
  bannedPhrases: ["in today's rapidly evolving landscape","it is important to note","this underscores the importance of","delve into","furthermore","ultimately","only time will tell","game-changer","revolutionary landscape","a testament to","in the ever-evolving","at the end of the day","this is not just","more than just","stands as a beacon","a myriad of","navigate the complexities","in conclusion"],
  principles: ["Write to a specific reader, not to the internet in general.","Prefer concrete nouns and precise verbs.","Vary sentence length and paragraph rhythm.","Separate fact, inference, and opinion.","Do not restate the headline as an introduction.","Use uncertainty directly instead of vague hedging.","Do not manufacture a conclusion when the evidence is mixed.","One sharp observation is worth more than three generic summary sentences.","Avoid repeating the same headline formula across the publication."]
};

function sentences(text:string){return text.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);}
function words(text:string){return text.trim().split(/\s+/).filter(Boolean);}
function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}

export function editorialFingerprint(text:string){
  const s=sentences(text);const lengths=s.map(x=>words(x).length);const avg=lengths.length?lengths.reduce((a,b)=>a+b,0)/lengths.length:0;const variance=lengths.length?lengths.reduce((sum,n)=>sum+(n-avg)**2,0)/lengths.length:0;const starts=s.map(x=>words(x).slice(0,3).join(" ").toLowerCase());return {averageSentenceWords:avg,sentenceVariance:variance,uniqueStarts:new Set(starts).size,sentenceCount:s.length};
}

export function evaluateVoice(text: string) {
  const lower=text.toLowerCase();const violations=BRIEFS_VOICE.bannedPhrases.filter(phrase=>lower.includes(phrase));const fp=editorialFingerprint(text);const paragraphs=text.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);const starts=paragraphs.map(x=>words(x).slice(0,4).join(" ").toLowerCase());const repeatedStarts=starts.length-new Set(starts).size;const colonHeadlines=(text.match(/\b[A-Z][^.!?\n]{2,40}:\s/g)||[]).length;const weakVerbs=(lower.match(/\b(is|are|was|were|has been|have been)\b/g)||[]).length;const wordCount=words(text).length;
  let score=100-violations.length*11-Math.min(18,repeatedStarts*5);if(fp.averageSentenceWords>27)score-=12;if(fp.averageSentenceWords<7&&fp.sentenceCount>4)score-=7;if(fp.sentenceCount>5&&fp.sentenceVariance<10)score-=10;if(colonHeadlines>4)score-=7;if(wordCount>120&&weakVerbs/Math.max(1,fp.sentenceCount)>2.4)score-=6;
  const warnings=[...violations.map(v=>`Avoid stock phrase: "${v}"`),...(fp.averageSentenceWords>27?["Sentence rhythm is too dense."]:[]),...(fp.sentenceCount>5&&fp.sentenceVariance<10?["Sentence lengths are too uniform; the prose has a generated cadence."]:[]),...(repeatedStarts>1?["Several paragraphs begin the same way."]:[]),...(colonHeadlines>4?["Too many label-colon constructions make the article read like extracted data."]:[]),...(wordCount>120&&weakVerbs/Math.max(1,fp.sentenceCount)>2.4?["Use more precise verbs; the prose relies heavily on static constructions."]:[])];
  return {score:clamp(score),warnings,fingerprint:fp,version:BRIEFS_VOICE.version};
}

import type { SemanticFrame } from "@/lib/types";

const DATE_RE=/\b(?:19|20)\d{2}(?:-\d{2}-\d{2})?|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi;
const QUANTITY_RE=/\b(?:[$€£]\s?)?\d[\d,.]*(?:\.\d+)?\s?(?:%|percent|million|billion|trillion|m|bn|k)?\b/gi;
const NEGATION_RE=/\b(no|not|never|without|denies|denied|unlikely)\b/i;
const ACTIONS=["acquire","acquires","acquired","launch","launches","launched","appoint","appointed","resign","resigned","report","reported","raise","raised","cut","cuts","expand","expanded","delay","delayed","approve","approved","ban","banned"];

export function semanticFrame(text:string):SemanticFrame{
  const clean=text.replace(/\s+/g," ").trim();
  const lower=clean.toLowerCase();
  const action=ACTIONS.find(a=>lower.includes(` ${a} `) || lower.startsWith(`${a} `)) ?? null;
  const temporalHints:SemanticFrame["temporalHints"]=[];
  for(const [kind,re] of [["before",/\bbefore\s+([^.,;]+)/i],["after",/\bafter\s+([^.,;]+)/i],["during",/\bduring\s+([^.,;]+)/i],["current",/\b(currently|now|today)\b/i]] as const){
    const m=clean.match(re); if(m) temporalHints.push({kind,value:m[1]||m[0]});
  }
  return {entities:[],concepts:[],dates:clean.match(DATE_RE)||[],quantities:clean.match(QUANTITY_RE)||[],action,negated:NEGATION_RE.test(clean),temporalHints};
}

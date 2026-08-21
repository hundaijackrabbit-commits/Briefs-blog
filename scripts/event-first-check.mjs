import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const writer=read("src/lib/publication/writer.ts");
const angles=read("src/lib/publication/angles.ts");
const quality=read("src/lib/publication/quality.ts");
const originality=read("src/lib/publication/originality.ts");
const systems=read("SYSTEMS.md");
const checks=[
  [writer.includes('from "@/lib/publication/event-first-prose"'),"writer imports event-first prose helpers"],
  [writer.includes("eventFirstSentence(f,graph)"),"generic reporting findings try event-first factual synthesis before scaffolding fallback"],
  [writer.includes("eventFirstDeck(opening,evidence)"),"deterministic deck is built from reader-facing event prose"],
  [writer.includes("eventFirstHeadline(graph)"),"deterministic headline has an event-first preflight"],
  [writer.includes("eventSpecificMeaning(category,proseSubjectValue,allEvidence)"),"deterministic meaning can use event-specific interpretation"],
  [writer.includes("eventSpecificWatch(category,proseSubjectValue,allEvidence)"),"deterministic watch can use event-specific observations"],
  [writer.includes("bridges:eventBridge?[eventBridge]:[]"),"writer no longer inserts multiple generic stock bridges"],
  [angles.includes("canUseConnectionAngle(first.predicate,second.predicate)"),"connection angle requires distinct substantive predicates"],
  [angles.includes("canUseStrongestFactAngle(first.predicate)"),"strongest-fact angle rejects generic reporting predicates"],
  [angles.includes('currentChangeThesis(subject,first?.predicate||"")'),"current-event thesis avoids generic predicate tautologies"],
  [quality.includes("evaluateReaderFacingProseIntegrity(draft,graph)"),"reader-facing prose gate remains active"],
  [quality.includes("if(nonMethodWords<160)"),"160-word reader-ready gate remains unchanged"],
  [originality.includes("const hardExact=longestMatchingWords>=14"),"14-word originality hard gate remains unchanged"],
  [systems.includes("Event-First Deterministic Writer Repair"),"systems ledger records event-first writer repair"],
  [systems.includes("Angle Degeneracy Guard"),"systems ledger records angle degeneracy guard"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Event-first writer architecture check passed (${checks.length} checks).`);


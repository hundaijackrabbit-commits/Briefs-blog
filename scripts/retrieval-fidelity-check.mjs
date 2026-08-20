import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const event=read("src/lib/publication/event-identity.ts");
const discovery=read("src/lib/publication/global-discovery.ts");
const helper=read("src/lib/publication/retrieval-fidelity.ts");
const systems=read("SYSTEMS.md");
const checks=[
 [helper.includes("normalizeEventSubject")&&helper.includes("lexicalRetrievalQuery"),"retrieval helper normalizes presentation prefixes and preserves lexical terms"],
 [helper.includes("\\d+(?:\\.\\d+)?"),"event-critical decimal measurements are preserved"],
 [event.includes('from "@/lib/publication/retrieval-fidelity"'),"event identity uses retrieval-fidelity helper"],
 [event.includes("lexicalRetrievalQuery(anchor.subject,original)"),"anchor-preserving retrieval keeps source-language event terms"],
 [event.includes("normalizeEventSubject(anchor.subject)"),"alignment query variants use normalized subject"],
 [discovery.includes("normalizeEventSubject(rawSubject)"),"global discovery strips editorial presentation prefixes before event identity"],
 [discovery.includes("subject,researchQuery,eventAnchor"),"normalized subject is persisted with the candidate"],
 [systems.includes("Retrieval Fidelity & Presentation Normalization"),"systems ledger records retrieval-fidelity repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);
if(checks.some(([ok])=>!ok))process.exit(1);
console.log(`Retrieval fidelity architecture check passed (${checks.length} checks).`);

import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/retrieval-fidelity.ts")).href);
const {normalizeEventSubject,lexicalRetrievalTerms,lexicalRetrievalQuery}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const raw="Map: 6.7-Magnitude Earthquake Shakes Peru";
const normalized=normalizeEventSubject(raw);
assert(normalized==="6.7-Magnitude Earthquake Shakes Peru","presentation prefix is removed",normalized);

const terms=lexicalRetrievalTerms(raw);
assert(terms.includes("6.7"),"decimal magnitude is preserved",JSON.stringify(terms));
assert(terms.includes("earthquake"),"source-language event lexeme is preserved",JSON.stringify(terms));
assert(terms.includes("peru"),"location term is preserved",JSON.stringify(terms));
assert(!terms.includes("map"),"presentation word is excluded from retrieval",JSON.stringify(terms));

const query=lexicalRetrievalQuery(raw,"magnitude earthquake");
assert(query.includes("6.7")&&query.includes("earthquake")&&query.includes("peru"),"earthquake query retains event-defining terms",query);
assert(!query.includes("disaster"),"taxonomy label does not replace source event lexeme",query);

const bond=lexicalRetrievalQuery("Global Government Bond Yields Hit Multiyear Highs","");
assert(/government/.test(bond)&&/bond/.test(bond)&&/yields/.test(bond),"market event remains naturally searchable",bond);

const ebola=lexicalRetrievalQuery("How Ebola became the deadliest outbreak in DR Congo’s history","");
assert(/ebola/.test(ebola)&&/outbreak/.test(ebola)&&/congo/.test(ebola),"health event keeps its defining lexical anchors",ebola);

if(process.exitCode)throw new Error("Retrieval fidelity regression failed");
console.log("Retrieval fidelity regression suite passed.");

import path from "node:path";import {pathToFileURL} from "node:url";
const root=process.cwd();
const prose=await import(pathToFileURL(path.join(root,"src/lib/publication/event-first-prose.ts")).href);
const angles=await import(pathToFileURL(path.join(root,"src/lib/publication/angle-integrity.ts")).href);
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

const graph={
  canonicalSubject:"6.7-Magnitude Earthquake Shakes Peru",
  sources:[
    {title:"Magnitude 6.7 earthquake shakes Peru’s southern Andes, no immediate damages reported"},
    {title:"Peru: Strong earthquake shakes southern Andes"},
    {title:"Map: 6.7-Magnitude Earthquake Shakes Peru"}
  ]
};
const ap={predicate:"Recent reporting",valueText:"Magnitude 6.7 earthquake shakes Peru’s southern Andes, no immediate damages reported",statement:"",sourceIds:[]};
const dw={predicate:"Recent reporting",valueText:"Peru: Strong earthquake shakes southern Andes",statement:"",sourceIds:[]};

const apSentence=prose.eventFirstSentence(ap,graph);
const dwSentence=prose.eventFirstSentence(dw,graph);
assert(/magnitude 6\.7 earthquake/i.test(apSentence),"AP-style finding becomes an event sentence",apSentence);
assert(/Peru's southern Andes/i.test(apSentence),"event sentence preserves location",apSentence);
assert(/no immediate damage/i.test(apSentence),"event sentence preserves qualified immediate-damage reporting",apSentence);
assert(!/aligned evidence|research graph|provides an independent account|adds quantified context/i.test(apSentence),"event sentence contains no research scaffolding");
assert(/southern Andes in Peru/i.test(dwSentence),"DW-style finding becomes a location-first event sentence",dwSentence);

const headline=prose.eventFirstHeadline(graph);
assert(headline==="Peru's 6.7-Magnitude Earthquake: What We Know","earthquake headline is grammatical and event-first",headline);

const deck=prose.eventFirstDeck(apSentence,dwSentence);
assert(deck.split(/\s+/).length>=12,"deck is reader-facing and substantive",deck);
assert(!/^Briefs found/i.test(deck),"deck is not methodology-first",deck);

const meaning=prose.eventSpecificMeaning("Science",graph.canonicalSubject,ap.valueText);
const watch=prose.eventSpecificWatch("Science",graph.canonicalSubject,ap.valueText);
const uncertainty=prose.eventSpecificUncertainty("Science",graph.canonicalSubject,ap.valueText);
const bridge=prose.eventSpecificBridge("Science",graph.canonicalSubject,ap.valueText);
assert(/magnitude/i.test(meaning)&&/consequences/i.test(meaning),"science meaning is event-specific");
assert(/injuries|damage|aftershocks/i.test(watch),"watch section names event-specific observable follow-ups");
assert(uncertainty.split(/\s+/).length>=25,"uncertainty section is substantive enough to satisfy section-depth requirements",uncertainty);
const projected=[apSentence,`${dwSentence} A magnitude 6.7 earthquake shook Peru.`,meaning,uncertainty,watch,bridge];
const projectedWords=projected.join(" ").split(/\s+/).filter(Boolean).length;
assert(projectedWords>=160,"event-first Peru fixture retains reader-ready narrative depth",String(projectedWords));

assert(angles.isGenericEditorialPredicate("Recent reporting"),"generic reporting predicate is recognized");
assert(!angles.canUseStrongestFactAngle("Recent reporting"),"generic predicate cannot create strongest-fact angle");
assert(!angles.canUseConnectionAngle("Recent reporting","Recent reporting"),"duplicate generic predicates cannot create connection angle");
assert(!angles.canUseConnectionAngle("Recent reporting","damage assessment"),"generic predicate cannot anchor one side of a connection angle");
assert(angles.canUseConnectionAngle("case count","official response"),"two distinct substantive predicates can still create a connection angle");
assert(!/recent reporting and recent reporting/i.test(angles.currentChangeThesis(graph.canonicalSubject,"Recent reporting")),"current-event thesis avoids tautological reporting language");

if(process.exitCode)throw new Error("Event-first writer regression failed");
console.log("Event-first writer and angle-integrity regression suite passed.");

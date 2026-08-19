import fs from "node:fs";import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const subject=read("src/lib/publication/subject-alignment.ts"),event=read("src/lib/publication/event-identity.ts"),quality=read("src/lib/publication/quality.ts"),writer=read("src/lib/publication/writer.ts"),synth=read("src/lib/publication/writer-synthesis.ts"),systems=read("SYSTEMS.md");
const checks=[
[subject.includes("finding.subject is deliberately excluded")&&!subject.includes("`${f.subject} ${f.predicate}"),"source alignment cannot self-validate from assigned finding.subject"],
[subject.includes("rawAnchorSupport")&&subject.includes("rawSourceText(source)"),"aligned sources require support in their own title/excerpt evidence"],
[subject.includes("eventhoodScore")&&subject.includes("editorial framing cannot substitute"),"alignment has an eventhood gate"],
[event.includes("pairwiseClusterCoherence")&&event.includes("anchorScore*multiplier"),"cluster coherence includes pairwise veto/penalty"],
[quality.includes("evidenceDepthIssues")&&quality.includes("empty-evidence placeholder"),"quality gate blocks empty evidence sections"],
[quality.includes("at least 2 claim-backed factual sections"),"quality gate requires distributed factual grounding"],
[writer.includes("openingCount=strongest.length>=3?2")&&writer.includes('purpose:"evidence"'),"deterministic writer reserves grounded claims for evidence section"],
[!synth.includes("rather than a different event"),"writer no longer emits defensive mismatch language"],
[systems.includes("Raw Evidence Alignment & Evidence Depth Repair"),"systems ledger records evidence-integrity repair"]
];
for(const [ok,label] of checks)console.log(ok?"PASS":"FAIL",label);if(checks.some(([ok])=>!ok))process.exit(1);console.log(`Evidence-integrity architecture check passed (${checks.length} checks).`);

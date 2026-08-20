const STOP=new Set("the a an and or but for with from into over after before amid as at by to of in on is are was were be been being it its this that these those new latest update updates says say said report reports world global today yesterday tomorrow live more most less than about could would should will may might has have had not no yes their his her our your who what why how when where which one two three first last major key top inside easy miss recent reporting".split(" "));
const PRESENTATION=new Set("map analysis explainer exclusive video watch photos photo timeline briefing opinion commentary recap guide live updates update".split(" "));
const PREFIX=/^(?:(?:map|analysis|explainer|exclusive|video|watch|photos?|timeline|briefing|opinion|commentary|recap|guide|live(?: updates?)?|updates?|what to know|what we know)\s*:\s*)+/i;

function unique<T>(items:T[]){return [...new Set(items)];}

export function normalizeEventSubject(value:string){
  const original=String(value||"").replace(/\s+/g," ").trim();
  const cleaned=original.replace(PREFIX,"").replace(/\s+/g," ").trim();
  return cleaned||original;
}

export function lexicalRetrievalTerms(value:string,limit=7){
  const subject=normalizeEventSubject(value).toLowerCase().replace(/[’']/g,"");
  const raw=subject.match(/\b\d+(?:\.\d+)?\b|[a-z][a-z0-9]*(?:-[a-z0-9]+)*/g)||[];
  const out:string[]=[];
  for(const token of raw){
    const normalized=token.replace(/^-+|-+$/g,"");
    const numeric=/^\d+(?:\.\d+)?$/.test(normalized);
    if(!numeric&&(normalized.length<3||STOP.has(normalized)||PRESENTATION.has(normalized)))continue;
    if(!out.includes(normalized))out.push(normalized);
    if(out.length>=Math.max(1,limit))break;
  }
  return out;
}

export function lexicalRetrievalQuery(subject:string,original=""){
  const subjectTerms=lexicalRetrievalTerms(subject,7);
  const originalTerms=lexicalRetrievalTerms(original,7);
  const terms=unique([...subjectTerms,...originalTerms]).slice(0,7);
  return terms.join(" ").trim()||normalizeEventSubject(subject)||String(original||"").trim();
}

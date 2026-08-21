import type { ResearchFinding,ResearchGraph } from "@/lib/research/types";

function clean(value:string){
  return String(value||"").replace(/[’]/g,"'").replace(/\s+/g," ").trim();
}
function stripPrefix(value:string){
  return clean(value).replace(/^(?:map|live|breaking|explainer)\s*:\s*/i,"").trim();
}
function stripOutletSuffix(value:string){
  return stripPrefix(value).replace(/\s+[|–—-]\s+[^|–—-]{2,60}$/,"").trim();
}
function sentence(value:string){
  const s=clean(value).replace(/[.!?]+$/,"");
  return s?`${s}.`:"";
}
function words(value:string){return clean(value).split(/\s+/).filter(Boolean).length;}

export function isGenericReportingFinding(f:Pick<ResearchFinding,"predicate">){
  return /^(recent reporting|external context)$/i.test(clean(f.predicate));
}

function quakeFromTitle(raw:string){
  const value=stripOutletSuffix(raw);
  let m=value.match(/^Magnitude\s+(\d+(?:\.\d+)?)\s+earthquake\s+(?:shakes?|strikes?|hits?)\s+(.+?)(?:,\s*(.+))?$/i);
  if(m){
    const magnitude=m[1],place=clean(m[2]),tail=clean(m[3]||"");
    let out=`A magnitude ${magnitude} earthquake shook ${place}`;
    if(/no immediate damages? reported/i.test(tail))out+=`; early reporting said no immediate damage was reported`;
    return sentence(out);
  }
  m=value.match(/^(\d+(?:\.\d+)?)[- ]Magnitude\s+Earthquake\s+(?:Shakes?|Strikes?|Hits?)\s+(.+)$/i);
  if(m)return sentence(`A magnitude ${m[1]} earthquake shook ${clean(m[2])}`);
  m=value.match(/^([^:]{2,40}):\s*(Strong\s+)?earthquake\s+(?:shakes?|strikes?|hits?)\s+(.+)$/i);
  if(m){
    const lead=clean(m[1]),strength=Boolean(m[2]),place=clean(m[3]);
    if(place.toLowerCase().includes(lead.toLowerCase()))return sentence(`A ${strength?"strong ":""}earthquake shook ${place}`);
    return sentence(`A ${strength?"strong ":""}earthquake shook ${place} in ${lead}`);
  }
  m=value.match(/^(Strong\s+)?earthquake\s+(?:shakes?|strikes?|hits?)\s+(.+)$/i);
  if(m)return sentence(`A ${m[1]?"strong ":""}earthquake shook ${clean(m[2])}`);
  return "";
}

function quakeHeadline(subject:string){
  const s=stripPrefix(subject);
  let m=s.match(/^(\d+(?:\.\d+)?)[- ]Magnitude\s+Earthquake\s+(?:Shakes?|Strikes?|Hits?)\s+(.+)$/i);
  if(m){
    const place=clean(m[2]).replace(/^the\s+/i,"");
    return `${place}'s ${m[1]}-Magnitude Earthquake: What We Know`;
  }
  m=s.match(/^Magnitude\s+(\d+(?:\.\d+)?)\s+Earthquake\s+(?:Shakes?|Strikes?|Hits?)\s+(.+)$/i);
  if(m){
    const place=clean(m[2]).replace(/^the\s+/i,"");
    return `${place}'s ${m[1]}-Magnitude Earthquake: What We Know`;
  }
  return "";
}

export function eventFirstSentence(f:ResearchFinding,graph:ResearchGraph){
  const raw=clean(f.valueText||f.statement||"");
  const subject=`${graph.canonicalSubject} ${raw}`;
  if(/\bearthquake\b/i.test(subject)){
    const quake=quakeFromTitle(raw);
    if(quake)return quake;
  }
  return "";
}

export function eventFirstHeadline(graph:ResearchGraph){
  if(/\bearthquake\b/i.test(graph.canonicalSubject)){
    const fromSubject=quakeHeadline(graph.canonicalSubject);
    if(fromSubject)return fromSubject;
    for(const source of graph.sources){
      const fromSource=quakeHeadline(source.title);
      if(fromSource)return fromSource;
    }
  }
  return "";
}

export function eventFirstDeck(opening:string,evidence:string){
  const pool=[opening,evidence].map(clean).filter(Boolean);
  if(!pool.length)return "";
  const first=pool[0].split(/(?<=[.!?])\s+/)[0]||pool[0];
  if(words(first)>=12)return first.slice(0,280);
  const second=(pool[1]||pool[0]).split(/(?<=[.!?])\s+/)[0]||"";
  return clean(`${first} ${second}`).slice(0,280);
}

export function eventSpecificMeaning(category:string,subject:string,evidenceText:string){
  const all=`${category} ${subject} ${evidenceText}`;
  if(/\bearthquake\b/i.test(all)){
    return "Magnitude establishes the size of the seismic event, but it does not by itself establish the severity of its consequences. The useful distinction is between the quake that was observed and damage, injuries, disruption, or other effects that still require direct reporting. That keeps the briefing focused on what has actually been verified rather than extrapolating from the magnitude alone.";
  }
  return "";
}

export function eventSpecificWatch(category:string,subject:string,evidenceText:string){
  const all=`${category} ${subject} ${evidenceText}`;
  if(/\bearthquake\b/i.test(all)){
    return "The next useful evidence is concrete reporting on injuries, infrastructure damage, transport or utility disruption, aftershocks, and official seismic assessments. Any verified change in those observations would materially change the briefing; until then, the earthquake itself should remain separate from claims about a broader disaster.";
  }
  return "";
}

export function eventSpecificUncertainty(category:string,subject:string,evidenceText:string){
  const all=`${category} ${subject} ${evidenceText}`;
  if(/\bearthquake\b/i.test(all)){
    return "Early reporting did not yet establish the full extent of damage, injuries, infrastructure disruption, or secondary effects. The immediate seismic event is therefore better established than the scale of its consequences on the ground.";
  }
  return "";
}

export function eventSpecificBridge(category:string,subject:string,evidenceText:string){
  const all=`${category} ${subject} ${evidenceText}`;
  if(/\bearthquake\b/i.test(all)){
    return "For an earthquake, magnitude and observed consequences are separate pieces of evidence, so later damage assessments matter more than speculation from the number alone.";
  }
  return "";
}

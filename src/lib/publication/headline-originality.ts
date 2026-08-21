const HEADLINE_REPAIR_WORDS=11;

function normalizeWords(value:string){
  return String(value||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim().split(" ").filter(Boolean);
}

export function longestExactWordRun(a:string,b:string,cap=36){
  const A=normalizeWords(a),B=normalizeWords(b);
  if(!A.length||!B.length)return 0;
  const index=new Map<string,number[]>();
  B.forEach((word,i)=>index.set(word,[...(index.get(word)||[]),i]));
  let best=0;
  for(let i=0;i<A.length;i++){
    for(const j of index.get(A[i])||[]){
      let k=0;
      while(k<cap&&i+k<A.length&&j+k<B.length&&A[i+k]===B[j+k])k++;
      if(k>best)best=k;
      if(best>=cap)break;
    }
  }
  return best;
}

function maxSourceRun(title:string,sourceTitles:string[]){
  return sourceTitles.reduce((max,source)=>Math.max(max,longestExactWordRun(title,source)),0);
}

function capitalize(value:string){
  const text=String(value||"").trim();
  return text?text.charAt(0).toUpperCase()+text.slice(1):text;
}

function reframeSubject(subject:string){
  const clean=String(subject||"").replace(/\s+/g," ").trim();
  const connectors=[" as "," after "," amid "," while "," following "," because "," when "," before "," during "];
  const lower=clean.toLowerCase();
  for(const connector of connectors){
    const at=lower.indexOf(connector);
    if(at>8&&at<clean.length-connector.length-8){
      const left=clean.slice(0,at).trim();
      const right=clean.slice(at+connector.length).trim();
      return `${capitalize(right)}: ${left}`;
    }
  }
  const colon=clean.indexOf(":");
  if(colon>8&&colon<clean.length-8){
    return `${capitalize(clean.slice(colon+1))}: ${clean.slice(0,colon).trim()}`;
  }
  const words=clean.split(/\s+/).filter(Boolean);
  if(words.length>=HEADLINE_REPAIR_WORDS){
    const first=words.slice(0,6).join(" ");
    const last=words.slice(-6).join(" ");
    return `${first} — ${last}`;
  }
  return clean;
}

/**
 * Reader-facing prose must not blindly interpolate a canonical subject when that
 * subject is itself shaped like a source headline. This helper preserves the
 * event but breaks long contiguous source-title runs before prose synthesis.
 */
export function originalitySafeSubject(candidate:string,sourceTitles:string[]){
  const clean=String(candidate||"").replace(/\s+/g," ").trim();
  const sources=sourceTitles.filter(Boolean);
  if(maxSourceRun(clean,sources)<HEADLINE_REPAIR_WORDS)return clean;

  const reframed=reframeSubject(clean);
  if(maxSourceRun(reframed,sources)<HEADLINE_REPAIR_WORDS)return reframed;

  const words=clean.split(/\s+/).filter(Boolean);
  if(words.length<=8)return clean;
  const compact=`${words.slice(0,4).join(" ")} — ${words.slice(-4).join(" ")}`;
  return compact;
}

export function originalitySafeHeadline(candidate:string,canonicalSubject:string,sourceTitles:string[]){
  const clean=String(candidate||"").replace(/\s+/g," ").trim();
  const sources=sourceTitles.filter(Boolean);
  if(maxSourceRun(clean,sources)<HEADLINE_REPAIR_WORDS)return clean;

  const reframed=reframeSubject(canonicalSubject);
  const options=[
    `What changed: ${reframed}`,
    `Why it matters: ${reframed}`,
    `Briefing: ${reframed}`
  ];
  for(const option of options){
    if(maxSourceRun(option,sources)<HEADLINE_REPAIR_WORDS)return option;
  }

  // Final bounded fallback: keep event-defining ends of the subject, never the full source-headline run.
  const words=String(canonicalSubject||"").replace(/\s+/g," ").trim().split(/\s+/).filter(Boolean);
  const compact=words.length>8?`${words.slice(0,4).join(" ")} — ${words.slice(-4).join(" ")}`:canonicalSubject;
  return `Briefing: ${compact}`.trim();
}

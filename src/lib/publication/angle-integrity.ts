function clean(value:string){return String(value||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim().toLowerCase();}

export function isGenericEditorialPredicate(value:string){
  return /^(recent reporting|external context|reporting|update|latest update|news)$/i.test(clean(value));
}

export function canUseStrongestFactAngle(predicate:string){
  const p=clean(predicate);
  return Boolean(p)&&!isGenericEditorialPredicate(p);
}

export function canUseConnectionAngle(firstPredicate:string,secondPredicate:string){
  const a=clean(firstPredicate),b=clean(secondPredicate);
  return Boolean(a&&b&&a!==b&&!isGenericEditorialPredicate(a)&&!isGenericEditorialPredicate(b));
}

export function currentChangeThesis(subject:string,predicate:string){
  const p=clean(predicate);
  if(p&&!isGenericEditorialPredicate(p))return `The most defensible way to understand the latest ${subject} update starts with ${p}.`;
  return `The strongest supported account of ${subject} should lead with the event itself, then separate verified consequences from what remains uncertain.`;
}

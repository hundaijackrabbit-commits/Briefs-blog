import type { ResearchSource } from "@/lib/research/types";

const trustedHosts=[/\.gov$/i,/\.gc\.ca$/i,/\.edu$/i,/\.ac\.[a-z]{2}$/i,/\.org$/i,/britannica\.com$/i,/nature\.com$/i,/science\.org$/i];

export function rankDiscoveredUrl(raw:string){
  try{
    const url=new URL(raw);
    let score=35;
    if(url.protocol==="https:") score+=10;
    if(trustedHosts.some(r=>r.test(url.hostname))) score+=25;
    if(/wikipedia\.org$|wikidata\.org$/i.test(url.hostname)) score=55;
    if(/facebook|instagram|x\.com|twitter|pinterest|tiktok/i.test(url.hostname)) score-=25;
    return Math.max(0,Math.min(100,score));
  }catch{return 0;}
}

export function dedupeSources(sources:ResearchSource[]){
  const seen=new Set<string>();
  return [...sources].sort((a,b)=>b.authority-a.authority).filter(source=>{
    const key=source.url.replace(/\/$/,"").toLowerCase();
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function sourceDiversity(sources:ResearchSource[]){
  return new Set(sources.map(s=>s.independenceFamily)).size;
}

export type SourceEvent = { id:string; title:string; url:string; entityKeys:string[]; publishedAt:string; sourceTier:"A"|"B"|"C"|"D" };
export type EventCluster = { key:string; events:SourceEvent[]; entityKeys:string[] };

// V1 deterministic clusterer: identical normalized entity sets + similar title tokens.
// Replaceable later with an embeddings adapter without changing downstream contracts.
export function clusterEvents(events:SourceEvent[]): EventCluster[] {
  const clusters = new Map<string, EventCluster>();
  for (const event of events) {
    const entities = [...event.entityKeys].sort();
    const tokens = event.title.toLowerCase().replace(/[^a-z0-9 ]/g,"").split(/\s+/).filter((x)=>x.length>4).slice(0,4).sort();
    const key = [...entities, ...tokens].slice(0,7).join("|");
    const existing = clusters.get(key) ?? { key, events:[], entityKeys:entities };
    existing.events.push(event); clusters.set(key, existing);
  }
  return [...clusters.values()];
}

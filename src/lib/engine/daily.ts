import { clusterEvents, type SourceEvent } from "./cluster";
import { scoreImportance } from "./importance";

export type DailyRunResult = {
  startedAt:string; finishedAt:string; eventsScanned:number; clustersDetected:number; reviewCandidates:number; notes:string[];
};

// V1 orchestration contract. Source adapters + persistence are wired behind this function.
// Demo mode proves the pipeline while avoiding fabricated external updates.
export async function runDailyEngine(events:SourceEvent[] = []): Promise<DailyRunResult> {
  const startedAt = new Date();
  const clusters = clusterEvents(events);
  const candidates = clusters.filter((cluster)=> {
    const tierScore = Math.max(...cluster.events.map((e)=>({A:100,B:80,C:60,D:35}[e.sourceTier])));
    const score = scoreImportance({ magnitude:60, reach:60, novelty:70, sourceStrength:tierScore, persistence:60, velocity:50 });
    return score >= 60;
  });
  return {
    startedAt:startedAt.toISOString(), finishedAt:new Date().toISOString(), eventsScanned:events.length,
    clustersDetected:clusters.length, reviewCandidates:candidates.length,
    notes: events.length ? ["Events clustered and scored.","Persistence hook is ready for database-backed review items."] : ["No external source adapters configured; no content was changed.","This is deliberate: Briefs never invents freshness."]
  };
}

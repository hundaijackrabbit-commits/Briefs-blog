import type { SourceEvent } from "./cluster";

export type SourceAdapter = { name:string; fetchSince(since:Date):Promise<SourceEvent[]> };

// Adapters are intentionally modular. Primary-source RSS/API adapters can be added one by one.
export async function ingestAll(adapters: SourceAdapter[], since:Date): Promise<SourceEvent[]> {
  const settled = await Promise.allSettled(adapters.map((a)=>a.fetchSince(since)));
  return settled.flatMap((result)=>result.status === "fulfilled" ? result.value : []);
}

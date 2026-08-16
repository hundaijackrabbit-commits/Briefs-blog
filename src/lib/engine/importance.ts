export type Signal = { magnitude:number; reach:number; novelty:number; sourceStrength:number; persistence:number; velocity:number };
export function scoreImportance(s:Signal): number {
  const weights = { magnitude:.24, reach:.19, novelty:.14, sourceStrength:.18, persistence:.15, velocity:.10 };
  const value = s.magnitude*weights.magnitude + s.reach*weights.reach + s.novelty*weights.novelty + s.sourceStrength*weights.sourceStrength + s.persistence*weights.persistence + s.velocity*weights.velocity;
  return Math.max(0, Math.min(100, Math.round(value)));
}

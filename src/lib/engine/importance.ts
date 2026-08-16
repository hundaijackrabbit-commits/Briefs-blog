export function importanceScore(input:{sourceTier:"A"|"B"|"C"|"D";sourceCount:number;entityCount:number;novelty:number;reach:number;persistence:number}){
  const tier={A:25,B:18,C:10,D:4}[input.sourceTier];
  const corroboration=Math.min(20,input.sourceCount*4), entities=Math.min(15,input.entityCount*3);
  return Math.max(0,Math.min(100,Math.round(tier+corroboration+entities+input.novelty*.15+input.reach*.15+input.persistence*.1)));
}

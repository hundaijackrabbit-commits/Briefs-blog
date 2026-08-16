export function contextualImportance(input:{global:number;entityMatch:number;topicMatch:number;recencyHours:number;directImpact:boolean}){
  const freshness=input.recencyHours<=24?20:input.recencyHours<=168?12:input.recencyHours<=720?5:0;
  const topic=Math.max(0,Math.min(100,input.topicMatch))*0.25;
  const entity=Math.max(0,Math.min(100,input.entityMatch))*0.3;
  const direct=input.directImpact?15:0;
  return Math.max(0,Math.min(100,Math.round(input.global*0.3+topic+entity+freshness+direct)));
}

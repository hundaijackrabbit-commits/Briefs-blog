import { productionReadiness } from "@/lib/ops/readiness";
import { operationalSnapshot } from "@/lib/ops/telemetry";
export const dynamic="force-dynamic";
export default async function Ops(){
  const readiness=productionReadiness();const ops=await operationalSnapshot();
  return <main className="shell"><section className="hero"><p className="eyebrow">BRIEFS · V10</p><h1>Operations</h1><p className="lede">MVP readiness, queue health, research activity and provider/source health.</p></section><section className="grid"><article className="card"><h2>{readiness.status==="ready"?"MVP production ready":"Configuration incomplete"}</h2><p>{readiness.requiredReady}/{readiness.requiredTotal} required production dependencies configured.</p>{readiness.items.map(item=><p key={item.key}><strong>{item.configured?"✓":"○"} {item.label}</strong><br/><span>{item.detail}</span></p>)}</article><article className="card"><h2>Runtime</h2><pre>{JSON.stringify(ops,null,2)}</pre></article></section></main>;
}

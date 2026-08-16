"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Depth="flash"|"quick"|"standard"|"deep"|"research";
type Perspective="general"|"executive"|"investor"|"developer"|"student"|"marketer";
type SourcePolicy="verified"|"primary-only"|"academic"|"news"|"all";
type BriefResponse={
  plan:{researchNeeded:boolean;missingEvidence:string[];resolvedEntityIds:string[]};
  result:{
    subject:string;summary:string;whyItMatters:string;confidence:"high"|"medium"|"low";
    generatedAt:string;knowledgeCutoff:string;researchNeeded:boolean;sourceMode:"database"|"starter"|"research"|"empty";
    intent?:string;lens?:string;freshnessStatus?:"live"|"current"|"historical";
    keyChanges:Array<{summary:string;changedAt:string;importance:number}>;
    keyNumbers:Array<{label:string;value:string;claimId:string}>;
    keyFacts:Array<{label:string;value:string;text:string;claimId:string;sourceIds:string[]}>;
    watchItems:string[];
    sources:Array<{id:string;name:string;url:string;tier:"A"|"B"|"C"|"D";kind:string}>;
  };
};

export default function BriefClient({initialSubject}:{initialSubject:string}){
  const [subject,setSubject]=useState(initialSubject);
  const [depth,setDepth]=useState<Depth>("standard");
  const [perspective,setPerspective]=useState<Perspective>("general");
  const [sourcePolicy,setSourcePolicy]=useState<SourcePolicy>("verified");
  const [data,setData]=useState<BriefResponse|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function runBrief(nextSubject=subject,nextDepth=depth,nextPerspective=perspective,nextSourcePolicy=sourcePolicy){
    const clean=nextSubject.trim().slice(0,200);
    if(!clean) return;
    setLoading(true); setError(""); setData(null);
    try{
      const res=await fetch("/api/brief",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:clean,depth:nextDepth,perspective:nextPerspective,sourcePolicy:nextSourcePolicy,freshnessRequirement:"current",format:"web"})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body?.message||body?.error||"Brief engine unavailable");
      setData(body);
      const url=new URL(window.location.href); url.searchParams.set("q",clean); window.history.replaceState(null,"",url);
    }catch(e){setError(e instanceof Error?e.message:"Brief engine unavailable");}
    finally{setLoading(false);}
  }

  useEffect(()=>{ if(initialSubject.trim()) void runBrief(initialSubject,"standard","general","verified"); /* initial query only */ // eslint-disable-next-line react-hooks/exhaustive-deps
  },[initialSubject]);

  function submit(e:FormEvent){e.preventDefault();void runBrief();}

  return <main className="brief-me-shell">
    <section className="brief-me-query" aria-labelledby="brief-me-title">
      <p className="eyebrow">BRIEFS · LIVING KNOWLEDGE</p>
      <h1 id="brief-me-title">Brief me on</h1>
      <form onSubmit={submit} className="brief-me-form">
        <input value={subject} onChange={(e:ChangeEvent<HTMLInputElement>)=>setSubject(e.target.value)} aria-label="Brief subject" autoFocus autoComplete="off" placeholder="WW2, artificial intelligence, Nvidia…" />
        <button disabled={loading||!subject.trim()}>{loading?"Briefing…":"→"}</button>
      </form>
      <div className="brief-options">
        <label>Depth<select value={depth} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setDepth(e.target.value as Depth)}><option value="flash">15 sec</option><option value="quick">30 sec</option><option value="standard">3 min</option><option value="deep">Deep dive</option><option value="research">Research</option></select></label>
        <label>Perspective<select value={perspective} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setPerspective(e.target.value as Perspective)}><option value="general">General</option><option value="executive">Executive</option><option value="investor">Investor</option><option value="developer">Developer</option><option value="student">Student</option><option value="marketer">Marketer</option></select></label><label>Sources<select value={sourcePolicy} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setSourcePolicy(e.target.value as SourcePolicy)}><option value="verified">Verified</option><option value="primary-only">Primary only</option><option value="news">News</option><option value="academic">Academic</option><option value="all">All eligible</option></select></label>
      </div>
    </section>

    {loading&&<section className="brief-state" aria-live="polite"><div className="brief-pulse"/><p>Resolving entities, claims, evidence and freshness…</p></section>}
    {error&&<section className="brief-state brief-error" role="alert"><h2>Brief unavailable</h2><p>{error}</p><p className="muted">Briefs preserves the last safe public state when an intelligence dependency is unavailable.</p></section>}
    {data&&<article className="brief-result" aria-live="polite">
      <header className="brief-result-head"><div><p className="eyebrow">{data.result.confidence.toUpperCase()} CONFIDENCE · {data.result.sourceMode==="database"?"LIVE KNOWLEDGE DB":data.result.sourceMode==="starter"?"VERIFIED STARTER CORPUS":data.result.sourceMode==="research"?"LIVE RESEARCH":"COVERAGE GAP"}</p><h2>{data.result.subject}</h2>{(data.result.intent||data.result.lens||data.result.freshnessStatus)&&<div className="brief-routing"><span>{(data.result.intent||"general").replace(/_/g," ")}</span><span>{data.result.lens||"general"} lens</span><span>{data.result.freshnessStatus||"current"} freshness</span></div>}</div><span className={data.result.researchNeeded?"brief-status research":"brief-status current"}>{data.result.sourceMode==="research"?(data.result.researchNeeded?"Researched · verify":"Researched"):data.result.researchNeeded?"Research needed":data.result.sourceMode==="starter"?"Verified baseline":"Current"}</span></header>
      <section className="brief-block lead"><h3>The brief</h3><p>{data.result.summary}</p></section>
      {data.result.whyItMatters&&<section className="brief-block"><h3>Why it matters</h3><p>{data.result.whyItMatters}</p></section>}
      {data.result.keyChanges.length>0&&<section className="brief-block"><h3>What changed</h3><div className="brief-list">{data.result.keyChanges.map((c,i)=><div key={i}><strong>{c.summary}</strong><span>{new Date(c.changedAt).toLocaleDateString()}</span></div>)}</div></section>}
      {data.result.keyFacts.length>0&&<section className="brief-block"><h3>Key facts</h3><div className="brief-numbers">{data.result.keyFacts.map(n=><div key={n.claimId}><span>{n.label}</span><strong>{n.value}</strong>{n.sourceIds.length>0&&<small>{n.sourceIds.length} evidence source{n.sourceIds.length===1?"":"s"}</small>}</div>)}</div></section>}
      {data.result.watchItems.length>0&&<section className="brief-block"><h3>What to watch</h3><ul className="brief-watch">{data.result.watchItems.map((item,i)=><li key={i}>{item}</li>)}</ul></section>}
      {data.result.intent&&["market_snapshot","market_move","financials"].includes(data.result.intent)&&<section className="brief-block finance-note"><h3>Market-data note</h3><p>Quotes may be end-of-day, delayed, or unavailable depending on the configured provider entitlement. Filing facts are not live prices. This Brief is informational, not investment advice.</p></section>}
      {data.result.sources.length>0&&<section className="brief-block"><h3>Evidence</h3><div className="brief-sources">{data.result.sources.map(source=><a key={source.id} href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>Tier {source.tier} · {source.kind}</span></a>)}</div></section>}
      {data.result.researchNeeded&&<section className="brief-block research-note"><h3>Evidence gap</h3>{data.plan.missingEvidence.length>0&&<ul className="brief-watch">{data.plan.missingEvidence.slice(0,4).map((gap,i)=><li key={i}>{gap}</li>)}</ul>}<p>{data.result.sourceMode==="empty"?"Briefs could not gather enough evidence to answer safely. The gap remains explicit rather than being filled by invention.":data.result.sourceMode==="research"?"Briefs researched this subject live and found useful evidence, but independent corroboration or stronger primary sourcing is still limited. Treat this as a researched baseline, not final authority.":"This subject can change quickly. The current baseline is useful, but time-sensitive claims should be refreshed against live sources before being treated as fully current."}</p></section>}
      <footer className="brief-meta">Generated {new Date(data.result.generatedAt).toLocaleString()} · knowledge cutoff {new Date(data.result.knowledgeCutoff).toLocaleString()}</footer>
    </article>}
  </main>;
}

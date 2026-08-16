"use client";

import { FormEvent, useEffect, useState } from "react";

type Depth="flash"|"quick"|"standard"|"deep"|"research";
type Perspective="general"|"executive"|"investor"|"developer"|"student"|"marketer";
type BriefResponse={
  plan:{researchNeeded:boolean;missingEvidence:string[];resolvedEntityIds:string[]};
  result:{
    subject:string;summary:string;whyItMatters:string;confidence:"high"|"medium"|"low";
    generatedAt:string;knowledgeCutoff:string;researchNeeded:boolean;
    keyChanges:Array<{summary:string;changedAt:string;importance:number}>;
    keyNumbers:Array<{label:string;value:string;claimId:string}>;
    watchItems:string[];
  };
};

export default function BriefClient({initialSubject}:{initialSubject:string}){
  const [subject,setSubject]=useState(initialSubject);
  const [depth,setDepth]=useState<Depth>("standard");
  const [perspective,setPerspective]=useState<Perspective>("general");
  const [data,setData]=useState<BriefResponse|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function runBrief(nextSubject=subject,nextDepth=depth,nextPerspective=perspective){
    const clean=nextSubject.trim().slice(0,200);
    if(!clean) return;
    setLoading(true); setError(""); setData(null);
    try{
      const res=await fetch("/api/brief",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:clean,depth:nextDepth,perspective:nextPerspective,sourcePolicy:"verified",freshnessRequirement:"current",format:"web"})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body?.message||body?.error||"Brief engine unavailable");
      setData(body);
      const url=new URL(window.location.href); url.searchParams.set("q",clean); window.history.replaceState(null,"",url);
    }catch(e){setError(e instanceof Error?e.message:"Brief engine unavailable");}
    finally{setLoading(false);}
  }

  useEffect(()=>{ if(initialSubject.trim()) void runBrief(initialSubject,"standard","general"); /* initial query only */ // eslint-disable-next-line react-hooks/exhaustive-deps
  },[initialSubject]);

  function submit(e:FormEvent){e.preventDefault();void runBrief();}

  return <main className="brief-me-shell">
    <section className="brief-me-query" aria-labelledby="brief-me-title">
      <p className="eyebrow">BRIEFS · CURRENT KNOWLEDGE</p>
      <h1 id="brief-me-title">Brief me on</h1>
      <form onSubmit={submit} className="brief-me-form">
        <input value={subject} onChange={e=>setSubject(e.target.value)} aria-label="Brief subject" autoFocus autoComplete="off" placeholder="Nvidia, AI agents, private credit…" />
        <button disabled={loading||!subject.trim()}>{loading?"Briefing…":"→"}</button>
      </form>
      <div className="brief-options">
        <label>Depth<select value={depth} onChange={e=>setDepth(e.target.value as Depth)}><option value="flash">15 sec</option><option value="quick">30 sec</option><option value="standard">3 min</option><option value="deep">Deep dive</option><option value="research">Research</option></select></label>
        <label>Perspective<select value={perspective} onChange={e=>setPerspective(e.target.value as Perspective)}><option value="general">General</option><option value="executive">Executive</option><option value="investor">Investor</option><option value="developer">Developer</option><option value="student">Student</option><option value="marketer">Marketer</option></select></label>
      </div>
    </section>

    {loading&&<section className="brief-state" aria-live="polite"><div className="brief-pulse"/><p>Resolving entities, verified claims, changes and evidence…</p></section>}
    {error&&<section className="brief-state brief-error" role="alert"><h2>Brief unavailable</h2><p>{error}</p><p className="muted">The public site remains available even when the intelligence database is offline. Connect the production database to activate live Briefs.</p></section>}
    {data&&<article className="brief-result" aria-live="polite">
      <header className="brief-result-head"><div><p className="eyebrow">{data.result.confidence.toUpperCase()} CONFIDENCE · {data.plan.resolvedEntityIds.length} ENTIT{data.plan.resolvedEntityIds.length===1?"Y":"IES"}</p><h2>{data.result.subject}</h2></div><span className={data.result.researchNeeded?"brief-status research":"brief-status current"}>{data.result.researchNeeded?"Research needed":"Current"}</span></header>
      <section className="brief-block lead"><h3>The brief</h3><p>{data.result.summary}</p></section>
      <section className="brief-block"><h3>Why it matters</h3><p>{data.result.whyItMatters}</p></section>
      {data.result.keyChanges.length>0&&<section className="brief-block"><h3>What changed</h3><div className="brief-list">{data.result.keyChanges.map((c,i)=><div key={i}><strong>{c.summary}</strong><span>{new Date(c.changedAt).toLocaleDateString()}</span></div>)}</div></section>}
      {data.result.keyNumbers.length>0&&<section className="brief-block"><h3>Key numbers</h3><div className="brief-numbers">{data.result.keyNumbers.map(n=><div key={n.claimId}><span>{n.label}</span><strong>{n.value}</strong></div>)}</div></section>}
      {data.result.researchNeeded&&<section className="brief-block research-note"><h3>Evidence gap</h3><p>Briefs does not have enough current verified evidence to treat every part of this briefing as complete. The system has flagged this subject for further research rather than filling gaps by invention.</p></section>}
      <footer className="brief-meta">Generated {new Date(data.result.generatedAt).toLocaleString()} · knowledge cutoff {new Date(data.result.knowledgeCutoff).toLocaleString()}</footer>
    </article>}
  </main>;
}

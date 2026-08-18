"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Depth="flash"|"quick"|"standard"|"deep"|"research";
type Perspective="general"|"executive"|"investor"|"developer"|"student"|"marketer";
type SourcePolicy="verified"|"primary-only"|"academic"|"news"|"all";
type BriefContext={conversationId?:string;rootSubject:string;priorQueries:string[];entityHints:string[];claimIds:string[];sourceIds:string[];sourceHints?:Array<{id:string;name:string;url:string;tier:"A"|"B"|"C"|"D";kind:string}>;factHints?:Array<{id:string;predicate:string;value:string;text:string;sourceIds:string[]}>;lastSummary?:string;knowledgeCutoff?:string};
type BriefResponse={
  plan:{researchNeeded:boolean;missingEvidence:string[];resolvedEntityIds:string[]};
  personal?:{lastReadAt:string|null;newChanges:number;caughtUp:boolean}|null;
  result:{
    subject:string;summary:string;whyItMatters:string;confidence:"high"|"medium"|"low";
    generatedAt:string;knowledgeCutoff:string;researchNeeded:boolean;sourceMode:"database"|"starter"|"research"|"empty";
    intent?:string;lens?:string;freshnessStatus?:"live"|"current"|"historical";
    keyChanges:Array<{summary:string;changedAt:string;importance:number}>;
    keyNumbers:Array<{label:string;value:string;claimId:string}>;
    keyFacts:Array<{label:string;value:string;text:string;claimId:string;sourceIds:string[]}>;
    watchItems:string[];
    sources:Array<{id:string;name:string;url:string;tier:"A"|"B"|"C"|"D";kind:string}>;
    context?:BriefContext;
    comparison?:Array<{subject:string;summary:string;factCount:number;sourceCount:number}>;
    quality?:{score:number;evidence:number;freshness:number;coverage:number;warnings:string[]};
    answerQuality?:{score:number;directness:number;audienceFit:number;grounding:number;clarity:number;uncertainty:number;specificity:number;warnings:string[]};
    reader?:{audience:Perspective;goal:string;expertise:string;timeBudget:string;desiredOutcome:string;confidence:number;inferred:boolean};
    answerPlan?:{objective:string;opening:string;targetWords:number};
    suggestedFollowups?:string[];
    generatedBy?:string;
    research?:{iterations:number;stopReason?:string;persisted:boolean;independentSources:number};
    contradictions?:Array<{predicate:string;values:string[];sourceIds:string[]}>;
  };
};

const LOCAL_FOLLOWS="briefs:v8:follows";
function localReadKey(subject:string){return `briefs:v8:read:${subject.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,120)}`;}

export default function BriefClient({initialSubject}:{initialSubject:string}){
  const [subject,setSubject]=useState(initialSubject);
  const [depth,setDepth]=useState<Depth>("standard");
  const [perspective,setPerspective]=useState<Perspective>("general");
  const [sourcePolicy,setSourcePolicy]=useState<SourcePolicy>("verified");
  const [data,setData]=useState<BriefResponse|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [followup,setFollowup]=useState("");
  const [followed,setFollowed]=useState(false);
  const [localSince,setLocalSince]=useState<{lastReadAt:string|null;newChanges:number;caughtUp:boolean}|null>(null);

  async function runBrief(nextSubject=subject,nextDepth=depth,nextPerspective=perspective,nextSourcePolicy=sourcePolicy,nextContext?:BriefContext){
    const clean=nextSubject.trim().slice(0,200);
    if(!clean) return;
    setLoading(true); setError("");
    try{
      const res=await fetch("/api/brief",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subject:clean,depth:nextDepth,perspective:nextPerspective,sourcePolicy:nextSourcePolicy,freshnessRequirement:/\b(today|latest|now|current|this week|news)\b/i.test(clean)?"recent":"current",format:"web",context:nextContext})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body?.message||body?.error||"Brief engine unavailable");
      setData(body); setFollowup("");
      const resolved=body.result?.subject||clean;
      try{
        const key=localReadKey(resolved); const previous=localStorage.getItem(key); const last=previous?new Date(previous):null;
        const changes=(body.result?.keyChanges||[]) as Array<{changedAt:string}>;
        const count=last?changes.filter(c=>new Date(c.changedAt)>last).length:changes.length;
        setLocalSince({lastReadAt:last?.toISOString()||null,newChanges:count,caughtUp:Boolean(last)&&count===0});
        localStorage.setItem(key,new Date().toISOString());
        const follows: string[]=JSON.parse(localStorage.getItem(LOCAL_FOLLOWS)||"[]");
        setFollowed(follows.some(item=>item.toLowerCase()===resolved.toLowerCase()));
      }catch{}
      const url=new URL(window.location.href); url.searchParams.set("q",clean); window.history.replaceState(null,"",url);
    }catch(e){setError(e instanceof Error?e.message:"Brief engine unavailable");}
    finally{setLoading(false);}
  }

  useEffect(()=>{ if(initialSubject.trim()) void runBrief(initialSubject,"standard","general","verified"); /* initial query only */ // eslint-disable-next-line react-hooks/exhaustive-deps
  },[initialSubject]);

  function submit(e:FormEvent){e.preventDefault();void runBrief();}
  function submitFollowup(e:FormEvent){e.preventDefault();if(followup.trim())void runBrief(followup,depth,perspective,sourcePolicy,data?.result.context);}

  async function toggleFollow(){
    if(!data)return;
    const target=data.result.subject;
    try{
      const follows:string[]=JSON.parse(localStorage.getItem(LOCAL_FOLLOWS)||"[]");
      const exists=follows.some(item=>item.toLowerCase()===target.toLowerCase());
      const next=exists?follows.filter(item=>item.toLowerCase()!==target.toLowerCase()):[...follows,target];
      localStorage.setItem(LOCAL_FOLLOWS,JSON.stringify(next));setFollowed(!exists);
      await fetch("/api/personal",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:exists?"unfollow":"follow",subject:target})}).catch(()=>null);
    }catch{}
  }

  const since=data?.personal||localSince;
  const sourceMap=useMemo(()=>new Map((data?.result.sources||[]).map(source=>[source.id,source] as const)),[data]);

  return <main className="brief-me-shell">
    <section className="brief-me-query" aria-labelledby="brief-me-title">
      <div className="brief-topline"><p className="eyebrow">BRIEFS · LIVING KNOWLEDGE</p><a href="/my-briefs">My Briefs</a></div>
      <h1 id="brief-me-title">Brief me on</h1>
      <form onSubmit={submit} className="brief-me-form">
        <input value={subject} onChange={(e:ChangeEvent<HTMLInputElement>)=>setSubject(e.target.value)} aria-label="Brief subject" autoFocus autoComplete="off" placeholder="WW2, artificial intelligence, Nvidia…" />
        <button disabled={loading||!subject.trim()}>{loading?"Briefing…":"→"}</button>
      </form>
      <div className="brief-options">
        <label>Depth<select value={depth} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setDepth(e.target.value as Depth)}><option value="flash">15 sec</option><option value="quick">30 sec</option><option value="standard">3 min</option><option value="deep">Deep dive</option><option value="research">Research</option></select></label>
        <label>Perspective<select value={perspective} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setPerspective(e.target.value as Perspective)}><option value="general">General</option><option value="executive">Executive</option><option value="investor">Investor</option><option value="developer">Developer</option><option value="student">Student</option><option value="marketer">Marketer</option></select></label>
        <label>Sources<select value={sourcePolicy} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setSourcePolicy(e.target.value as SourcePolicy)}><option value="verified">Verified</option><option value="primary-only">Primary only</option><option value="news">News</option><option value="academic">Academic</option><option value="all">All eligible</option></select></label>
      </div>
    </section>

    {loading&&<section className="brief-state" aria-live="polite"><div className="brief-pulse"/><p>Planning, resolving evidence and checking what changed…</p></section>}
    {error&&<section className="brief-state brief-error" role="alert"><h2>Brief unavailable</h2><p>{error}</p><p className="muted">Briefs preserves the last safe public state when an intelligence dependency is unavailable.</p></section>}
    {data&&<article className="brief-result" aria-live="polite">
      <header className="brief-result-head"><div><p className="eyebrow">{data.result.confidence.toUpperCase()} CONFIDENCE · {data.result.sourceMode==="database"?"LIVE KNOWLEDGE DB":data.result.sourceMode==="starter"?"VERIFIED STARTER CORPUS":data.result.sourceMode==="research"?"LIVE RESEARCH":"COVERAGE GAP"}</p><h2>{data.result.subject}</h2>{(data.result.intent||data.result.lens||data.result.freshnessStatus)&&<div className="brief-routing"><span>{(data.result.intent||"general").replace(/_/g," ")}</span><span>{data.result.lens||"general"} lens</span><span>{data.result.freshnessStatus||"current"} freshness</span></div>}{data.result.reader&&<div className="brief-routing"><span>for {data.result.reader.audience.replace(/-/g," ")}</span><span>{data.result.reader.goal}</span><span>{data.result.reader.expertise}</span></div>}{data.result.quality&&<div className="brief-routing"><span>evidence quality {data.result.quality.score}/100</span>{data.result.answerQuality&&<span>answer quality {data.result.answerQuality.score}/100</span>}{data.result.research&&<span>{data.result.research.iterations} refinement pass{data.result.research.iterations===1?"":"es"}</span>}{data.result.research?.persisted&&<span>persistent memory</span>}</div>}</div><div className="result-actions"><button onClick={toggleFollow}>{followed?"Following ✓":"+ Follow"}</button><span className={data.result.researchNeeded?"brief-status research":"brief-status current"}>{data.result.sourceMode==="research"?(data.result.researchNeeded?"Researched · verify":"Researched"):data.result.researchNeeded?"Research needed":data.result.sourceMode==="starter"?"Verified baseline":"Current"}</span></div></header>

      {since?.lastReadAt&&<section className={`catchup ${since.caughtUp?"caught-up":""}`}><strong>{since.caughtUp?"You’re caught up.":`${since.newChanges} thing${since.newChanges===1?"":"s"} changed since you were here.`}</strong><span>Last read {new Date(since.lastReadAt).toLocaleString()}</span></section>}

      <section className="brief-block lead"><h3>The brief</h3><p>{data.result.summary}</p></section>
      {data.result.comparison&&data.result.comparison.length>1&&<section className="brief-block"><h3>Comparison</h3><div className="comparison-grid">{data.result.comparison.map(item=><article key={item.subject}><h4>{item.subject}</h4><p>{item.summary}</p><small>{item.factCount} findings · {item.sourceCount} sources</small></article>)}</div></section>}
      {data.result.whyItMatters&&<section className="brief-block"><h3>Why it matters</h3><p>{data.result.whyItMatters}</p></section>}
      {data.result.keyChanges.length>0&&<section className="brief-block"><h3>What changed</h3><div className="brief-list">{data.result.keyChanges.map((c,i)=><div key={i}><strong>{c.summary}</strong><span>{new Date(c.changedAt).toLocaleDateString()} · importance {c.importance}</span></div>)}</div></section>}
      {data.result.keyFacts.length>0&&<section className="brief-block"><h3>Key facts</h3><div className="brief-numbers evidence-facts">{data.result.keyFacts.map(fact=><details key={fact.claimId}><summary><span>{fact.label}</span><strong>{fact.value}</strong><small>{fact.sourceIds.length} evidence source{fact.sourceIds.length===1?"":"s"} · inspect</small></summary><p>{fact.text}</p><div className="claim-evidence">{fact.sourceIds.map(id=>sourceMap.get(id)).filter(Boolean).map(source=><a key={source!.id} href={source!.url} target="_blank" rel="noreferrer"><strong>{source!.name}</strong><span>Tier {source!.tier} · {source!.kind}</span></a>)}</div></details>)}</div></section>}
      {data.result.contradictions&&data.result.contradictions.length>0&&<section className="brief-block contradiction-note"><h3>Disagreement detected</h3><p>Briefs found conflicting structured values and is keeping them visible instead of silently choosing one.</p><ul className="brief-watch">{data.result.contradictions.map((c,i)=><li key={i}><strong>{c.predicate}:</strong> {c.values.join(" ↔ ")}</li>)}</ul></section>}
      {data.result.watchItems.length>0&&<section className="brief-block"><h3>What to watch</h3><ul className="brief-watch">{data.result.watchItems.map((item,i)=><li key={i}>{item}</li>)}</ul></section>}
      {data.result.intent&&["market_snapshot","market_move","financials"].includes(data.result.intent)&&<section className="brief-block finance-note"><h3>Market-data note</h3><p>Quotes may be end-of-day, delayed, or unavailable depending on the configured provider entitlement. Filing facts are not live prices. This Brief is informational, not investment advice.</p></section>}
      {data.result.sources.length>0&&<section className="brief-block"><h3>Evidence</h3><div className="brief-sources">{data.result.sources.map(source=><a key={source.id} href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>Tier {source.tier} · {source.kind}</span></a>)}</div></section>}
      <section className="distribution-tools"><h3>Export</h3><div><a href={`/api/export?q=${encodeURIComponent(data.result.subject)}&format=markdown`}>Markdown</a><a href={`/api/export?q=${encodeURIComponent(data.result.subject)}&format=csv`}>CSV</a><a href={`/api/export?q=${encodeURIComponent(data.result.subject)}&format=json`}>JSON</a></div></section>
      {data.result.answerQuality&&data.result.answerQuality.warnings.length>0&&<section className="brief-block quality-note"><h3>Answer notes</h3><ul className="brief-watch">{data.result.answerQuality.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></section>}{data.result.quality&&data.result.quality.warnings.length>0&&<section className="brief-block quality-note"><h3>Evidence notes</h3><ul className="brief-watch">{data.result.quality.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></section>}
      {data.result.researchNeeded&&<section className="brief-block research-note"><h3>Evidence gap</h3>{data.plan.missingEvidence.length>0&&<ul className="brief-watch">{data.plan.missingEvidence.slice(0,5).map((gap,i)=><li key={i}>{gap}</li>)}</ul>}<p>{data.result.sourceMode==="empty"?"Briefs could not gather enough evidence to answer safely. The gap remains explicit rather than being filled by invention.":data.result.sourceMode==="research"?"Briefs researched this subject and found useful evidence, but corroboration, freshness or stronger primary sourcing is still limited.":"This subject can change quickly. The current baseline is useful, but time-sensitive claims should be refreshed before being treated as fully current."}</p></section>}

      <section className="brief-followup"><p className="eyebrow">KEEP THE CONTEXT</p>{data.result.suggestedFollowups&&data.result.suggestedFollowups.length>0&&<div className="brief-routing">{data.result.suggestedFollowups.slice(0,3).map(q=><button type="button" key={q} onClick={()=>{setFollowup(q);void runBrief(q,depth,perspective,sourcePolicy,data.result.context);}}>{q}</button>)}</div>}<form onSubmit={submitFollowup}><input value={followup} onChange={(e:ChangeEvent<HTMLInputElement>)=>setFollowup(e.target.value)} placeholder={`Ask a follow-up about ${data.result.subject}…`} aria-label="Follow-up question"/><button disabled={loading||!followup.trim()}>Ask →</button></form><small>Follow-ups carry forward the subject, evidence and reader context instead of starting over.</small></section>
      <footer className="brief-meta">Generated {new Date(data.result.generatedAt).toLocaleString()} · knowledge cutoff {new Date(data.result.knowledgeCutoff).getUTCFullYear()<=1971?"unavailable":new Date(data.result.knowledgeCutoff).toLocaleString()}</footer>
    </article>}
  </main>;
}

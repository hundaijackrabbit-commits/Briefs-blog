"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User={id:string;email:string}|null;
type Pack={id:string;name:string;description:string;items:Array<{id:string;subject:string}>};
type Notification={id:string;title:string;body:string;subject:string;created_at:string;read_at:string|null};
type Preferences={default_depth:string;default_perspective:string;digest_enabled:boolean;min_importance:number};

const LOCAL_KEY="briefs:v8:follows";
function readLocal():string[]{try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]");}catch{return [];}}
function writeLocal(items:string[]){localStorage.setItem(LOCAL_KEY,JSON.stringify(items));}

export default function MyBriefsClient(){
  const [user,setUser]=useState<User>(null);
  const [database,setDatabase]=useState(false);
  const [packs,setPacks]=useState<Pack[]>([]);
  const [notifications,setNotifications]=useState<Notification[]>([]);
  const [local,setLocal]=useState<string[]>([]);
  const [subject,setSubject]=useState("");
  const [packName,setPackName]=useState("");
  const [mode,setMode]=useState<"login"|"register">("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [prefs,setPrefs]=useState<Preferences>({default_depth:"standard",default_perspective:"general",digest_enabled:true,min_importance:65});

  async function refresh(){
    const me=await fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).catch(()=>({user:null,database:false}));
    setUser(me.user||null); setDatabase(Boolean(me.database));
    if(me.user){
      const personal=await fetch("/api/personal",{cache:"no-store"});
      if(personal.ok){const body=await personal.json();setPacks(body.packs||[]);setNotifications(body.notifications||[]);if(body.preferences)setPrefs(body.preferences);}
    }else{setPacks([]);setNotifications([]);}
  }
  useEffect(()=>{setLocal(readLocal());void refresh();},[]);

  async function auth(event:FormEvent){
    event.preventDefault(); setMessage("");
    const res=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
    const body=await res.json().catch(()=>({})); if(!res.ok){setMessage(body.error||"Could not sign in");return;}
    setEmail("");setPassword("");setMessage("Signed in.");
    const localItems=readLocal();
    for(const item of localItems) await fetch("/api/personal",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"follow",subject:item})}).catch(()=>null);
    await refresh();
  }
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});setUser(null);setPacks([]);setNotifications([]);}
  async function follow(event:FormEvent){
    event.preventDefault(); const clean=subject.trim(); if(!clean)return;
    const next=[...new Set([...local,clean])];setLocal(next);writeLocal(next);setSubject("");
    if(user){await fetch("/api/personal",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"follow",subject:clean})});await refresh();}
  }
  async function createPack(event:FormEvent){
    event.preventDefault(); if(!user||!packName.trim())return;
    await fetch("/api/personal",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create-pack",name:packName})});setPackName("");await refresh();
  }
  function removeLocal(value:string){const next=local.filter(x=>x.toLowerCase()!==value.toLowerCase());setLocal(next);writeLocal(next);}
  async function savePreferences(event:FormEvent){
    event.preventDefault();
    const res=await fetch("/api/personal",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"preferences",depth:prefs.default_depth,perspective:prefs.default_perspective,digestEnabled:prefs.digest_enabled,minImportance:prefs.min_importance})});
    setMessage(res.ok?"Preferences saved.":"Could not save preferences.");
  }
  const syncedSubjects=useMemo(()=>new Set(packs.flatMap(p=>p.items.map(i=>i.subject.toLowerCase()))),[packs]);

  return <main className="section personal-shell">
    <div className="personal-head"><div><p className="eyebrow">BRIEFS · PERSONAL INTELLIGENCE</p><h1>My Briefs</h1><p className="lede">Follow knowledge, not publications. Briefs will tell you what materially changed — and when nothing did.</p></div><a className="text-link" href="/">Brief something →</a></div>
    {!user&&<section className="personal-grid"><article className="card"><h2>Follow locally now</h2><p className="muted">Works without an account on this browser. Sign in later to sync across devices.</p><form onSubmit={follow} className="inline-form"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Nvidia, private credit, AI agents…"/><button>Follow</button></form><div className="follow-list">{local.length?local.map(item=><div key={item}><a href={`/brief-me?q=${encodeURIComponent(item)}`}>{item}</a><button onClick={()=>removeLocal(item)}>×</button></div>):<p className="muted">Nothing followed yet.</p>}</div></article><article className="card"><div className="tab-row"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div><form onSubmit={auth} className="auth-card"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required/></label><button>{mode==="login"?"Sign in":"Create account"}</button>{message&&<p className="muted">{message}</p>}{!database&&<p className="muted">Production database is not connected yet, so account sync is unavailable. Local follows still work.</p>}</form></article></section>}
    {user&&<><section className="personal-strip"><span>Signed in as <strong>{user.email}</strong></span><button onClick={logout}>Sign out</button></section><section className="personal-grid"><article className="card"><h2>Your Brief Packs</h2><form onSubmit={createPack} className="inline-form"><input value={packName} onChange={e=>setPackName(e.target.value)} placeholder="Portfolio, AI, competitors…"/><button>Create pack</button></form>{packs.length?packs.map(pack=><div className="pack" key={pack.id}><h3>{pack.name}</h3>{pack.items.length?pack.items.map(item=><a key={item.id} href={`/brief-me?q=${encodeURIComponent(item.subject)}`}>{item.subject}</a>):<p className="muted">Empty pack.</p>}</div>):<p className="muted">Follow a subject from any Brief to create your first pack.</p>}</article><article className="card"><h2>Change inbox</h2>{notifications.length?notifications.map(n=><a className="notification" key={n.id} href={`/brief-me?q=${encodeURIComponent(n.subject)}`}><strong>{n.title}</strong><span>{n.body}</span><small>{new Date(n.created_at).toLocaleString()}</small></a>):<p className="muted">You’re caught up. No material tracked changes are waiting.</p>}</article></section><section className="card preference-card"><h2>Brief defaults & alerts</h2><form onSubmit={savePreferences} className="preferences-form"><label>Default depth<select value={prefs.default_depth} onChange={e=>setPrefs({...prefs,default_depth:e.target.value})}><option value="flash">15 sec</option><option value="quick">30 sec</option><option value="standard">3 min</option><option value="deep">Deep dive</option><option value="research">Research</option></select></label><label>Default perspective<select value={prefs.default_perspective} onChange={e=>setPrefs({...prefs,default_perspective:e.target.value})}><option value="general">General</option><option value="executive">Executive</option><option value="investor">Investor</option><option value="developer">Developer</option><option value="student">Student</option><option value="marketer">Marketer</option></select></label><label>Alert threshold<input type="range" min="0" max="100" value={prefs.min_importance} onChange={e=>setPrefs({...prefs,min_importance:Number(e.target.value)})}/><span>{prefs.min_importance}/100 importance</span></label><label className="check-row"><input type="checkbox" checked={prefs.digest_enabled} onChange={e=>setPrefs({...prefs,digest_enabled:e.target.checked})}/> Build my change inbox during daily intelligence runs</label><button>Save preferences</button></form>{message&&<p className="muted">{message}</p>}</section><section className="card"><h2>Local follows</h2><p className="muted">These remain on this browser until you add them to a synced pack.</p><div className="follow-list">{local.map(item=><div key={item}><a href={`/brief-me?q=${encodeURIComponent(item)}`}>{item}</a><span>{syncedSubjects.has(item.toLowerCase())?"synced":"local"}</span></div>)}</div></section></>}
  </main>;
}

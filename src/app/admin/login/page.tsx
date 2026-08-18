"use client";

import { FormEvent, useState } from "react";

export default function AdminLogin(){
  const [token,setToken]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  async function submit(event:FormEvent){
    event.preventDefault(); setLoading(true); setError("");
    try{
      const response=await fetch("/api/admin/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||"Admin login failed");
      window.location.assign("/admin/intelligence");
    }catch(error){setError(error instanceof Error?error.message:"Admin login failed");}
    finally{setLoading(false);}
  }
  return <main className="section auth-shell"><span className="pill">ADMIN · V8</span><h1>Editorial access</h1><p className="muted">Internal intelligence surfaces are protected before the database is queried.</p><form className="auth-card" onSubmit={submit}><label>Admin token<input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="current-password"/></label><button disabled={loading||!token}>{loading?"Checking…":"Continue"}</button>{error&&<p className="brief-error">{error}</p>}</form></main>;
}

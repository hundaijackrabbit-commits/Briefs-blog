import type { BriefResult } from "@/lib/types";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

function esc(value:string){return value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));}

export function renderBriefEmail(result:BriefResult){
  const sources=result.sources.slice(0,8).map(s=>`<li><a href="${esc(s.url)}">${esc(s.name)}</a> <small>Tier ${esc(s.tier)}</small></li>`).join("");
  const facts=result.keyFacts.slice(0,8).map(f=>`<li><strong>${esc(f.label)}:</strong> ${esc(f.value)}</li>`).join("");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:32px;color:#111"><p style="letter-spacing:.08em;font-size:12px">BRIEFS.</p><h1>${esc(result.subject)}</h1><p>${esc(result.summary)}</p>${result.whyItMatters?`<h2>Why it matters</h2><p>${esc(result.whyItMatters)}</p>`:""}${facts?`<h2>Key facts</h2><ul>${facts}</ul>`:""}${sources?`<h2>Evidence</h2><ul>${sources}</ul>`:""}<p style="color:#666;font-size:12px">Confidence: ${esc(result.confidence)} · knowledge cutoff ${esc(result.knowledgeCutoff)}</p><p><a href="${briefsBaseUrl()}">Open Briefs</a></p></body></html>`;
}

export function renderDigestEmail(items:Array<{title:string;body:string;subject:string}>){
  const blocks=items.map(item=>`<div style="padding:16px 0;border-top:1px solid #ddd"><h2 style="font-size:18px;margin:0 0 8px">${esc(item.title)}</h2><p style="margin:0">${esc(item.body)}</p><p style="margin:8px 0 0"><a href="${briefsBaseUrl()}/brief-me?q=${encodeURIComponent(item.subject)}">Brief me on ${esc(item.subject)}</a></p></div>`).join("");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:32px;color:#111"><p style="letter-spacing:.08em;font-size:12px">BRIEFS · YOUR CHANGES</p><h1>${items.length} meaningful update${items.length===1?"":"s"}</h1>${blocks}<p style="color:#666;font-size:12px">Briefs only sends changes above your importance threshold.</p></body></html>`;
}

import { NextResponse } from "next/server";
import { briefsBaseUrl } from "@/lib/distribution/base-url";
import { listPublicBriefs } from "@/lib/distribution/public-brief";

function xml(value:string){return value.replace(/[<>&'\"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]||ch));}
export const dynamic="force-dynamic";
export async function GET(){
  const base=briefsBaseUrl(); const items=(await listPublicBriefs()).slice(0,50);
  const body=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Briefs</title><link>${xml(base)}</link><description>Living, sourced briefings.</description><language>en</language>${items.map(item=>`<item><title>${xml(item.title)}</title><link>${xml(`${base}/briefs/${item.slug}`)}</link><guid isPermaLink="true">${xml(`${base}/briefs/${item.slug}`)}</guid><description>${xml(item.deck)}</description>${item.updatedAt?`<pubDate>${new Date(item.updatedAt).toUTCString()}</pubDate>`:""}</item>`).join("")}</channel></rss>`;
  return new NextResponse(body,{headers:{"content-type":"application/rss+xml; charset=utf-8","cache-control":"public, max-age=300, s-maxage=900"}});
}

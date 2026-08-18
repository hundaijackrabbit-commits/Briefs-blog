import { NextResponse } from "next/server";
import { briefsBaseUrl } from "@/lib/distribution/base-url";
import { listPublicBriefs } from "@/lib/distribution/public-brief";
import { listPublishedArticles } from "@/lib/publication/public";

function xml(value:string){return value.replace(/[<>&'\"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]||ch));}
export const dynamic="force-dynamic";
export async function GET(){
  const base=briefsBaseUrl();
  const [briefs,articles]=await Promise.all([listPublicBriefs(),listPublishedArticles(50)]);
  const merged=[
    ...articles.map(item=>({
      title:item.title,url:`${base}/articles/${item.slug}`,deck:item.deck,
      date:item.publishedAt||item.lastSubstantialUpdateAt||item.updatedAt,type:"Briefing"
    })),
    ...briefs.slice(0,50).map(item=>({
      title:item.title,url:`${base}/briefs/${item.slug}`,deck:item.deck,
      date:item.updatedAt||null,type:"Living Brief"
    }))
  ].sort((a,b)=>Date.parse(b.date||"0")-Date.parse(a.date||"0")).slice(0,75);
  const body=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Briefs</title><link>${xml(base)}</link><description>Living Briefs and original evidence-backed Briefings.</description><language>en</language>${merged.map(item=>`<item><title>${xml(item.title)}</title><link>${xml(item.url)}</link><guid isPermaLink="true">${xml(item.url)}</guid><category>${xml(item.type)}</category><description>${xml(item.deck)}</description>${item.date?`<pubDate>${new Date(item.date).toUTCString()}</pubDate>`:""}</item>`).join("")}</channel></rss>`;
  return new NextResponse(body,{headers:{"content-type":"application/rss+xml; charset=utf-8","cache-control":"public, max-age=300, s-maxage=900"}});
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

function xml(value:string){return value.replace(/[<>&'\"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]||ch));}
export const dynamic="force-dynamic";
export async function GET(){
  const base=briefsBaseUrl();
  let items:Array<{url:string;title:string;published:string}>=[];
  if(process.env.DATABASE_URL){
    const sql=db();
    try{
      const rows=await sql`select slug,title,coalesce(last_substantial_update_at,last_verified_at,updated_at) published from briefs where status='published' and coalesce(last_substantial_update_at,last_verified_at,updated_at)>=now()-interval '2 days' order by published desc limit 1000`;
      items.push(...(rows as any[]).map(r=>({url:`${base}/briefs/${String(r.slug)}`,title:String(r.title),published:new Date(r.published).toISOString()})));
    }catch(error){console.error("Brief news sitemap degraded",error);}
    try{
      const rows=await sql`select slug,title,coalesce(published_at,last_substantial_update_at,updated_at) published from publication_articles where status='published' and coalesce(published_at,last_substantial_update_at,updated_at)>=now()-interval '2 days' order by published desc limit 1000`;
      items.push(...(rows as any[]).map(r=>({url:`${base}/articles/${String(r.slug)}`,title:String(r.title),published:new Date(r.published).toISOString()})));
    }catch(error){console.error("Publication news sitemap degraded",error);}
    items=items.sort((a,b)=>b.published.localeCompare(a.published)).slice(0,1000);
  }
  const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items.map(item=>`<url><loc>${xml(item.url)}</loc><news:news><news:publication><news:name>Briefs</news:name><news:language>en</news:language></news:publication><news:publication_date>${xml(item.published)}</news:publication_date><news:title>${xml(item.title)}</news:title></news:news></url>`).join("")}</urlset>`;
  return new NextResponse(body,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=300, s-maxage=900"}});
}

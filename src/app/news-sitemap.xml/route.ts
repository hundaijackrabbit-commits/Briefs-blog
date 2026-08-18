import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

function xml(value:string){return value.replace(/[<>&'\"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]||ch));}
export const dynamic="force-dynamic";
export async function GET(){
  const base=briefsBaseUrl(); let items:Array<{slug:string;title:string;published:string}>=[];
  if(process.env.DATABASE_URL){try{const sql=db();const rows=await sql`select slug,title,coalesce(last_substantial_update_at,last_verified_at,updated_at) published from briefs where status='published' and coalesce(last_substantial_update_at,last_verified_at,updated_at)>=now()-interval '2 days' order by published desc limit 1000`;items=(rows as any[]).map(r=>({slug:String(r.slug),title:String(r.title),published:new Date(r.published).toISOString()}));}catch(error){console.error("news sitemap fallback",error);}}
  const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items.map(item=>`<url><loc>${xml(`${base}/briefs/${item.slug}`)}</loc><news:news><news:publication><news:name>Briefs</news:name><news:language>en</news:language></news:publication><news:publication_date>${xml(item.published)}</news:publication_date><news:title>${xml(item.title)}</news:title></news:news></url>`).join("")}</urlset>`;
  return new NextResponse(body,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=300, s-maxage=900"}});
}

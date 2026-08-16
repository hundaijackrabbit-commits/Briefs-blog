import { createHash } from "crypto";
import { retry, withTimeout } from "@/lib/reliability";
import type { NormalizedDocument, SourceRecord } from "@/lib/types";

function decode(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function tag(block:string,name:string){const m=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,`i`));return m?decode(m[1].trim()):null;}
function attr(block:string,name:string,attrName:string){const m=block.match(new RegExp(`<${name}[^>]*${attrName}=["']([^"']+)["'][^>]*\\/?>(?:<\\/${name}>)?`,`i`));return m?decode(m[1]):null;}
function stripHtml(s:string|null){return s?s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim():null;}

export async function ingestRss(source:SourceRecord):Promise<NormalizedDocument[]>{
  if(!source.feed_url) return [];
  const timeout=source.request_timeout_ms || Number(process.env.SOURCE_REQUEST_TIMEOUT_MS||12000);
  const xml=await retry(async()=>{
    const res=await withTimeout(fetch(source.feed_url!,{headers:{"user-agent":"BriefsBot/0.2 (+https://briefs.blog)"}}),timeout,`fetch ${source.id}`);
    if(!res.ok) throw new Error(`${source.id} returned HTTP ${res.status}`);
    return await withTimeout(res.text(),timeout,`read ${source.id}`);
  },{attempts:Math.max(1,source.max_retries||3)});
  const blocks=[...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(m=>m[0]);
  return blocks.slice(0,100).map((b,i)=>{
    const link=tag(b,"link")||attr(b,"link","href")||source.url;
    const title=stripHtml(tag(b,"title"))||"Untitled";
    const desc=stripHtml(tag(b,"description")||tag(b,"summary")||tag(b,"content"));
    const published=tag(b,"pubDate")||tag(b,"published")||tag(b,"updated");
    const external=tag(b,"guid")||tag(b,"id")||link||`${source.id}-${i}`;
    const contentHash=createHash("sha256").update([source.id,link,title,desc||"",published||""].join("\n")).digest("hex");
    return {sourceId:source.id,externalKey:external,canonicalUrl:link,title,excerpt:desc,body:null,authors:[],language:"en",publishedAt:published?new Date(published):null,retrievedAt:new Date(),contentHash,metadata:{adapter:"rss"}};
  });
}

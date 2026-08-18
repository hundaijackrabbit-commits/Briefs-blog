import type { MetadataRoute } from "next";
import { briefsBaseUrl } from "@/lib/distribution/base-url";
import { listPublicBriefs } from "@/lib/distribution/public-brief";

export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=briefsBaseUrl(); const briefs=await listPublicBriefs();
  return [
    {url:base,lastModified:new Date(),changeFrequency:"daily",priority:1},
    {url:`${base}/briefs`,lastModified:new Date(),changeFrequency:"daily",priority:.8},
    {url:`${base}/methodology`,lastModified:new Date("2026-08-18T00:00:00Z"),changeFrequency:"monthly",priority:.5},
    {url:`${base}/developers`,lastModified:new Date("2026-08-18T00:00:00Z"),changeFrequency:"monthly",priority:.4},
    ...briefs.map(item=>({url:`${base}/briefs/${encodeURIComponent(item.slug)}`,lastModified:item.updatedAt?new Date(item.updatedAt):new Date(),changeFrequency:"daily" as const,priority:.8}))
  ];
}

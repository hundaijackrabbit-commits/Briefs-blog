import type { MetadataRoute } from "next";
import { briefsBaseUrl } from "@/lib/distribution/base-url";
import { listPublicBriefs } from "@/lib/distribution/public-brief";
import { listPublishedArticles } from "@/lib/publication/public";

export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=briefsBaseUrl();
  const [briefs,articles]=await Promise.all([listPublicBriefs(),listPublishedArticles(500)]);
  return [
    {url:base,lastModified:new Date(),changeFrequency:"daily",priority:1},
    {url:`${base}/briefs`,lastModified:new Date(),changeFrequency:"daily",priority:.8},
    {url:`${base}/articles`,lastModified:new Date(),changeFrequency:"daily",priority:.85},
    {url:`${base}/methodology`,lastModified:new Date("2026-08-18T00:00:00Z"),changeFrequency:"monthly",priority:.5},
    {url:`${base}/developers`,lastModified:new Date("2026-08-18T00:00:00Z"),changeFrequency:"monthly",priority:.4},
    ...briefs.map(item=>({url:`${base}/briefs/${encodeURIComponent(item.slug)}`,lastModified:item.updatedAt?new Date(item.updatedAt):new Date(),changeFrequency:"daily" as const,priority:.8})),
    ...articles.map(item=>({url:`${base}/articles/${encodeURIComponent(item.slug)}`,lastModified:new Date(item.lastSubstantialUpdateAt||item.updatedAt),changeFrequency:"daily" as const,priority:.75}))
  ];
}

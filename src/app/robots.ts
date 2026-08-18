import type { MetadataRoute } from "next";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

export default function robots():MetadataRoute.Robots{
  const base=briefsBaseUrl();
  return {rules:[{userAgent:"*",allow:["/","/briefs/","/methodology","/developers","/feed.xml","/news-sitemap.xml","/llms.txt"],disallow:["/admin/","/api/","/my-briefs","/brief-me"]}],sitemap:[`${base}/sitemap.xml`,`${base}/news-sitemap.xml`],host:base};
}

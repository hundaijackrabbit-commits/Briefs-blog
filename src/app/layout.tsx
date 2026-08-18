import "./globals.css";
import type { Metadata } from "next";
import { briefsBaseUrl } from "@/lib/distribution/base-url";

const base=briefsBaseUrl();
export const metadata:Metadata={
  title:{default:"Briefs — Brief me on…",template:"%s | Briefs"},
  description:"Living, sourced briefings built from a continuously maintained knowledge system.",
  metadataBase:new URL(base),
  alternates:{types:{"application/rss+xml":"/feed.xml"}},
  openGraph:{siteName:"Briefs",type:"website",url:base,title:"Briefs",description:"Living, sourced briefings with explicit evidence and freshness."},
  twitter:{card:"summary_large_image",title:"Briefs",description:"Living, sourced briefings with explicit evidence and freshness."}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  const website={"@context":"https://schema.org","@type":"WebSite",name:"Briefs",url:base,potentialAction:{"@type":"SearchAction",target:`${base}/brief-me?q={search_term_string}`,"query-input":"required name=search_term_string"}};
  const organization={"@context":"https://schema.org","@type":"Organization",name:"Briefs",url:base};
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(website).replace(/</g,"\\u003c")}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization).replace(/</g,"\\u003c")}}/><div className="wrap"><header className="nav nav-minimal"><a className="brand" href="/">BRIEFS.</a><a className="nav-personal" href="/my-briefs">My Briefs</a></header>{children}<footer className="site-footer"><a href="/briefs">Explore</a><a href="/methodology">Methodology</a><a href="/feed.xml">RSS</a><a href="/developers">API</a></footer></div></body></html>;
}

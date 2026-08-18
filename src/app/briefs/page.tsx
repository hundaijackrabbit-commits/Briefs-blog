import type { Metadata } from "next";
import Link from "next/link";
import { listPublicBriefs } from "@/lib/distribution/public-brief";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Explore Briefs",description:"Browse public, evidence-backed Briefs with explicit freshness and provenance.",alternates:{canonical:"/briefs"}};

export default async function BriefsIndex(){
  const items=await listPublicBriefs();
  return <main className="section public-index"><p className="eyebrow">BRIEFS · PUBLIC KNOWLEDGE</p><h1>Explore Briefs</h1><p className="lede">Living reference pages with explicit evidence, confidence and freshness.</p><div className="public-grid">{items.map(item=><Link className="card public-card" href={`/briefs/${item.slug}`} key={item.slug}><span className="pill">{item.category}</span><h2>{item.title}</h2><p>{item.deck}</p><small>{item.updatedAt?`Verified/updated ${new Date(item.updatedAt).toLocaleDateString()}`:"Verification pending"}</small></Link>)}</div></main>;
}

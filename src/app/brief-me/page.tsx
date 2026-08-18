import type { Metadata } from "next";
import BriefClient from "./brief-client";

type Params={q?:string|string[]};
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Brief me on…",robots:{index:false,follow:true},alternates:{canonical:"/"}};

export default async function BriefMe({searchParams}:{searchParams:Promise<Params>}){
  const params=await searchParams;
  const raw=Array.isArray(params.q)?params.q[0]:params.q;
  const q=(raw||"").trim().slice(0,200);
  return <BriefClient initialSubject={q}/>;
}

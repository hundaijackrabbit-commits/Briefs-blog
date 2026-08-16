import BriefClient from "./brief-client";

type Params={q?:string|string[]};
export const dynamic="force-dynamic";

export default async function BriefMe({searchParams}:{searchParams:Promise<Params>}){
  const params=await searchParams;
  const raw=Array.isArray(params.q)?params.q[0]:params.q;
  const q=(raw||"").trim().slice(0,200);
  return <BriefClient initialSubject={q}/>;
}

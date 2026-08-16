import { NextResponse } from "next/server";

export const dynamic="force-dynamic";
export async function GET(){
  return NextResponse.json({
    version:"0.6.0",
    researchEngine:"ready",
    providers:[
      {id:"wikipedia",mode:"keyless",role:"narrative/reference baseline"},
      {id:"wikidata",mode:"keyless",role:"structured entity facts"}
    ],
    databasePersistence:Boolean(process.env.DATABASE_URL),
    policy:"Evidence gaps remain explicit when research cannot corroborate a subject safely."
  });
}

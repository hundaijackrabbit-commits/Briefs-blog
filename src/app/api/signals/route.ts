import { NextResponse } from "next/server";
import { latestSignals } from "@/lib/intelligence/signals";
export const dynamic="force-dynamic";
export async function GET(){const signals=await latestSignals(20);return NextResponse.json({version:"1.0.0",signals,databaseRequired:!process.env.DATABASE_URL,method:"7-day observed-change velocity weighted by source diversity and importance"},{headers:{"cache-control":"public, max-age=300"}});}

import { NextResponse } from "next/server";
export function GET(){ return NextResponse.json({ ok:true, service:"briefs-blog", engine:"v1", timestamp:new Date().toISOString() }); }

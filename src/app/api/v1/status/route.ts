import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({ok:true,service:"briefs-public-api",version:"v1",productVersion:"0.9.0",capabilities:["brief","evidence","freshness","exports"]},{headers:{"cache-control":"public, max-age=60","access-control-allow-origin":"*","x-briefs-version":"0.9.0"}});}

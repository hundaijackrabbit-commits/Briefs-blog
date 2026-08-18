import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, validAdminCookie } from "@/lib/admin-session";

export async function proxy(request:NextRequest){
  const path=request.nextUrl.pathname;
  if(!path.startsWith("/admin")||path==="/admin/login") return NextResponse.next();
  const secret=process.env.ADMIN_TOKEN;
  if(await validAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value,secret)) return NextResponse.next();
  const url=request.nextUrl.clone();
  url.pathname="/admin/login";
  url.searchParams.set("next",path);
  return NextResponse.redirect(url);
}

export const config={matcher:["/admin/:path*"]};

const encoder=new TextEncoder();

async function digest(value:string){
  const data=await crypto.subtle.digest("SHA-256",encoder.encode(value));
  return Array.from(new Uint8Array(data)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

export const ADMIN_COOKIE="briefs_admin_v8";

export async function adminCookieValue(secret:string){
  return digest(`briefs-admin-v8:${secret}`);
}

export async function validAdminCookie(cookieValue:string|undefined,secret:string|undefined){
  if(!cookieValue||!secret) return false;
  return cookieValue===await adminCookieValue(secret);
}

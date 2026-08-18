export function briefsBaseUrl(){
  const raw=(process.env.BRIEFS_BASE_URL||"https://briefs.blog").trim();
  try{return new URL(raw).origin;}catch{return "https://briefs.blog";}
}

export function absoluteBriefUrl(slug:string){
  return `${briefsBaseUrl()}/briefs/${encodeURIComponent(slug)}`;
}

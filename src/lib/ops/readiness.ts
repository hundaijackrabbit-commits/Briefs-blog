export type ReadinessItem={key:string;label:string;required:boolean;configured:boolean;detail:string};

function configured(name:string){return Boolean(process.env[name]?.trim());}

export function productionReadiness(){
  const items:ReadinessItem[]=[
    {key:"database",label:"Persistent Postgres knowledge store",required:true,configured:configured("DATABASE_URL"),detail:"Required for persistent learning, accounts, living change history and cross-device personalization."},
    {key:"admin",label:"Admin authentication secret",required:true,configured:configured("ADMIN_TOKEN"),detail:"Protects editorial and operational admin surfaces."},
    {key:"cron",label:"Cron authentication secret",required:true,configured:configured("CRON_SECRET"),detail:"Protects autonomous daily/worker jobs."},
    {key:"base-url",label:"Canonical public base URL",required:true,configured:configured("BRIEFS_BASE_URL"),detail:"Used for canonical URLs, feeds and public metadata."},
    {key:"market",label:"Specialist market quote provider",required:false,configured:configured("ALPHA_VANTAGE_API_KEY"),detail:"Optional. Without it finance Briefs still use SEC primary evidence but do not invent quotes."},
    {key:"email",label:"Email delivery",required:false,configured:configured("RESEND_API_KEY")&&configured("BRIEFS_FROM_EMAIL"),detail:"Optional. Enables personal digest email delivery."}
  ];
  const required=items.filter(i=>i.required);
  const missingRequired=required.filter(i=>!i.configured);
  return {
    status:missingRequired.length===0?"ready" as const:"degraded" as const,
    score:Math.round((items.filter(i=>i.configured).length/items.length)*100),
    requiredReady:required.length-missingRequired.length,
    requiredTotal:required.length,
    missingRequired:missingRequired.map(i=>i.key),
    items
  };
}

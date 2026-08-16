import type { Brief, Claim, ReviewItem, Source } from "./types";

export const sources: Source[] = [
  { id:"src-openai", name:"OpenAI Newsroom", url:"https://openai.com/news/", sourceType:"primary", tier:"A" },
  { id:"src-sec", name:"U.S. SEC", url:"https://www.sec.gov/", sourceType:"primary", tier:"A" },
  { id:"src-nvidia-ir", name:"NVIDIA Investor Relations", url:"https://investor.nvidia.com/", sourceType:"primary", tier:"A" },
  { id:"src-reuters", name:"Reuters", url:"https://www.reuters.com/", sourceType:"reporting", tier:"B" }
];

export const claims: Claim[] = [
  { id:"c1", entityId:"openai", key:"organization_type", value:"AI research and deployment company", freshnessClass:"slow", confidence:"high", sourceIds:["src-openai"], lastVerifiedAt:"2026-08-14T15:00:00Z" },
  { id:"c2", entityId:"nvidia", key:"primary_business", value:"Accelerated computing platforms and GPUs", freshnessClass:"slow", confidence:"high", sourceIds:["src-nvidia-ir","src-sec"], lastVerifiedAt:"2026-08-14T15:00:00Z" },
  { id:"c3", entityId:"ai-agents", key:"definition", value:"Software systems that can plan and perform multi-step tasks using models, tools and external systems.", freshnessClass:"current", confidence:"high", sourceIds:["src-openai"], lastVerifiedAt:"2026-08-14T15:00:00Z" }
];

export const briefs: Brief[] = [
  {
    id:"b-ai-agents", slug:"ai-agents", title:"AI agents", category:"AI & Technology",
    deck:"What they are, why companies are building them and what still gets in the way.",
    answer:"AI agents are software systems designed to do more than answer a prompt: they can plan, use tools, take actions and work through multi-step tasks toward a goal.",
    whyItMatters:"Agents move AI from a conversational interface toward software that can actually execute work. That creates major productivity opportunities, but also raises reliability, security and oversight problems.",
    context:"The important shift is not that models suddenly became autonomous. It is that stronger models are being connected to browsers, code runtimes, APIs, databases and business software, giving them a larger action surface.",
    watchNext:["Reliability on long-running tasks","Permission and identity controls","Enterprise adoption beyond pilots"],
    claimIds:["c3"], sourceIds:["src-openai"], lastVerifiedAt:"2026-08-14T15:00:00Z", lastSubstantialUpdateAt:"2026-08-14T15:00:00Z", freshnessScore:98, readingMinutes:4
  },
  {
    id:"b-nvidia", slug:"nvidia", title:"NVIDIA", category:"Companies",
    deck:"The essential living brief on the company at the center of accelerated computing.",
    answer:"NVIDIA designs accelerated-computing platforms built around GPUs and related systems, with data-center AI workloads becoming central to its strategic importance.",
    whyItMatters:"NVIDIA sits at a critical infrastructure layer for modern AI. Changes in its products, supply, customers or financial results can ripple through cloud providers, model developers and semiconductor supply chains.",
    context:"A useful NVIDIA brief has to stay current because product cycles, export rules, customer concentration and financial metrics can change quickly.",
    watchNext:["New architecture rollout","Data-center demand","Export controls and supply constraints"],
    claimIds:["c2"], sourceIds:["src-nvidia-ir","src-sec","src-reuters"], lastVerifiedAt:"2026-08-14T14:30:00Z", lastSubstantialUpdateAt:"2026-08-14T14:30:00Z", freshnessScore:96, readingMinutes:5
  },
  {
    id:"b-openai", slug:"openai", title:"OpenAI", category:"Companies",
    deck:"A continuously maintained brief on the organization, products and developments that matter.",
    answer:"OpenAI is an AI research and deployment company whose products and model releases have made it a central participant in the current generative-AI market.",
    whyItMatters:"Its model capabilities, product decisions, partnerships and governance can affect how businesses and consumers adopt AI and how competitors respond.",
    context:"Because model, product and partnership information changes quickly, this page is designed as a living brief rather than a static company profile.",
    watchNext:["Model and product releases","Enterprise adoption","Governance and regulation"],
    claimIds:["c1"], sourceIds:["src-openai","src-reuters"], lastVerifiedAt:"2026-08-14T15:10:00Z", lastSubstantialUpdateAt:"2026-08-14T15:10:00Z", freshnessScore:99, readingMinutes:5
  }
];

export const reviewQueue: ReviewItem[] = [
  { id:"r1", briefId:"b-nvidia", title:"NVIDIA financial metrics", reason:"New primary-source filing detected; financial claims should be compared.", confidence:"high", mode:"review", detectedAt:"2026-08-14T15:12:00Z" },
  { id:"r2", briefId:"b-ai-agents", title:"AI agents terminology", reason:"Multiple sources are using a newer term; definition may need context, not replacement.", confidence:"medium", mode:"manual", detectedAt:"2026-08-14T15:08:00Z" }
];

import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { ResearchFinding, ResearchSource } from "@/lib/research/types";

export type SecCompanyMatch={cik:number;ticker:string;title:string};
export type SecResearchResult={
  company:SecCompanyMatch;
  description:string;
  findings:ResearchFinding[];
  sources:ResearchSource[];
  recentFilings:Array<{form:string;filed:string;accession:string;primaryDocument:string}>;
};

type TickerRow={cik_str:number;ticker:string;title:string};
type TickerMap=Record<string,TickerRow>;
type SubmissionData={
  name?:string;tickers?:string[];exchanges?:string[];
  filings?:{recent?:{form?:string[];filingDate?:string[];accessionNumber?:string[];primaryDocument?:string[]}};
};
type FactUnit={val:number;end?:string;filed?:string;form?:string;fy?:number;fp?:string;frame?:string};
type CompanyFacts={facts?:Record<string,Record<string,{label?:string;description?:string;units?:Record<string,FactUnit[]>}>>};

let tickerCache:{expires:number;rows:SecCompanyMatch[]}|null=null;

function norm(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}

async function tickerRows(){
  if(tickerCache&&tickerCache.expires>Date.now()) return tickerCache.rows;
  const raw=await fetchJson<TickerMap>("https://www.sec.gov/files/company_tickers.json",6500);
  const rows=Object.values(raw).map(r=>({cik:r.cik_str,ticker:r.ticker.toUpperCase(),title:r.title}));
  tickerCache={expires:Date.now()+24*60*60*1000,rows};
  return rows;
}

function companyScore(row:SecCompanyMatch,query:string,tickerHint?:string){
  const q=norm(query); const title=norm(row.title);
  if(tickerHint&&row.ticker===tickerHint.toUpperCase()) return 120;
  if(q.toUpperCase()===row.ticker) return 115;
  if(q===title) return 110;
  if(title.startsWith(q+" ")||title===q) return 100;
  if(title.includes(q)&&q.length>=3) return 82;
  const qWords=q.split(" ").filter(Boolean);
  const overlap=qWords.filter(w=>title.split(" ").includes(w)).length;
  return overlap?50+overlap*8:0;
}

export async function resolveSecCompany(query:string,tickerHint?:string):Promise<SecCompanyMatch|null>{
  const rows=await tickerRows();
  const ranked=rows.map(row=>({row,score:companyScore(row,query,tickerHint)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  return ranked[0]?.row||null;
}

function money(value:number){
  const abs=Math.abs(value);
  if(abs>=1e12) return `$${(value/1e12).toFixed(2)}T`;
  if(abs>=1e9) return `$${(value/1e9).toFixed(2)}B`;
  if(abs>=1e6) return `$${(value/1e6).toFixed(2)}M`;
  return `$${value.toLocaleString("en-US",{maximumFractionDigits:2})}`;
}

function number(value:number){return value.toLocaleString("en-US",{maximumFractionDigits:2});}

function latestFact(data:CompanyFacts,tags:string[],preferredUnits:string[]){
  for(const taxonomy of ["us-gaap","dei"]){
    for(const tag of tags){
      const fact=data.facts?.[taxonomy]?.[tag]; if(!fact?.units) continue;
      for(const unit of preferredUnits){
        const rows=(fact.units[unit]||[]).filter(r=>["10-Q","10-K"].includes(r.form||"")&&r.filed&&Number.isFinite(r.val));
        rows.sort((a,b)=>(b.filed||"").localeCompare(a.filed||"")||(b.end||"").localeCompare(a.end||""));
        if(rows[0]) return {tag,label:fact.label||tag,unit,row:rows[0]};
      }
    }
  }
  return null;
}

function filingUrl(cik:number,accession:string,primaryDocument:string){
  const compact=accession.replace(/-/g,"");
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${compact}/${primaryDocument}`;
}

export async function researchSecCompany(query:string,tickerHint?:string):Promise<SecResearchResult|null>{
  const company=await resolveSecCompany(query,tickerHint); if(!company) return null;
  const cik10=String(company.cik).padStart(10,"0");
  const submissionsUrl=`https://data.sec.gov/submissions/CIK${cik10}.json`;
  const factsUrl=`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10}.json`;
  const [submissions,facts]=await Promise.all([
    fetchJson<SubmissionData>(submissionsUrl,6500),
    fetchJson<CompanyFacts>(factsUrl,7000)
  ]);
  const retrievedAt=new Date().toISOString();
  const subSourceId=stableResearchId("sec-sub",submissionsUrl);
  const factSourceId=stableResearchId("sec-facts",factsUrl);
  const sources:ResearchSource[]=[
    {id:subSourceId,provider:"external",name:"SEC EDGAR",title:`${submissions.name||company.title} submissions`,url:submissionsUrl,tier:"A",kind:"primary",retrievedAt,excerpt:"Official SEC filing history and issuer metadata.",authority:98,independenceFamily:"sec",metadata:{cik:company.cik,ticker:company.ticker}},
    {id:factSourceId,provider:"external",name:"SEC XBRL",title:`${submissions.name||company.title} company facts`,url:factsUrl,tier:"A",kind:"primary",retrievedAt,excerpt:"Official structured facts extracted from SEC filings.",authority:98,independenceFamily:"sec",metadata:{cik:company.cik,ticker:company.ticker}}
  ];
  const findings:ResearchFinding[]=[];
  const canonical=submissions.name||company.title;
  const exchange=(submissions.exchanges||[])[0];
  findings.push({id:stableResearchId("sec-f",`${company.cik}:ticker`),subject:canonical,predicate:"Ticker",valueText:company.ticker,statement:`${canonical} trades under ticker ${company.ticker}${exchange?` on ${exchange}`:""}.`,sourceIds:[subSourceId],confidence:"high",verificationStatus:"confirmed"});
  if(exchange) findings.push({id:stableResearchId("sec-f",`${company.cik}:exchange`),subject:canonical,predicate:"Exchange",valueText:exchange,statement:`Primary exchange: ${exchange}.`,sourceIds:[subSourceId],confidence:"high",verificationStatus:"confirmed"});

  const metrics=[
    {predicate:"Latest reported revenue",tags:["RevenueFromContractWithCustomerExcludingAssessedTax","SalesRevenueNet"],units:["USD"],format:money},
    {predicate:"Latest reported net income",tags:["NetIncomeLoss","ProfitLoss"],units:["USD"],format:money},
    {predicate:"Latest diluted EPS",tags:["EarningsPerShareDiluted"],units:["USD/shares"],format:(v:number)=>`$${number(v)}`},
    {predicate:"Latest reported assets",tags:["Assets"],units:["USD"],format:money},
    {predicate:"Latest reported cash",tags:["CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],units:["USD"],format:money}
  ];
  for(const metric of metrics){
    const hit=latestFact(facts,metric.tags,metric.units); if(!hit) continue;
    const value=metric.format(hit.row.val);
    const period=[hit.row.end,hit.row.form,hit.row.fp].filter(Boolean).join(" · ");
    findings.push({id:stableResearchId("sec-f",`${company.cik}:${hit.tag}:${hit.row.filed}:${hit.row.end}:${hit.row.val}`),subject:canonical,predicate:metric.predicate,valueText:value,statement:`${metric.predicate}: ${value}${period?` (${period})`:""}.`,sourceIds:[factSourceId],confidence:"high",verificationStatus:"confirmed"});
  }

  const recent=submissions.filings?.recent;
  const recentFilings:Array<{form:string;filed:string;accession:string;primaryDocument:string}>=[];
  if(recent?.form&&recent.filingDate&&recent.accessionNumber&&recent.primaryDocument){
    for(let i=0;i<recent.form.length&&recentFilings.length<8;i++){
      const form=recent.form[i];
      if(!["10-K","10-Q","8-K"].includes(form)) continue;
      recentFilings.push({form,filed:recent.filingDate[i],accession:recent.accessionNumber[i],primaryDocument:recent.primaryDocument[i]});
    }
  }
  for(const filing of recentFilings.slice(0,3)){
    const url=filingUrl(company.cik,filing.accession,filing.primaryDocument);
    const id=stableResearchId("sec-doc",url);
    sources.push({id,provider:"external",name:"SEC filing",title:`${canonical} ${filing.form} filed ${filing.filed}`,url,tier:"A",kind:"primary",retrievedAt,publishedAt:filing.filed,excerpt:`Official ${filing.form} filing for ${canonical}.`,authority:99,independenceFamily:"sec",metadata:{form:filing.form,filed:filing.filed}});
    findings.push({id:stableResearchId("sec-f",`${company.cik}:${filing.accession}`),subject:canonical,predicate:"Recent filing",valueText:`${filing.form} · ${filing.filed}`,statement:`${canonical} filed a ${filing.form} on ${filing.filed}.`,sourceIds:[id],confidence:"high",verificationStatus:"confirmed"});
  }
  return {company,description:`${canonical} (${company.ticker}) — investor-focused primary-source snapshot from SEC filings.`,findings,sources,recentFilings};
}

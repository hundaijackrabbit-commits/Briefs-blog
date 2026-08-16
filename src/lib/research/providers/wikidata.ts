import { fetchJson, stableResearchId } from "@/lib/research/http";
import type { ResearchFinding, ResearchProvider, ResearchQueryPlan, ResearchSource } from "@/lib/research/types";

type SearchResponse={search?:Array<{id:string;label:string;description?:string;concepturi?:string}>};
type Snak={datavalue?:{value:unknown;type:string};datatype?:string};
type Claim={mainsnak?:Snak;rank?:string};
type Entity={id:string;labels?:Record<string,{value:string}>;descriptions?:Record<string,{value:string}>;claims?:Record<string,Claim[]>;sitelinks?:Record<string,{title:string}>};
type EntitiesResponse={entities?:Record<string,Entity>};

const PROPERTY_LABELS:Record<string,string>={P31:"Instance of",P577:"Publication / release date",P571:"Inception",P580:"Start date",P582:"End date",P136:"Genre",P57:"Director",P161:"Cast member",P58:"Screenwriter",P170:"Creator",P175:"Performer",P123:"Publisher",P272:"Production company",P750:"Distributor",P495:"Country of origin",P17:"Country",P27:"Country of citizenship",P856:"Official website"};

function entityId(value:unknown){
  if(typeof value!=="object"||!value) return null;
  const obj=value as Record<string,unknown>;
  return typeof obj.id==="string"?obj.id:null;
}

function renderPrimitive(value:unknown):string|null{
  if(typeof value==="string"||typeof value==="number") return String(value);
  if(typeof value!=="object"||!value) return null;
  const obj=value as Record<string,unknown>;
  if(typeof obj.time==="string") return obj.time.replace(/^\+/,"").replace(/T00:00:00Z$/,"");
  if(typeof obj.text==="string") return obj.text;
  if(typeof obj.amount==="string") return obj.amount.replace(/^\+/,"");
  return null;
}

async function labelsFor(ids:string[]){
  const unique=[...new Set(ids)].slice(0,45);
  if(!unique.length) return new Map<string,string>();
  const url=`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(unique.join("|"))}&props=labels&languages=en&format=json&origin=*`;
  const data=await fetchJson<EntitiesResponse>(url);
  const map=new Map<string,string>();
  for(const [id,entity] of Object.entries(data.entities||{})) map.set(id,entity.labels?.en?.value||id);
  return map;
}

export const wikidataProvider:ResearchProvider={
  id:"wikidata",
  async research(subject:string,plan:ResearchQueryPlan){
    const searchUrl=`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(subject)}&language=en&uselang=en&limit=3&format=json&origin=*`;
    const search=await fetchJson<SearchResponse>(searchUrl);
    const match=search.search?.[0];
    if(!match) return {findings:[],sources:[]};
    const entityUrl=`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${match.id}&props=labels%7Cdescriptions%7Cclaims%7Csitelinks&languages=en&sitefilter=enwiki&format=json&origin=*`;
    const data=await fetchJson<EntitiesResponse>(entityUrl);
    const entity=data.entities?.[match.id];
    if(!entity) return {findings:[],sources:[]};
    const sourceUrl=`https://www.wikidata.org/wiki/${match.id}`;
    const sourceId=stableResearchId("wd",match.id);
    const retrievedAt=new Date().toISOString();
    const source:ResearchSource={id:sourceId,provider:"wikidata",name:"Wikidata",title:`${match.label} (${match.id})`,url:sourceUrl,tier:"B",kind:"structured",retrievedAt,excerpt:match.description||"Structured entity record",authority:64,independenceFamily:"wikimedia",metadata:{entityId:match.id,wikipediaTitle:entity.sitelinks?.enwiki?.title||null}};
    const wanted=Object.keys(PROPERTY_LABELS);
    const entityRefs:string[]=[];
    for(const prop of wanted) for(const claim of (entity.claims?.[prop]||[]).slice(0,4)){
      const id=entityId(claim.mainsnak?.datavalue?.value); if(id) entityRefs.push(id);
    }
    const labels=await labelsFor(entityRefs);
    const findings:ResearchFinding[]=[];
    for(const prop of wanted){
      const claims=(entity.claims?.[prop]||[]).filter(c=>c.rank!=="deprecated").slice(0,prop==="P161"?3:2);
      for(const claim of claims){
        const raw=claim.mainsnak?.datavalue?.value;
        if(raw===undefined) continue;
        const ref=entityId(raw);
        const value=ref?(labels.get(ref)||ref):renderPrimitive(raw);
        if(!value) continue;
        const predicate=PROPERTY_LABELS[prop];
        const statement=`${predicate}: ${value}.`;
        findings.push({id:stableResearchId("wdf",`${match.id}:${prop}:${value}`),subject:match.label,predicate,valueText:value,statement,sourceIds:[sourceId],confidence:"medium",verificationStatus:"reported"});
        if(findings.length>=Math.max(6,plan.maxSources)) break;
      }
      if(findings.length>=Math.max(6,plan.maxSources)) break;
    }
    return {canonicalSubject:match.label,description:match.description||undefined,findings,sources:[source]};
  }
};

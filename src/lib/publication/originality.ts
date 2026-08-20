import { db } from "@/lib/db";
import type { OriginalityMatchDiagnostic,OriginalityReport,OriginalitySourceInput } from "@/lib/publication/types";

const STOP=new Set("the a an and or but if then than to of in on for with by from as at is are was were be been being it its this that these those into about after before over under what why how who which when where can could should would may might will just not no do does did has have had".split(" "));
function tokens(text:string){return text.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim().split(" ").filter(Boolean);}
function contentTokens(text:string){return tokens(text).filter(t=>t.length>2&&!STOP.has(t));}
function ngramsFrom(list:string[],n:number){const out=new Set<string>();for(let i=0;i<=list.length-n;i++)out.add(list.slice(i,i+n).join(" "));return out;}
function ngramRatio(a:string,b:string,n=7,contentOnly=false){
  const A=ngramsFrom(contentOnly?contentTokens(a):tokens(a),n),B=ngramsFrom(contentOnly?contentTokens(b):tokens(b),n);
  if(!A.size||!B.size)return 0;
  let matches=0;for(const g of A)if(B.has(g))matches++;
  const denominator=Math.max(4,Math.sqrt(A.size*B.size));
  return Math.min(1,matches/denominator);
}
function longestMatchDetail(a:string,b:string,cap=36){
  const A=tokens(a),B=tokens(b);if(!A.length||!B.length)return {words:0,phrase:""};
  const index=new Map<string,number[]>();B.forEach((word,i)=>index.set(word,[...(index.get(word)||[]),i]));
  let best=0,bestStart=0;
  for(let i=0;i<A.length;i++){for(const j of index.get(A[i])||[]){let k=0;while(k<cap&&i+k<A.length&&j+k<B.length&&A[i+k]===B[j+k])k++;if(k>best){best=k;bestStart=i;}if(best>=cap)break;}}
  return {words:best,phrase:A.slice(bestStart,bestStart+best).join(" ")};
}
function cosine(a:string,b:string){
  const A=contentTokens(a),B=contentTokens(b);if(A.length<20||B.length<20)return 0;
  const fa=new Map<string,number>(),fb=new Map<string,number>();
  for(const w of A)fa.set(w,(fa.get(w)||0)+1);for(const w of B)fb.set(w,(fb.get(w)||0)+1);
  let dot=0,aa=0,bb=0;for(const v of fa.values())aa+=v*v;for(const v of fb.values())bb+=v*v;for(const [w,v] of fa)dot+=v*(fb.get(w)||0);
  return aa&&bb?dot/Math.sqrt(aa*bb):0;
}
function imitationRisk(a:string,b:string){
  const exact7=ngramRatio(a,b,7,false),distinctive5=ngramRatio(a,b,5,true),vocab=cosine(a,b);
  const vocabRisk=vocab>.78?(vocab-.78)/.22:0;
  return Math.max(exact7,distinctive5*.82,vocabRisk*.45);
}
function stripMarkedQuotes(text:string){return text.replace(/[“"][^”"\n]{1,240}[”"]/g," ").replace(/\s+/g," ").trim();}
function normalizedInput(value:string|OriginalitySourceInput,index:number):OriginalitySourceInput{return typeof value==="string"?{sourceId:`source-${index+1}`,sourceName:`Source ${index+1}`,sourceTitle:"",text:value}:value;}
function diagnostic(scope:"source"|"library",risk:number,detail:{words:number;phrase:string},extra:Partial<OriginalityMatchDiagnostic>):OriginalityMatchDiagnostic{return {scope,risk,matchingWords:detail.words,phrase:detail.phrase,...extra};}

export async function originalityReport(draftText:string,sourceInputs:Array<string|OriginalitySourceInput>,excludeArticleId?:string):Promise<OriginalityReport>{
  let maxSourceOverlap=0,maxLibraryOverlap=0,longestMatchingWords=0;
  let strongestSourceMatch:OriginalityMatchDiagnostic|undefined;
  let strongestLibraryMatch:OriginalityMatchDiagnostic|undefined;
  const comparableDraft=stripMarkedQuotes(draftText);

  for(let i=0;i<sourceInputs.length;i++){
    const source=normalizedInput(sourceInputs[i],i);if(!source.text)continue;
    const risk=imitationRisk(comparableDraft,source.text),detail=longestMatchDetail(comparableDraft,source.text);
    maxSourceOverlap=Math.max(maxSourceOverlap,risk);longestMatchingWords=Math.max(longestMatchingWords,detail.words);
    if(!strongestSourceMatch||risk>strongestSourceMatch.risk||detail.words>strongestSourceMatch.matchingWords)strongestSourceMatch=diagnostic("source",risk,detail,{sourceId:source.sourceId,sourceName:source.sourceName,sourceTitle:source.sourceTitle});
  }

  if(process.env.DATABASE_URL){
    try{
      const sql=db();
      const rows=await sql`select a.id,a.title,s.heading,s.body from publication_article_sections s join publication_articles a on a.id=s.article_id where a.status='published' and (${excludeArticleId??null}::uuid is null or a.id<>${excludeArticleId??null}::uuid) order by a.published_at desc nulls last limit 300`;
      for(const row of rows as unknown as Array<{id:string;title:string;heading:string;body:string}>){
        const library=`${row.title}\n${row.heading}\n${row.body}`,risk=imitationRisk(comparableDraft,library),detail=longestMatchDetail(comparableDraft,library);
        maxLibraryOverlap=Math.max(maxLibraryOverlap,risk);longestMatchingWords=Math.max(longestMatchingWords,detail.words);
        if(!strongestLibraryMatch||risk>strongestLibraryMatch.risk||detail.words>strongestLibraryMatch.matchingWords)strongestLibraryMatch=diagnostic("library",risk,detail,{articleId:String(row.id),articleTitle:String(row.title)});
      }
    }catch{/* source-side originality still runs */}
  }

  const warnings:string[]=[];
  if(maxSourceOverlap>.14)warnings.push("Draft has elevated phrase/structure overlap with a research source; review is recommended.");
  if(maxLibraryOverlap>.20)warnings.push("Draft has elevated similarity to an existing Briefs article; review is recommended.");
  if(longestMatchingWords>=10)warnings.push(`A ${longestMatchingWords}-word exact phrase match was detected.`);

  const blockingReasons:string[]=[];
  const hardExact=longestMatchingWords>=14;
  const hardSource=maxSourceOverlap>=.34;
  const hardLibrary=maxLibraryOverlap>=.36;
  const hardSourceCombined=maxSourceOverlap>=.30&&longestMatchingWords>=12;
  const hardLibraryCombined=maxLibraryOverlap>=.32&&longestMatchingWords>=12;

  if(hardExact)blockingReasons.push(`Exact phrase overlap is too long (${longestMatchingWords} words; maximum allowed is 13).`);
  if(hardSource)blockingReasons.push(`Source-overlap risk is too high (${Math.round(maxSourceOverlap*100)}%).`);
  else if(hardSourceCombined)blockingReasons.push(`Source-overlap risk (${Math.round(maxSourceOverlap*100)}%) combines with a ${longestMatchingWords}-word exact match.`);
  if(hardLibrary)blockingReasons.push(`Library-overlap risk is too high (${Math.round(maxLibraryOverlap*100)}%).`);
  else if(hardLibraryCombined)blockingReasons.push(`Library-overlap risk (${Math.round(maxLibraryOverlap*100)}%) combines with a ${longestMatchingWords}-word exact match.`);

  if(strongestSourceMatch&&longestMatchingWords>=10)warnings.push(`Strongest source match: ${strongestSourceMatch.sourceName||"unknown source"}${strongestSourceMatch.sourceTitle?` — ${strongestSourceMatch.sourceTitle}`:""}; phrase: "${strongestSourceMatch.phrase}".`);

  return {passed:blockingReasons.length===0,maxSourceOverlap,maxLibraryOverlap,longestMatchingWords,warnings,blockingReasons,diagnostics:{strongestSourceMatch,strongestLibraryMatch}};
}

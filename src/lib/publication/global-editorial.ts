import { db } from "@/lib/db";
import { discoverGlobalEvents } from "@/lib/publication/global-discovery";
import { rankGlobalCandidates } from "@/lib/publication/distinctiveness";
import type { DailyFlagshipResult,GlobalScoredCandidate } from "@/lib/publication/global-types";
import { publishArticle,researchKeyword } from "@/lib/publication/pipeline";

function todayUtc(){return new Date().toISOString().slice(0,10);}
function json(value:unknown){return JSON.parse(JSON.stringify(value));}
function articleStatus(result:Record<string,unknown>){return typeof result.status==="string"?result.status:"unknown";}

async function existingFlagship(day:string){
  const sql=db();
  const row=(await sql`
    select f.id,f.editorial_day,f.subject,f.category,f.final_score,f.opportunity_id,f.article_id,f.status,a.status article_status
    from publication_daily_flagships f
    left join publication_articles a on a.id=f.article_id
    where f.editorial_day=${day}::date limit 1
  `)[0] as unknown as {id:string;editorial_day:string|Date;subject:string;category:string;final_score:number;opportunity_id:string|null;article_id:string|null;status:string;article_status:string|null}|undefined;
  return row;
}

async function persistCandidate(runId:string,candidate:GlobalScoredCandidate){
  const sql=db();
  const row=(await sql`
    insert into publication_global_candidates(
      run_id,event_key,subject,research_query,category,regions,source_countries,source_families,
      mention_count,newest_at,geographic_reach,human_consequence,economic_consequence,
      political_impact,long_term_consequence,surprise_velocity,public_attention,evidence_breadth,
      importance_score,distinctiveness_score,repeat_penalty,final_score,material_change_override,
      rationale,source_urls,title_samples,selected,status
    ) values(
      ${runId}::uuid,${candidate.eventKey},${candidate.subject},${candidate.researchQuery},${candidate.category},
      ${sql.json(json(candidate.regions))},${sql.json(json(candidate.sourceCountries))},${sql.json(json(candidate.domains))},
      ${candidate.mentionCount},${candidate.newestAt}::timestamptz,${candidate.geographicReach},${candidate.humanConsequence},
      ${candidate.economicConsequence},${candidate.politicalImpact},${candidate.longTermConsequence},${candidate.surpriseVelocity},
      ${candidate.publicAttention},${candidate.evidenceBreadth},${candidate.importanceScore},${candidate.distinctivenessScore},
      ${candidate.repeatPenalty},${candidate.finalScore},${candidate.materialChangeOverride},${sql.json(json(candidate.rationale))},
      ${sql.json(json(candidate.urls))},${sql.json(json(candidate.titles))},false,'candidate'
    ) returning id
  `)[0];
  return String(row.id);
}

async function ensureFlagshipKeyword(candidate:GlobalScoredCandidate){
  const sql=db();
  const row=(await sql`
    insert into publication_keywords(keyword,category,audience_key,editorial_mode,min_sources,require_primary,freshness_hours,min_story_score,active,system_owned,next_research_at)
    values(${candidate.researchQuery},${candidate.category},'smart-generalist','review',3,false,24,72,true,true,now())
    on conflict(keyword) do update set
      category=excluded.category,audience_key='smart-generalist',freshness_hours=24,
      min_story_score=greatest(publication_keywords.min_story_score,72),active=true,next_research_at=now(),updated_at=now()
    returning id,system_owned
  `)[0] as unknown as {id:string;system_owned:boolean};
  return {id:String(row.id),systemOwned:Boolean(row.system_owned)};
}

async function selectCandidate(day:string,runId:string,candidateId:string,candidate:GlobalScoredCandidate,extraRationale:string[]=[]){
  const sql=db();
  await sql`update publication_global_candidates set selected=false,updated_at=now() where run_id=${runId}::uuid`;
  await sql`update publication_global_candidates set selected=true,status=case when status='research-blocked' then status else 'selected' end,updated_at=now() where id=${candidateId}::uuid`;
  const rationale=[...candidate.rationale,...extraRationale,`cluster coherence ${candidate.clusterCoherence}/100`,`event anchor: ${candidate.eventAnchor.distinctiveTerms.join(", ")}`];
  await sql`
    insert into publication_daily_flagships(
      editorial_day,run_id,candidate_id,subject,research_query,category,importance_score,
      distinctiveness_score,final_score,material_change_override,mention_count,source_family_count,regions,status,rationale
    ) values(
      ${day}::date,${runId}::uuid,${candidateId}::uuid,${candidate.subject},${candidate.researchQuery},${candidate.category},
      ${candidate.importanceScore},${candidate.distinctivenessScore},${candidate.finalScore},${candidate.materialChangeOverride},
      ${candidate.mentionCount},${candidate.domains.length},${sql.json(json(candidate.regions))},'selected',${sql.json(json(rationale))}
    )
    on conflict(editorial_day) do update set
      run_id=excluded.run_id,candidate_id=excluded.candidate_id,subject=excluded.subject,research_query=excluded.research_query,
      category=excluded.category,importance_score=excluded.importance_score,distinctiveness_score=excluded.distinctiveness_score,
      final_score=excluded.final_score,material_change_override=excluded.material_change_override,mention_count=excluded.mention_count,
      source_family_count=excluded.source_family_count,regions=excluded.regions,status='selected',rationale=excluded.rationale,
      keyword_id=null,opportunity_id=null,article_id=null,updated_at=now()
  `;
  await sql`update publication_global_runs set selected_candidate_id=${candidateId}::uuid where id=${runId}::uuid`;
}

async function draftSelectedCandidate(day:string,candidateId:string,candidate:GlobalScoredCandidate):Promise<DailyFlagshipResult>{
  const sql=db();
  const keyword=await ensureFlagshipKeyword(candidate);
  let result:Record<string,unknown>={};
  try{
    result=await researchKeyword(keyword.id,{selectedSubject:candidate.subject,anchorTitles:candidate.titles,eventAnchor:candidate.eventAnchor,clusterCoherence:candidate.clusterCoherence}) as unknown as Record<string,unknown>;
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    await sql`update publication_global_candidates set status='research-blocked',updated_at=now() where id=${candidateId}::uuid`;
    await sql`update publication_daily_flagships set keyword_id=${keyword.id}::uuid,status='research-required',updated_at=now() where editorial_day=${day}::date`;
    return {status:"research-required",editorialDay:day,candidateId,subject:candidate.subject,category:candidate.category,finalScore:candidate.finalScore,reason:message};
  }finally{
    if(keyword.systemOwned)await sql`update publication_keywords set active=false,updated_at=now() where id=${keyword.id}::uuid and system_owned=true`;
  }

  const opportunityId=typeof result.opportunityId==="string"?result.opportunityId:null;
  const articleId=typeof result.articleId==="string"?result.articleId:null;
  let status=articleStatus(result);

  if(articleId&&process.env.PUBLICATION_FLAGSHIP_AUTO_PUBLISH==="true"&&!/^(World|Markets|Policy|Science)$/i.test(candidate.category)){
    const quality=(result.quality&&typeof result.quality==="object"?result.quality:null) as {totalScore?:number;audienceScore?:number;originalityScore?:number}|null;
    if(Number(quality?.totalScore||0)>=94&&Number(quality?.audienceScore||0)>=88&&Number(quality?.originalityScore||0)>=90){
      await publishArticle(articleId);
      status="published";
    }
  }

  const outcome:DailyFlagshipResult["status"]=status==="blocked"||!articleId?"research-required":status==="published"?"published":"drafted";
  await sql`update publication_global_candidates set status=${outcome==="research-required"?"research-blocked":"drafted"},updated_at=now() where id=${candidateId}::uuid`;
  await sql`
    update publication_daily_flagships
    set keyword_id=${keyword.id}::uuid,opportunity_id=${opportunityId}::uuid,article_id=${articleId}::uuid,
        status=${outcome},updated_at=now()
    where editorial_day=${day}::date
  `;
  return {status:outcome,editorialDay:day,candidateId,subject:candidate.subject,category:candidate.category,finalScore:candidate.finalScore,opportunityId:opportunityId||undefined,articleId:articleId||undefined,articleStatus:status};
}

export async function runGlobalEditorialSelection(options:{force?:boolean;draft?:boolean}={}):Promise<DailyFlagshipResult>{
  if(!process.env.DATABASE_URL)return {status:"disabled",editorialDay:todayUtc(),reason:"DATABASE_URL not configured"};
  const day=todayUtc();
  const selectionStarted=Date.now();
  const sql=db();
  const prior=await existingFlagship(day);
  if(prior&&!options.force)return {status:"already-selected",editorialDay:day,subject:prior.subject,category:prior.category as DailyFlagshipResult["category"],finalScore:Number(prior.final_score),opportunityId:prior.opportunity_id||undefined,articleId:prior.article_id||undefined,articleStatus:prior.article_status||prior.status};

  // Transaction-scoped advisory lock: safe with pooled/serverless Postgres.
  // v2 namespace intentionally bypasses any stranded session lock created by the old implementation.
  const lockKey=`briefs:global-editorial:v2:${day}`;
  return await sql.begin(async tx=>{
    const locked=(await tx`select pg_try_advisory_xact_lock(hashtext(${lockKey})) ok`)[0]?.ok;
    if(!locked)return {status:"already-selected",editorialDay:day,reason:"Global editorial selection is already running"};

    let runId:string|undefined;
    try{
    const run=(await sql`insert into publication_global_runs(editorial_day,status) values(${day}::date,'running') returning id`)[0];
    runId=String(run.id);

    const discovered=await discoverGlobalEvents();
    if(!discovered.length){
      await sql`update publication_global_runs set status='failed',error_summary='No global candidates discovered',completed_at=now() where id=${runId}::uuid`;
      return {status:"research-required",editorialDay:day,reason:"No sufficiently broad global event candidates were discovered"};
    }

    const ranked=await rankGlobalCandidates(discovered);
    const viable=ranked.filter(candidate=>candidate.candidateIntegrityPassed===true&&Number(candidate.candidateIntegrityScore||0)>=60&&candidate.domains.length>=2&&candidate.evidenceBreadth>=42&&candidate.finalScore>=55);
    if(!viable.length){
      await sql`update publication_global_runs set status='failed',error_summary='No candidate passed discovery-integrity and global importance gates',completed_at=now() where id=${runId}::uuid`;
      return {status:"research-required",editorialDay:day,reason:"No candidate passed discovery-integrity and global importance gates"};
    }
    const rankedPool=viable.slice(0,40);
    const seenEventKeys=new Set<string>();
    const shortlist=rankedPool.filter(candidate=>{if(seenEventKeys.has(candidate.eventKey))return false;seenEventKeys.add(candidate.eventKey);return true;}).slice(0,30);
    if(!shortlist.length){
      await sql`update publication_global_runs set status='failed',error_summary='No candidate survived ranking',completed_at=now() where id=${runId}::uuid`;
      return {status:"research-required",editorialDay:day,reason:"No candidate survived global importance ranking"};
    }

    const ids=new Map<string,string>();
    for(const candidate of shortlist)ids.set(candidate.eventKey,await persistCandidate(runId,candidate));
    await sql`update publication_global_runs set candidates_count=${ranked.length} where id=${runId}::uuid`;

    const first=shortlist[0];
    const firstId=ids.get(first.eventKey)!;
    if(options.draft===false){
      await selectCandidate(day,runId,firstId,first);
      await sql`update publication_global_runs set status='selected',completed_at=now() where id=${runId}::uuid`;
      return {status:"selected",editorialDay:day,candidateId:firstId,subject:first.subject,category:first.category,finalScore:first.finalScore};
    }

    // Try the highest-ranked publishable stories in order. Importance picks the order; evidence gates decide what can responsibly be written.
    const attempts=shortlist.slice(0,Math.min(3,shortlist.length));
    let lastFailure:DailyFlagshipResult|undefined;
    for(let i=0;i<attempts.length;i++){
      if(i>0&&Date.now()-selectionStarted>32_000)break;
      const candidate=attempts[i];
      const candidateId=ids.get(candidate.eventKey)!;
      await selectCandidate(day,runId,candidateId,candidate,i? [`publishability fallback #${i+1}: a higher-ranked candidate did not pass deep-research/article gates`]:[]);
      const drafted=await draftSelectedCandidate(day,candidateId,candidate);
      if(drafted.status!=="research-required"){
        await sql`update publication_global_runs set status='selected',selected_candidate_id=${candidateId}::uuid,completed_at=now() where id=${runId}::uuid`;
        return drafted;
      }
      lastFailure=drafted;
    }

    // Preserve the top editorial choice in the ledger even if no candidate can yet support a safe article.
    await selectCandidate(day,runId,firstId,first,["No shortlisted candidate passed the deep-research/article gates; the highest-ranked world event remains the editorial reference point."]);
    await sql`update publication_global_candidates set status='research-blocked',selected=true,updated_at=now() where id=${firstId}::uuid`;
    await sql`update publication_daily_flagships set status='research-required',updated_at=now() where editorial_day=${day}::date`;
    await sql`update publication_global_runs set status='selected',selected_candidate_id=${firstId}::uuid,completed_at=now() where id=${runId}::uuid`;
    return {...(lastFailure||{status:"research-required",editorialDay:day}),candidateId:firstId,subject:first.subject,category:first.category,finalScore:first.finalScore,reason:lastFailure?.reason||"No shortlisted candidate passed the deep-research/article gates"};
    }catch(error){
      if(runId)await sql`update publication_global_runs set status='failed',error_summary=${error instanceof Error?error.message:String(error)},completed_at=now() where id=${runId}::uuid`;
      throw error;
    }
  });
}

export async function latestGlobalEditorialState(){
  if(!process.env.DATABASE_URL)return {flagship:null,candidates:[]};
  try{
    const sql=db();
    const flagship=(await sql`select f.*,a.slug,a.title article_title,a.status article_status from publication_daily_flagships f left join publication_articles a on a.id=f.article_id order by f.editorial_day desc limit 1`)[0]||null;
    const candidates=await sql`select id,subject,research_query,category,regions,mention_count,importance_score,distinctiveness_score,repeat_penalty,final_score,material_change_override,selected,status,rationale,created_at from publication_global_candidates order by created_at desc,final_score desc limit 30`;
    return {flagship,candidates};
  }catch{return {flagship:null,candidates:[]};}
}

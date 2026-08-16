insert into sources (id,name,url,feed_url,source_type,tier,ingestion_method,topics,poll_interval_minutes)
values
('openai-news','OpenAI News','https://openai.com/news/','https://openai.com/news/rss.xml','primary','A','rss',array['ai','technology'],360),
('nist-news','NIST News','https://www.nist.gov/news-events','https://www.nist.gov/news-events/news/rss.xml','primary','A','rss',array['technology','standards','cybersecurity'],720)
on conflict (id) do nothing;

insert into entities (id,entity_type,name,slug,aliases)
values ('openai','company','OpenAI','openai',array['Open AI'])
on conflict (id) do nothing;

insert into briefs (slug,title,deck,category,answer,why_it_matters,context,status,risk_class,last_verified_at,last_substantial_update_at)
values ('openai','OpenAI','A living brief on OpenAI.','AI','OpenAI is an artificial intelligence company.','Its products and research influence the wider AI ecosystem.','This page is designed to be maintained from verified source evidence rather than rewritten blindly.','published','normal',now(),now())
on conflict (slug) do nothing;

-- V5 starter knowledge: World War II
insert into sources(id,name,url,feed_url,source_type,tier,ingestion_method,topics,poll_interval_minutes)
values
('ushmm-ww2','United States Holocaust Memorial Museum — World War II','https://encyclopedia.ushmm.org/content/en/article/world-war-ii-in-depth',null,'specialist','A','manual',array['history','world-war-ii'],10080),
('iwm-ww2','Imperial War Museums — Second World War','https://www.iwm.org.uk/history/what-you-need-to-know-about-the-second-world-war',null,'specialist','A','manual',array['history','world-war-ii'],10080),
('britannica-ww2','Encyclopaedia Britannica — World War II','https://www.britannica.com/event/World-War-II',null,'reporting','B','manual',array['history','world-war-ii'],10080)
on conflict(id) do update set name=excluded.name,url=excluded.url,topics=excluded.topics,updated_at=now();

insert into entities(id,entity_type,name,slug,aliases,description,canonical_url)
values ('world-war-ii','concept','World War II','world-war-ii',array['WW2','World War 2','Second World War','The Second World War'],'World War II was a global conflict fought from 1939 to 1945 between the Allied and Axis powers.','https://www.britannica.com/event/World-War-II')
on conflict(id) do update set aliases=excluded.aliases,description=excluded.description,canonical_url=excluded.canonical_url,updated_at=now();

insert into briefs(slug,title,deck,category,answer,why_it_matters,context,status,risk_class,last_verified_at,last_substantial_update_at)
values ('world-war-ii','World War II','A living, evidence-backed brief on the Second World War.','History','World War II was a global conflict fought from 1939 to 1945 between the Allied and Axis powers.','Its aftermath shaped the modern international order, the United Nations, the Cold War, decolonization and international human-rights law.','Evergreen historical claims are maintained separately from current-event claims.','published','normal','2026-08-16T00:00:00Z','2026-08-16T00:00:00Z')
on conflict(slug) do update set answer=excluded.answer,why_it_matters=excluded.why_it_matters,context=excluded.context,updated_at=now();

insert into source_documents(source_id,external_key,canonical_url,title,excerpt,body,language,retrieved_at,content_hash,metadata)
values
('ushmm-ww2','starter-ushmm-ww2','https://encyclopedia.ushmm.org/content/en/article/world-war-ii-in-depth','World War II: In Depth','Reference evidence for World War II and the Holocaust.',null,'en','2026-08-16T00:00:00Z','starter-ushmm-ww2','{"starter":true}'::jsonb),
('iwm-ww2','starter-iwm-ww2','https://www.iwm.org.uk/history/what-you-need-to-know-about-the-second-world-war','What You Need to Know About the Second World War','Reference evidence for the chronology and scope of World War II.',null,'en','2026-08-16T00:00:00Z','starter-iwm-ww2','{"starter":true}'::jsonb),
('britannica-ww2','starter-britannica-ww2','https://www.britannica.com/event/World-War-II','World War II','Reference evidence for World War II chronology and major belligerents.',null,'en','2026-08-16T00:00:00Z','starter-britannica-ww2','{"starter":true}'::jsonb)
on conflict(source_id,content_hash) do nothing;

insert into claims(claim_key,entity_id,predicate,value_text,freshness_class,verification_status,confidence,valid_from,last_verified_at)
values
('world-war-ii:duration','world-war-ii','Duration','1939–1945','static','corroborated','high','1939-09-01T00:00:00Z','2026-08-16T00:00:00Z'),
('world-war-ii:europe-start','world-war-ii','War in Europe began','September 1, 1939','static','corroborated','high','1939-09-01T00:00:00Z','2026-08-16T00:00:00Z'),
('world-war-ii:formal-end','world-war-ii','Formal end','September 2, 1945','static','corroborated','high','1945-09-02T00:00:00Z','2026-08-16T00:00:00Z'),
('world-war-ii:major-sides','world-war-ii','Major coalitions','Allies and Axis','static','corroborated','high','1939-09-01T00:00:00Z','2026-08-16T00:00:00Z'),
('world-war-ii:holocaust','world-war-ii','Holocaust','Six million Jews murdered','static','confirmed','high',null,'2026-08-16T00:00:00Z')
on conflict(claim_key) do update set value_text=excluded.value_text,verification_status=excluded.verification_status,confidence=excluded.confidence,last_verified_at=excluded.last_verified_at;

insert into claim_evidence(claim_id,document_id,stance,excerpt,source_tier)
select c.id,d.id,'supports',null,s.tier
from claims c
join (values
 ('world-war-ii:duration','starter-iwm-ww2'),
 ('world-war-ii:duration','starter-britannica-ww2'),
 ('world-war-ii:europe-start','starter-ushmm-ww2'),
 ('world-war-ii:europe-start','starter-britannica-ww2'),
 ('world-war-ii:formal-end','starter-iwm-ww2'),
 ('world-war-ii:formal-end','starter-britannica-ww2'),
 ('world-war-ii:major-sides','starter-iwm-ww2'),
 ('world-war-ii:major-sides','starter-britannica-ww2'),
 ('world-war-ii:holocaust','starter-ushmm-ww2')
) as x(claim_key,content_hash) on x.claim_key=c.claim_key
join source_documents d on d.content_hash=x.content_hash
join sources s on s.id=d.source_id
on conflict(claim_id,document_id,stance) do nothing;

insert into brief_claims(brief_id,claim_id,display_order)
select b.id,c.id,row_number() over(order by c.claim_key)
from briefs b join claims c on c.entity_id='world-war-ii'
where b.slug='world-war-ii'
on conflict(brief_id,claim_id) do nothing;

insert into source_pack_sources(pack_id,source_id,priority)
values ('starter-history','ushmm-ww2',100),('starter-history','iwm-ww2',95),('starter-history','britannica-ww2',80)
on conflict(pack_id,source_id) do update set priority=excluded.priority;

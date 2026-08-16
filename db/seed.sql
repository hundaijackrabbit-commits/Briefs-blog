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

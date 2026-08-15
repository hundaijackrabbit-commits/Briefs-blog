insert into entities (id, entity_type, name, slug) values
('ai-agents','concept','AI agents','ai-agents'),
('nvidia','company','NVIDIA','nvidia'),
('openai','company','OpenAI','openai')
on conflict (id) do nothing;

insert into sources (id,name,url,source_type,tier) values
('src-openai','OpenAI Newsroom','https://openai.com/news/','primary','A'),
('src-sec','U.S. SEC','https://www.sec.gov/','primary','A'),
('src-nvidia-ir','NVIDIA Investor Relations','https://investor.nvidia.com/','primary','A'),
('src-reuters','Reuters','https://www.reuters.com/','reporting','B')
on conflict (id) do nothing;

insert into claims (id,entity_id,claim_key,claim_value,freshness_class,confidence,source_ids,last_verified_at) values
('c1','openai','organization_type','AI research and deployment company','slow','high',array['src-openai'],now()),
('c2','nvidia','primary_business','Accelerated computing platforms and GPUs','slow','high',array['src-nvidia-ir','src-sec'],now()),
('c3','ai-agents','definition','Software systems that can plan and perform multi-step tasks using models, tools and external systems.','current','high',array['src-openai'],now())
on conflict (id) do nothing;

insert into briefs (id,slug,title,deck,category,answer,why_it_matters,context,watch_next,claim_ids,source_ids,status,freshness_score,reading_minutes,last_verified_at,last_substantial_update_at) values
('b-ai-agents','ai-agents','AI agents','What they are, why companies are building them and what still gets in the way.','AI & Technology','AI agents are software systems designed to do more than answer a prompt: they can plan, use tools, take actions and work through multi-step tasks toward a goal.','Agents move AI from a conversational interface toward software that can actually execute work. That creates major productivity opportunities, but also raises reliability, security and oversight problems.','The important shift is not that models suddenly became autonomous. It is that stronger models are being connected to browsers, code runtimes, APIs, databases and business software, giving them a larger action surface.',array['Reliability on long-running tasks','Permission and identity controls','Enterprise adoption beyond pilots'],array['c3'],array['src-openai'],'published',98,4,now(),now()),
('b-nvidia','nvidia','NVIDIA','The essential living brief on the company at the center of accelerated computing.','Companies','NVIDIA designs accelerated-computing platforms built around GPUs and related systems, with data-center AI workloads becoming central to its strategic importance.','NVIDIA sits at a critical infrastructure layer for modern AI. Changes in its products, supply, customers or financial results can ripple through cloud providers, model developers and semiconductor supply chains.','A useful NVIDIA brief has to stay current because product cycles, export rules, customer concentration and financial metrics can change quickly.',array['New architecture rollout','Data-center demand','Export controls and supply constraints'],array['c2'],array['src-nvidia-ir','src-sec','src-reuters'],'published',96,5,now(),now()),
('b-openai','openai','OpenAI','A continuously maintained brief on the organization, products and developments that matter.','Companies','OpenAI is an AI research and deployment company whose products and model releases have made it a central participant in the current generative-AI market.','Its model capabilities, product decisions, partnerships and governance can affect how businesses and consumers adopt AI and how competitors respond.','Because model, product and partnership information changes quickly, this page is designed as a living brief rather than a static company profile.',array['Model and product releases','Enterprise adoption','Governance and regulation'],array['c1'],array['src-openai','src-reuters'],'published',99,5,now(),now())
on conflict (id) do nothing;

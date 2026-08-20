import path from "node:path";import {pathToFileURL} from "node:url";
const mod=await import(pathToFileURL(path.join(process.cwd(),"src/lib/publication/global-top-stories.ts")).href);
const {GLOBAL_TOP_STORY_EDITIONS,googleNewsTopStoriesUrl}=mod;
function assert(ok,label,detail=""){console.log(ok?"PASS":"FAIL",label,detail);if(!ok)process.exitCode=1;}

assert(GLOBAL_TOP_STORY_EDITIONS.length===5,"top-story rail remains bounded to five editions",String(GLOBAL_TOP_STORY_EDITIONS.length));
assert(new Set(GLOBAL_TOP_STORY_EDITIONS.map(x=>x.gl)).size===5,"top-story rail spans five distinct country editions");
assert(GLOBAL_TOP_STORY_EDITIONS.some(x=>x.gl==="IN"),"South Asia receives a direct top-story edition");
assert(GLOBAL_TOP_STORY_EDITIONS.some(x=>x.gl==="GB"),"Europe receives a direct English-language top-story edition");

for(const edition of GLOBAL_TOP_STORY_EDITIONS){
  const url=googleNewsTopStoriesUrl(edition);
  assert(url.startsWith("https://news.google.com/rss?"),`${edition.label} uses the Google News top-stories RSS endpoint`,url);
  assert(!url.includes("/rss/search"),`${edition.label} is not a keyword search feed`);
  const parsed=new URL(url);
  assert(parsed.searchParams.get("gl")===edition.gl&&parsed.searchParams.get("hl")===edition.hl&&parsed.searchParams.get("ceid")===edition.ceid,`${edition.label} locale parameters are preserved`);
}

if(process.exitCode)throw new Error("Global top-stories regression failed");
console.log("Global top-stories regression suite passed.");

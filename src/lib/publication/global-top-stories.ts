export type TopStoryEdition={
  label:string;
  hl:string;
  gl:string;
  ceid:string;
};

export const GLOBAL_TOP_STORY_EDITIONS:TopStoryEdition[]=[
  {label:"United States",hl:"en-US",gl:"US",ceid:"US:en"},
  {label:"United Kingdom",hl:"en-GB",gl:"GB",ceid:"GB:en"},
  {label:"Canada",hl:"en-CA",gl:"CA",ceid:"CA:en"},
  {label:"Australia",hl:"en-AU",gl:"AU",ceid:"AU:en"},
  {label:"India",hl:"en-IN",gl:"IN",ceid:"IN:en"}
];

export function googleNewsTopStoriesUrl(edition:TopStoryEdition){
  const params=new URLSearchParams({hl:edition.hl,gl:edition.gl,ceid:edition.ceid});
  return `https://news.google.com/rss?${params.toString()}`;
}

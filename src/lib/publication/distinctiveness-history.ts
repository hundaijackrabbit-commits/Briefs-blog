export type CategoryFatigue={
  recentCategoryCount:number;
  penalty:number;
};

export function categoryFatiguePenalty(recentCategories:string[],candidateCategory:string):CategoryFatigue{
  const recentCategoryCount=recentCategories.slice(0,5).filter(category=>category===candidateCategory).length;
  const excess=Math.max(0,recentCategoryCount-2);
  return {recentCategoryCount,penalty:Math.min(6,excess*2)};
}

export function readerFacingFlagship(status:string,articleId:string|null|undefined){
  return Boolean(articleId)&&/^(drafted|published)$/i.test(String(status||""));
}

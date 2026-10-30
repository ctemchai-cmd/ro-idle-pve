import type{AccountState}from'../../contracts/index.ts';import type{ValidatedContent}from'../../content/model.ts';
/** Best cleared farm chapter; selecting a lower farming stage cannot reduce an earned shop bracket. */
export function shopChapter(state:AccountState,content:ValidatedContent):number{const cleared=new Set(state.story.cleared_stage_ids);return(content.documents['stages.json']!.stages as unknown as {id:string;farm_rate_chapter:number}[]).reduce((n,s)=>cleared.has(s.id)?Math.max(n,s.farm_rate_chapter):n,1);}

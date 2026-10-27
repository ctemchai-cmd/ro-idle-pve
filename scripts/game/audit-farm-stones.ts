import{writeFileSync}from'node:fs';
import{loadValidatedContent}from'../../src/content/index.ts';
import{initializeAccount}from'../../src/domain/progression/initialize.ts';
import{farmCraftingProfile}from'../../src/domain/modes/farm-crafting-profile.ts';
import{rollFarmCrafting}from'../../src/domain/rewards/farm-crafting.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw Error(JSON.stringify(loaded.errors));const content=loaded.value,rows=[];
for(let chapter=1;chapter<=12;chapter++){const profile=farmCraftingProfile(chapter,content)!,sum={option_stone:0,rarity_stone:0},samples=512;
 for(let seed=1;seed<=samples;seed++){const state=initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-27T00:00:00Z','2026-10-27',seed),counts=rollFarmCrafting(state.farm,profile,144);sum.option_stone+=counts.option_stone;sum.rarity_stone+=counts.rarity_stone;}
 rows.push({chapter,windows:samples,expected12h:{option_stone:profile.chance_per_million.option_stone*144/1e6,rarity_stone:profile.chance_per_million.rarity_stone*144/1e6},observed12h:{option_stone:sum.option_stone/samples,rarity_stone:sum.rarity_stone/samples}});
}
const report={scope:'6144 seeded12h stone-only windows; same pure RNG as reserveFarm. Not class balance or guaranteed per-account drops.',rows,shop_unchanged:true,pack_unchanged:true};writeFileSync('plan/evidence/task-169/drop-budget.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

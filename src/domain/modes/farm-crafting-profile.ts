import type{AccountState}from'../../contracts/index.ts';
import type{ValidatedContent}from'../../content/model.ts';
type Profile=NonNullable<NonNullable<AccountState['farm']['rate_snapshot']>['crafting_drops']>;
export function farmCraftingProfile(chapter:number,content:ValidatedContent):Profile|undefined {
  const rules=content.documents['loot.json']!.crafting as unknown as {version:Profile['version'];chapter_chances:Record<string,Profile['chance_per_million']>}|undefined;
  if(!rules)return;
  const chance=rules.chapter_chances[String(chapter)];if(!chance)throw new Error('MISSING_CRAFTING_FARM_CHAPTER');
  return{version:rules.version,chance_per_million:{...chance}};
}

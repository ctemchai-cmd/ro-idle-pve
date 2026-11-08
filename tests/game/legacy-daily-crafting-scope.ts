import{enchantOptionSourceBytes,withoutEnchantOptionTargets}from'./legacy-enchant-option-scope.ts';
import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const base='plan/evidence/task-198/',before={...JSON.parse(gunzipSync(readFileSync(base+'before.json.gz')).toString()),...JSON.parse(readFileSync(base+'before-additional.json','utf8'))}as Record<string,string>,after=JSON.parse(readFileSync(base+'source-after.json','utf8'))as Record<string,string>;
const correction='plan/evidence/rarity-and-card-order-20261107/',correctionBefore=JSON.parse(gunzipSync(readFileSync(correction+'before.json.gz')).toString())as Record<string,string>,correctionAfter=JSON.parse(readFileSync(correction+'source-after.json','utf8'))as Record<string,string>;
export function dailyCraftingSourceBytes(file:string){let b=enchantOptionSourceBytes(file);if(correctionAfter[file]){assert.equal(createHash('sha256').update(b).digest('hex'),correctionAfter[file],file+' reviewed rarity/card UI correction');b=Buffer.from(correctionBefore[file]!);}if(after[file]){assert.equal(createHash('sha256').update(b).digest('hex'),after[file],file+' reviewed daily/crafting scope');return Buffer.from(before[file]!);}return b;}
export function withoutDailyCraftingFile<T>(file:string,value:T):T{const d=withoutEnchantOptionTargets(file,value)as any;
 if(file==='plan/data/loot.json'&&d.crafting){const old=JSON.parse(before[file]!);for(const[ch,row]of Object.entries(d.crafting.chapter_chances))(row as any).option_stone=old.crafting.chapter_chances[ch].option_stone;}
 if(file==='plan/data/economy.json'){const old=JSON.parse(before[file]!);d.shop.offers=d.shop.offers.map((o:any)=>o.id==='option_stone'?old.shop.offers.find((x:any)=>x.id===o.id):o);if(d.events)d.events.shop=d.events.shop.map((o:any)=>o.id==='option_stones'?old.events.shop.find((x:any)=>x.id===o.id):o);}
 if(file==='plan/data/daily-bosses.json'){delete d.continuous_health_bars;const old=JSON.parse(before[file]!);d.bosses.forEach((b:any)=>b.next_phase=old.bosses.find((o:any)=>o.id===b.id).next_phase);}
 if(file==='plan/data/schemas/command.json'){const branch=d.oneOf.find((r:any)=>r.properties.type.const==='equipment.rarity_up');if(branch)delete branch.properties.params.properties.target_rarity;}
 if(file==='plan/data/schemas/account-state.json')delete d.properties.daily_records.items.properties.quota_reset_id;
 if(file==='plan/data/acceptance-cases.json')d.cases=d.cases.filter((r:any)=>r.task_id!=='TASK-198');return d;
}

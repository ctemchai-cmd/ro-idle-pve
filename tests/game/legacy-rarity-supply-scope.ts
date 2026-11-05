import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const base='plan/evidence/task-197/',before={...JSON.parse(gunzipSync(readFileSync(base+'before.json.gz')).toString()),...JSON.parse(readFileSync(base+'before-metadata.json','utf8'))}as Record<string,string>,after=JSON.parse(readFileSync(base+'source-after.json','utf8'))as Record<string,string>;
export function raritySupplySourceBytes(file:string){const b=readFileSync(file);if(after[file]){assert.equal(createHash('sha256').update(b).digest('hex'),after[file],file+' reviewed Rarity supply scope');return Buffer.from(before[file]!);}return b;}
export function withoutRaritySupplyFile<T>(file:string,value:T):T{
 const d=structuredClone(value) as any;
 if(file==='plan/data/loot.json'){const old=JSON.parse(before[file]!);for(const[ch,row]of Object.entries(d.crafting.chapter_chances))if(old.crafting.chapter_chances[ch])(row as any).rarity_stone=old.crafting.chapter_chances[ch].rarity_stone;}
 if(file==='plan/data/economy.json'){const old=JSON.parse(before[file]!);d.shop.offers=d.shop.offers.map((o:any)=>o.id==='rarity_stone'?structuredClone(old.shop.offers.find((x:any)=>x.id===o.id)):o);if(d.events)d.events.shop=d.events.shop.map((o:any)=>o.id==='rarity_stones'?structuredClone(old.events.shop.find((x:any)=>x.id===o.id)):o);}
 if(file==='plan/data/acceptance-cases.json')d.cases=d.cases.filter((r:any)=>r.task_id!=='TASK-197');
 return d;
}

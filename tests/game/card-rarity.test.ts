import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState } from '../../src/contracts/index.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
import { CARD_RARITIES, cardRarity, cardRarityPower, cardRarityDust, migrateCardRarity, type CardItem } from '../../src/domain/build/card-rarity.ts';
import { cardPowerMultiplier, resolvedCardModifiers, resolvedCardTriggers } from '../../src/domain/build/equipment.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { farmCardDrop } from '../../src/domain/rewards/card-drops.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { pullCards } from '../../src/domain/rewards/gacha.ts';
import { cardInventory, farmCardRarityOdds } from '../../src/client/slots.ts';
import { content } from './combat-fixtures.ts';

const at='2026-10-22T00:00:00.000Z',base=Date.parse(at),origins=cardOrigins(content);
const state=()=>initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-22',1);
const card=(id:string,rarity:CardItem['rarity_id']=cardRarity(id,content),level=1):CardItem=>({instance_id:'c_'+id,definition_id:id,kind:'card',rarity_id:rarity,level,locked:false});
test('D109 fixed monster catalog uses five item rarities; Mini/MVP overrides source level and Elite is not MVP',()=>{
 assert.deepEqual(CARD_RARITIES,['common','uncommon','rare','epic','legendary','immortal','supreme']);assert.equal(Object.keys(origins).length,66);
 for(const[id,o]of Object.entries(origins)){const expected=o.grade==='mvp'?'legendary':o.grade==='mini'?'epic':o.source_level<=20?'common':o.source_level<=45?'uncommon':'rare';assert.equal(cardRarity(id,content),expected);assert.ok(!['immortal','supreme'].includes(o.rarity_id));}
 assert.equal(cardRarity('card_armor_1',content),'common');assert.equal(cardRarity('card_weapon_1',content),'uncommon');assert.equal(cardRarity('card_abysmal_knight',content),'rare');assert.equal(origins.card_abysmal_knight!.grade,'normal');assert.equal(cardRarity('card_mastering',content),'epic');assert.equal(cardRarity('card_baphomet',content),'legendary');
});
test('all66 ×3 legacy qualities ×5 levels retain the old power floor once, with a strict increasing current rarity curve',()=>{
 const old={bronze:1,silver:1.25,gold:1.5},levels=[1,1.25,1.5,1.75,2],data=content.documents['cards.json'] as unknown as {rarities:{id:string;multiplier:number}[]};let previous=0;
 for(const r of data.rarities){assert.ok(r.multiplier>previous);previous=r.multiplier;}
 for(const id of Object.keys(origins))for(const quality of ['bronze','silver','gold']as const)for(let lv=1;lv<=5;lv++){
  const before=card(id,quality,lv),after=migrateCardRarity(before,content),rarity=data.rarities.find(r=>r.id===after.rarity_id)!;
  assert.equal(cardPowerMultiplier(before,content),old[quality]*levels[lv-1]!);assert.equal(cardPowerMultiplier(after,content),Math.max(old[quality],rarity.multiplier)*levels[lv-1]!);assert.ok(cardRarityDust(after,content)>=({bronze:20,silver:40,gold:80})[quality]);assert.deepEqual(migrateCardRarity(after,content),after);
 }
});
test('migration retains198 owned cards, pending payloads, assignments, levels, locks, wallet and ledger, without input mutation',()=>{
 const original=state();for(const id of Object.keys(origins))for(const q of ['bronze','silver','gold']as const)original.inventory.push({...card(id,q,5),instance_id:id+'_'+q,locked:q==='gold'});
 original.roster[0]!.slot_progress.weapon.cards[0]='card_weapon_1_gold';const zero=Object.fromEntries(Object.keys(original.wallet).map(k=>[k,0]))as AccountState['wallet'];original.pending_rewards.push({claim_id:'old_reward',kind:'farm',resource_vector:zero,items:[card('card_armor_1','gold',5)],content_version:content.manifest.content_version,reserved_at:at,source_keys:['prior'],status:'pending'});
 const before=structuredClone(original),next=migrateAccountState(original,content).state;assert.deepEqual(original,before);assert.equal(next.inventory.length,198);assert.deepEqual(next.roster,original.roster);assert.deepEqual(next.wallet,original.wallet);assert.deepEqual(next.paid_ledger,original.paid_ledger);assert.equal(next.pending_rewards[0]!.items[0]!.rarity_id,'common');
 for(const item of next.inventory){if(item.kind!=='card')throw Error('CARD');const previous=before.inventory.find(i=>i.instance_id===item.instance_id)!;assert.equal(item.level,previous.kind==='card'?previous.level:0);assert.equal(item.locked,previous.locked);assert.equal(item.rarity_id,cardRarity(item.definition_id,content));assert.equal(cardRarityDust(item,content)>=20,true);}
 assert.deepEqual(migrateAccountState(next,content).state,next);assert.doesNotThrow(()=>new AccountCommandRules().validateAccount(next));
});
test('legacy power is a floor rather than an extra multiplier; penalties and proc power keep one scale',()=>{
 const weak=migrateCardRarity(card('card_armor_1','gold',5),content);assert.equal(cardRarityPower(weak,content),1.5);assert.equal(cardPowerMultiplier(weak,content),3);
 const mvp=migrateCardRarity(card('card_golden_thief_bug','gold',5),content);assert.equal(cardRarityPower(mvp,content),1.8);
 for(const m of resolvedCardModifiers(mvp,content)){const raw=(content.items[mvp.definition_id]!.modifiers as unknown as {id:string;stat:string;value:number}[]).find(r=>r.id===m.id)!;assert.ok(Math.abs(Number(m.value)-(raw.stat==='sp_cost_percent'?raw.value/3.6:raw.value*3.6))<1e-9);}
 const one=resolvedCardTriggers(card('card_dark_lord','legendary',1),content)[0]!,five=resolvedCardTriggers(card('card_dark_lord','legendary',5),content)[0]!;assert.equal(one.chance,five.chance);const params=(t:typeof one)=>(t.effects[0] as {formula:{params:{attack_ratio:number}}}).formula.params.attack_ratio;assert.equal(params(five),params(one)*2);
});
test('fixed farm rarity retains the existing three-draw hit budget, old quality floor and missed-roll budget',()=>{
 const s=state(),profile=storyFarmSnapshot(storyStage('1-1',content)!,s,content).card_drops!;let draws=0;const next=farmCardDrop(profile,()=>{draws++;return 0;},content)!;assert.equal(draws,3);assert.equal(next.rarity_id,cardRarity(next.definition_id,content));assert.equal(next.legacy_quality,undefined);
 const old={...profile,version:'card_farm_v2',definition_rarities:undefined,quality_weights:{bronze:0,silver:0,gold:1000000}};draws=0;const previous=farmCardDrop(old,()=>{draws++;return 0;},content)!;assert.equal(draws,3);assert.equal(previous.legacy_quality,'gold');assert.equal(previous.rarity_id,cardRarity(previous.definition_id,content));draws=0;assert.equal(farmCardDrop(profile,()=>{draws++;return .9;},content),null);assert.equal(draws,1);
});
test('all130 current stage profiles keep1–2% and source gates, and later chapters improve average rarity without raising card quantity',()=>{
 const stages=storyStages(content),ranks=CARD_RARITIES,means:number[]=[];
 for(const stage of stages){const profile=storyFarmSnapshot(stage,state(),content).card_drops!;assert.ok(profile.chance_per_million>=10000&&profile.chance_per_million<=20000);assert.equal(profile.quality_weights,undefined);assert.equal(profile.version,'card_farm_v3');assert.ok(profile.definition_pool.every(id=>profile.definition_rarities![id]===cardRarity(id,content)));const odds=farmCardRarityOdds(profile);assert.ok(Math.abs(odds.reduce((n,r)=>n+r.percent,0)-100)<1e-8);means.push(odds.reduce((n,r)=>n+r.percent*ranks.indexOf(r.rarity as typeof ranks[number])/100,0));}
 assert.ok(means.at(-1)!>means[0]!);assert.ok(storyFarmSnapshot(storyStage('1-1',content)!,state(),content).card_drops!.definition_pool.every(id=>origins[id]!.grade==='normal'));
});
test('legacy frozen/new fixed profiles consume identical RNG and gear drops; reserve split and12h cap remain deterministic',()=>{
 const s=state();s.story.selected_farm_stage='8-20';s.farm.rate_snapshot=storyFarmSnapshot(storyStage('8-20',content)!,s,content);const old=structuredClone(s);old.farm.rate_snapshot!.card_drops={...old.farm.rate_snapshot!.card_drops!,version:'card_farm_v2',definition_rarities:undefined,quality_weights:{bronze:150000,silver:500000,gold:350000}};delete old.farm.rate_snapshot!.card_drops.definition_rarities;
 const reserve=(input:AccountState,from:number,to:number,id:string)=>reserveFarm(input,base+from,base+to,new Date(base+to).toISOString(),id,content),whole=reserve(s,0,43200000,'whole'),legacy=reserve(old,0,43200000,'whole'),a=reserve(s,0,333333,'a'),split=reserve(a,333333,43200000,'b');
 const loot=(x:AccountState)=>x.pending_rewards.flatMap(p=>p.items),payload=(x:AccountState)=>loot(x).map(({instance_id,...i})=>i);assert.deepEqual(whole.farm.loot_rng,legacy.farm.loot_rng);assert.deepEqual(loot(whole).filter(i=>i.kind==='equipment'),loot(legacy).filter(i=>i.kind==='equipment'));assert.deepEqual(payload(whole),payload(split));assert.deepEqual(whole.farm.loot_rng,split.farm.loot_rng);assert.deepEqual(payload(whole),payload(reserve(s,0,72000000,'whole')));
});
test('gacha preserves29/9 counter progress, chooses matching fixed monsters, and never creates future rarities',()=>{
 const s=state();s.gacha.card_v1={gold_misses:28,bronze_streak:8};const first=pullCards(s,1,()=>0,'one',content)[0]!,next=pullCards(s,1,()=>0,'two',content)[0]!;assert.equal(first.rarity_id,'common');assert.equal(next.rarity_id,'legendary');assert.equal(origins[next.definition_id]!.grade,'mvp');assert.deepEqual(s.gacha.card_v1,{gold_misses:0,bronze_streak:0});
 for(const roll of [0,.5,.75,.95,.97,.999999]){const item=pullCards(state(),1,()=>roll,'r',content)[0]!;assert.equal(item.rarity_id,cardRarity(item.definition_id,content));assert.ok(!['immortal','supreme'].includes(item.rarity_id));assert.equal('legacy_quality'in item,false);}
});
test('Add Card sorts free cards first, then actual owner, rarity and level without mutating saved order',()=>{
 const s=state(),main=s.roster[0]!,npc=s.roster.find(a=>a.character_id==='npc_swordsman')!;s.inventory.push({...card('card_baphomet'),instance_id:'worn_mvp'}, {...card('card_weapon_1'),instance_id:'free_strong'},{...card('card_hydra'),instance_id:'free_weak'}, {...card('card_weapon_1'),instance_id:'npc_card'});main.slot_progress.weapon.cards[0]='worn_mvp';npc.slot_progress.weapon.cards[0]='npc_card';const before=structuredClone(s),rows=cardInventory(s,'weapon');assert.deepEqual(rows.map(r=>r.item.instance_id),['free_strong','free_weak','worn_mvp','npc_card']);assert.deepEqual(s,before);
});

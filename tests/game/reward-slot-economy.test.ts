import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command, CombatStats } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { claimRewards } from '../../src/domain/progression/claim-rewards.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { equippedSources } from '../../src/domain/build/equipment.ts';
import { characterBlueprint } from '../../src/domain/build/character.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { enchantLinesFor } from '../../src/domain/build/slot-definition.ts';
import { equipmentSlots } from '../../src/domain/build/equipment-definition.ts';
import { slotChangePreview } from '../../src/client/slots.ts';
import { equipmentStats } from '../../src/client/equipment.ts';
import { towerRow } from '../../src/domain/modes/tower.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const iso='2026-10-22T00:00:00.000Z',at=Date.parse(iso),rules=new AccountCommandRules();
const initial=()=>equipStarterSet(initializeAccount(content,{root_job_id:'mage',gender:'male'},iso,'2026-10-22',1));
const zero=(s:AccountState)=>Object.fromEntries(Object.keys(s.wallet).map(k=>[k,0])) as AccountState['wallet'];
const pending=(s:AccountState,n=10):AccountState['pending_rewards']=>Array.from({length:n},(_,i)=>({claim_id:'batch_'+i,kind:'daily' as const,resource_vector:{...zero(s),gold:100},items:[],content_version:content.manifest.content_version,reserved_at:iso,source_keys:['daily:probe:'+i],status:'pending' as const}));
function run(s:AccountState,type:Command['type'],params:unknown,now=at){const command={type,params,request_id:'22222222-2222-4222-8222-222222222222',expected_revision:1,schema_version:1,...rules.versions}as Command;rules.parse(command);return rules.decide(command,s,null,{server_at:new Date(now).toISOString(),now_ms:now,farm_from_ms:at,battle_seed:634785765}as CommandTime,'a'.repeat(64));}
test('batch claims validate full selection/capacity/duplicates/overflow before changing wallet or rewards',()=>{
 const s=initial();s.pending_rewards=pending(s);const before=structuredClone(s);
 assert.throws(()=>claimRewards(s,['batch_0','missing'],content),/CLAIM_NOT_FOUND/);assert.deepEqual(s,before);
 assert.throws(()=>claimRewards(s,['batch_0','batch_0'],content),/INVALID_CLAIM_SELECTION/);assert.deepEqual(s,before);
 assert.throws(()=>rules.parse({type:'reward.claim',params:{claim_id:'a',claim_ids:['a']},request_id:'22222222-2222-4222-8222-222222222222',expected_revision:1,schema_version:1,...rules.versions}));
 s.wallet.gold=Number.MAX_SAFE_INTEGER-500;const overflow=structuredClone(s);assert.equal(run(s,'reward.claim',{claim_ids:s.pending_rewards.map(p=>p.claim_id)}).receipt.result.code,'RESOURCE_OVERFLOW');assert.deepEqual(s,overflow);
 s.wallet.gold=0;const item=structuredClone(s.inventory[0]!);s.pending_rewards[0]!.items=[{...item,instance_id:'drop'}];s.pending_rewards[1]!.items=[{...item,instance_id:'drop'}];const dup=structuredClone(s);assert.equal(run(s,'reward.claim',{claim_ids:['batch_0','batch_1']}).receipt.result.code,'DUPLICATE_REWARD_INSTANCE');assert.deepEqual(s,dup);
 s.pending_rewards[1]!.items=[];while(s.inventory.length<500)s.inventory.push({...item,instance_id:'fill_'+s.inventory.length});const full=structuredClone(s),denied=run(s,'reward.claim',{claim_ids:['batch_0','batch_1']});assert.equal(denied.receipt.result.code,'INVENTORY_FULL');assert.deepEqual(denied.state,full);
});
test('farm collect reserves and pays every pending bundle in one proposal, even a full32-claim queue; full inventory rolls back reservation too',()=>{
 const s=initial();s.pending_rewards=pending(s,32);s.story.cleared_stage_ids=['1-1'];s.story.selected_farm_stage='1-1';s.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,s,content);const before=structuredClone(s),result=run(s,'farm.claim',{collect_rewards:true},at+3600000);
 assert.equal(result.receipt.result.code,'FARM_COLLECTED');assert.equal(result.receipt.committed_revision,2);assert.equal(result.state.pending_rewards.length,0);assert.equal(result.state.wallet.gold,s.wallet.gold+3200+6330);assert.equal(result.state.wallet.crystal,s.wallet.crystal+40);assert.deepEqual(s,before);
 const legacy=run(s,'farm.claim',{},at+3600000);assert.equal(legacy.receipt.result.code,'PENDING_REWARDS_FULL');assert.deepEqual(legacy.state,s);
 const full=structuredClone(s);while(full.inventory.length<500)full.inventory.push({...full.inventory[0]!,instance_id:'fill_'+full.inventory.length});full.pending_rewards[0]!.items=[{...full.inventory[0]!,instance_id:'no-room'}];const denied=run(full,'farm.claim',{collect_rewards:true},at+3600000);assert.equal(denied.receipt.result.code,'INVENTORY_FULL');assert.deepEqual(denied.state,full);
});
test('all18 Enchant presets differ and all6 slots compile their own definition, with server/preview parity and exact historical refunds',()=>{
 const signatures=new Set<string>();for(const slot of equipmentSlots)for(const [line,def]of Object.entries(enchantLinesFor(slot,content))){signatures.add(JSON.stringify(def.modifiers));const s=initial();s.wallet.gold=1000000;s.wallet.enchant_dust=10000;const p={character_id:'main',slot,line_id:line,target_level:3},preview=slotChangePreview(s,'main','slot.enchant',p),r=run(s,'slot.enchant',p);assert.equal(r.receipt.result.code,'SLOT_ENCHANTED');assert.deepEqual(equipmentStats(r.state,'main'),preview.after);const source=equippedSources(r.state.roster[0]!,r.state,content).find(v=>v.source.instance_id.endsWith(slot+'_enchant'))!;assert.deepEqual(source.modifiers,def.modifiers.map(m=>({...m,value:Number(m.value)*3})));}
 assert.equal(signatures.size,18);
 const s=initial(),a=s.roster[0]!;a.slot_progress.armor.enchant={line_id:'offense',level:5};s.paid_ledger.push({entry_id:'old',character_id:'main',feature_id:'enchant_armor',skill_id:'offense',quantity:5,cost_version:'legacy',cost_versions:['legacy'],paid_resources:{...zero(s),gold:123,enchant_dust:7},refund_state:'active',refund_command_id:null});const old=structuredClone(s),m=migrateAccountState(s,content).state;assert.deepEqual(m.roster[0]!.slot_progress,a.slot_progress);assert.deepEqual(m.paid_ledger,s.paid_ledger);assert.deepEqual(m.inventory,s.inventory);rules.validateAccount(m);const changed=run(m,'slot.change_enchant',{character_id:'main',slot:'armor',line_id:'vitality'});assert.equal(changed.receipt.result.resource_delta.gold,123);assert.equal(changed.receipt.result.resource_delta.enchant_dust,7);assert.equal(changed.state.roster[0]!.slot_progress.armor.enchant.level,0);assert.deepEqual(s,old);
});
test('Refine uses additive percentages once for all6 slots at+0/1/5/10 on low and high stats; swapping gear retains investment',()=>{
 for(const slot of equipmentSlots)for(const level of[1,70])for(const refine of[0,1,5,10]){
  const s=initial(),a=s.roster[0]!;a.level=level;a.slot_progress[slot].refine=refine;const sources=equippedSources(a,s,content),actual=resolveStats(characterBlueprint(a,content,sources),content),raw=structuredClone(sources);for(const source of raw)source.modifiers=source.modifiers.filter(m=>m.op!=='add_percent');const flat=resolveStats(characterBlueprint(a,content,raw),content);
  const ratios=new Map<keyof CombatStats,number>();for(const source of sources)for(const m of source.modifiers)if(m.op==='add_percent')ratios.set(m.stat as keyof CombatStats,(ratios.get(m.stat as keyof CombatStats)??0)+Number(m.value));for(const[k,p]of ratios){const defs=content.documents['stat-definitions.json']!.stats as unknown as{id:string;rounding:string}[];const raw=flat[k]!*(1+p),expected=defs.find(d=>d.id===k)!.rounding==='floor_after_modifiers'?Math.floor(raw):raw;assert.ok(Math.abs(actual[k]!-expected)<1e-8,`${slot} ${k} ${actual[k]} vs ${expected}`);}assert.equal(actual.attack_speed,flat.attack_speed);assert.equal(actual.cast_speed,flat.cast_speed);
 }
 const s=initial();s.roster[0]!.slot_progress.weapon.refine=10;const progress=structuredClone(s.roster[0]!.slot_progress.weapon),r=run(s,'equipment.unequip',{character_id:'main',slot:'weapon'});assert.deepEqual(r.state.roster[0]!.slot_progress.weapon,progress);assert.ok(!equippedSources(r.state.roster[0]!,r.state,content).some(v=>v.source.instance_id.endsWith('weapon_refine')));
});
test('AFK40Crystal/h caps at480 per12h, fractional claims preserve carry; frozen legacy earns no retroactiveCrystal then switches to40/h',()=>{
 const s=initial();s.story.cleared_stage_ids=['1-1'];s.story.selected_farm_stage='1-1';s.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,s,content);const all=reserveFarm(s,at,at+20*3600000,new Date(at+20*3600000).toISOString(),'all',content);assert.equal(all.pending_rewards[0]!.resource_vector.crystal,480);
 const a=reserveFarm(s,at,at+12345,new Date(at+12345).toISOString(),'a',content),b=reserveFarm(a,at+12345,at+3600000,new Date(at+3600000).toISOString(),'b',content);assert.equal(b.pending_rewards.reduce((n,c)=>n+c.resource_vector.crystal,0),40);assert.equal(b.farm.remainders.crystal,0);
 const legacy=structuredClone(s);delete legacy.farm.rate_snapshot!.gear_chance_per_million;legacy.farm.rate_snapshot!.per_hour.crystal=0;const migrated=migrateAccountState(legacy,content).state;assert.deepEqual(migrated.farm.rate_snapshot,legacy.farm.rate_snapshot);const first=run(migrated,'farm.claim',{collect_rewards:true},at+3600000);assert.equal(first.state.wallet.crystal,legacy.wallet.crystal);assert.equal(first.state.farm.rate_snapshot!.per_hour.crystal,40);assert.equal(first.state.farm.rate_snapshot!.gear_chance_per_million,500000);
});
test('gear50% roll stays independent of card attempts, legacy100% draw order retained, all scrolls6000gold (D167) and Tower milestones unchanged',()=>{
 const base=initial();base.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,base,content);const profile=base.farm.rate_snapshot!.card_drops!;profile.chance_per_million=1000000;
 const counts=[];for(const chance of[0,500000,1000000]){const s=structuredClone(base);s.farm.rate_snapshot!.gear_chance_per_million=chance;const r=reserveFarm(s,at,at+43200000,new Date(at+43200000).toISOString(),'drops',content);counts.push(r.pending_rewards[0]!.items.filter(i=>i.kind==='equipment').length);assert.equal(r.pending_rewards[0]!.items.filter(i=>i.kind==='card').length,144);assert.deepEqual(r,reserveFarm(s,at,at+43200000,new Date(at+43200000).toISOString(),'drops',content));}assert.equal(counts[0],0);assert.ok(counts[1]!>50&&counts[1]!<95);assert.equal(counts[2],144);
 for(const n of[4,5,6,10,105])assert.equal(towerRow(n,content).crystal,n%5===0?10:0);
 const economy=content.documents['economy.json'] as unknown as{shop:{offers:{id:string;price:{gold?:number}}[]}};assert.ok(economy.shop.offers.filter(o=>o.id.endsWith('_scroll')).every(o=>o.price.gold===6000));
});

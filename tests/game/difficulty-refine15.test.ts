import test from 'node:test';
import assert from 'node:assert/strict';
import {content,actor,battle,checkpoint,step,type Active} from './combat-fixtures.ts';
import {storyStages} from '../../src/domain/modes/story.ts';
import {towerBoss,towerRow} from '../../src/domain/modes/tower.ts';
import {applySlotCommand,refineChance,refinePityBonus,upgradeQuote,slotData,cardCapacity,type SlotCommand} from '../../src/domain/progression/slots.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {refinePercent} from '../../src/client/slots.ts';

test('D142 Story every5stages respects growth profiles and chapter boundaries never reset boss HP/ATK fromchapter3',()=>{
 const stages=storyStages(content).filter(s=>s.chapter<=8),rules={3:[1.08,1.04],4:[1.08,1.04],5:[1.08,1.04],6:[1.20,1.08],7:[1.12,1.06],8:[1.12,1.06]}as Record<number,number[]>;
 for(let i=1;i<stages.length;i++){
  const s=stages[i]!,b=s.encounter[0]!.resolved_base,p=stages[i-1]!.encounter[0]!.resolved_base;
  if(s.chapter<3)continue;assert.ok(b.max_hp>p.max_hp,s.id);assert.ok(b.physical_attack>p.physical_attack,s.id);assert.equal(b.attack_speed,100);assert.equal(b.cast_speed,100);
  if(s.index>5){const last=stages[i-5]!.encounter[0]!.resolved_base;assert.ok(b.max_hp/last.max_hp>=rules[s.chapter]![0]!,s.id);assert.ok(b.physical_attack/last.physical_attack>=rules[s.chapter]![1]!,s.id);}
  if([5,10,15].includes(s.index)){const id=s.encounter[0]!.active_slots[0]!,skill=resolveSkill(id,1,content).definition as Active;assert.equal(skill.timing.cast_ms,4000);assert.equal(skill.timing.interruptible,true);}
 }
 for(const[id,hp,attack]of [['6-5',71992,2299],['6-10',86392,2485],['6-15',103674,2687],['6-20',124412,2904]]as const){const s=stages.find(s=>s.id===id)!;assert.equal(s.encounter[0]!.resolved_base.max_hp,hp);assert.equal(s.encounter[0]!.resolved_base.physical_attack,attack);}
 const first=stages[0]!.encounter[0]!.resolved_base;assert.equal(first.max_hp,328);assert.equal(first.physical_attack,4050);
});

test('D142 Tower ordinary and magic power grow10% fromone polynomial; unchangedHP/DEF/speed (D187 rewards separate) and100+floors',()=>{
 for(const f of [1,10,21,100,101,1000]){const row=towerRow(f,content),boss=towerBoss(f,content);assert.equal(row.attack,Math.ceil((220+44*f+11*f*f)/20));assert.equal(row.hp,600+100*f+8*f*f+2*f**3);assert.equal(row.defense,5+3*f);assert.equal(boss.resolved_base.physical_attack,row.attack);assert.equal(boss.resolved_base.magical_attack,row.attack);assert.equal(boss.resolved_base.attack_speed,100);}
});

test('D141 exact15rank chances/old prices/new costs and gradualpity are shared and display half-percent accurately',()=>{
 const cfg=slotData(content).refine;assert.equal(cfg.max,15);
 const chances=[1,1,1,1,.7,.55,.4,.28,.18,.1,.08,.05,.03,.02,.01];for(let target=1;target<=15;target++){assert.equal(refineChance({refine:target-1,refine_failures:0},content),chances[target-1]);assert.equal(refinePityBonus(target,content),target<=10?.1:.005);}
 assert.equal(refinePercent(refineChance({refine:14,refine_failures:1},content)),'1.5%');
 assert.deepEqual(upgradeQuote(0,10,15,cfg.upgrade_rows),{gold:77000,refine_ore:440});assert.deepEqual(upgradeQuote(0,15,15,cfg.upgrade_rows),{gold:248000,refine_ore:960});assert.deepEqual(upgradeQuote(14,15,15,cfg.upgrade_rows),{gold:45000,refine_ore:120});
 assert.deepEqual([0,4,5,9,10,14,15].map(n=>cardCapacity(n,content)),[0,0,1,1,2,2,3]);
});

test('D141 boundaryroll fails exactlyatchance, preserveslevel/cards andspendsonecost; successresetspity and15roundtrips/migrates',()=>{
 const state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},'2026-10-23T00:00:00Z','2026-10-23',1),p=state.roster[0]!.slot_progress.weapon;
 state.wallet.gold=1000000;state.wallet.refine_ore=10000;p.refine=14;
 const command={type:'slot.refine',params:{character_id:'main',slot:'weapon',target_level:15},request_id:'22222222-2222-4222-8222-222222222222'}as SlotCommand;
 assert.equal(applySlotCommand(state,command,content,.01),'REFINE_FAILED');assert.equal(p.refine,14);assert.equal(p.refine_failures,1);assert.equal(state.wallet.gold,955000);assert.equal(state.wallet.refine_ore,9880);assert.equal(p.cards.length,3);
 assert.equal(applySlotCommand(state,command,content,.014999),'SLOT_REFINED');assert.equal(p.refine,15);assert.equal(p.refine_failures,0);
 const rules=new AccountCommandRules();assert.doesNotThrow(()=>rules.validateAccount(state));const migrated=migrateAccountState(JSON.parse(JSON.stringify(state)),content).state;assert.deepEqual(migrated,state);
 const before=structuredClone(state);assert.throws(()=>applySlotCommand(state,{...command,params:{...command.params,target_level:16}}as SlotCommand,content,0),/UPGRADE_CAP_REACHED/);assert.deepEqual(state,before);
});

test('D140 higherStory stat inputs still share identical skill/control results at1x/2x/4x',()=>{
 const s=storyStages(content).find(s=>s.id==='6-15')!,boss=s.encounter[0]!,id=boss.active_slots[0]!,big=resolveSkill(id,1,content).definition as Active,stun=structuredClone(resolveSkill('swordsman_bash',10,content).definition)as Active;
 stun.timing.cast_ms=1000;stun.cost.sp=0;for(const e of stun.effects){if(e.type==='apply_status')e.chance=1;if(e.type==='damage'){e.formula={id:'flat_power',params:{amount:1}};e.hit_rule='always';e.can_crit=false;}}
 const p=actor('p','player',[stun]),e=actor('z','enemy',[big]);const initial=checkpoint(battle([p,e]));initial.actors.find(a=>a.actor_id==='z')!.stats.magical_attack=boss.resolved_base.magical_attack;
 const runs=[1,2,4].map(speed=>{let state=checkpoint(initial);const events=[];while(state.game_time_ms<6000){const next=step(state,Math.min(6000,state.game_time_ms+50*speed));events.push(...next.events);state=checkpoint(next.state);}return{state,events};});
 assert.deepEqual(runs[1],runs[0]);assert.deepEqual(runs[2],runs[0]);assert.ok(runs[0]!.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='z'));assert.ok(!runs[0]!.events.some(e=>e.type==='damage'&&e.skill_id===id));
});

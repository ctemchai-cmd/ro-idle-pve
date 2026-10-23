import test from 'node:test';
import assert from 'node:assert/strict';
import { content } from './combat-fixtures.ts';
import { AUDIT_CASES,auditBuilds,auditFixture,auditInput,auditFight } from '../../scripts/game/class-audit-fixtures.ts';
import { advanceUntil, type BattleState } from '../../src/domain/combat/index.ts';
test('T129 fixture matrix validates current ancestry, four unique slots, gear and manual budgets; High inherits parents',()=>{
  let count=0;
  for(const condition of AUDIT_CASES)for(const build of auditBuilds(content,condition.stage)){
    const f=auditFixture(build,condition,content),main=f.account.roster[0];count++;
    assert.equal(f.points_spent+main.unspent_status_points,f.point_budget);
    assert.equal(main.active_slots.length,4);const slots=main.active_slots.filter(Boolean);assert.equal(new Set(slots).size,slots.length);
    assert.equal(main.awakened_skills.length,condition.awaken?4:0);
    for(const id of Object.values(main.equipment)){const item=f.account.inventory.find(i=>i.instance_id===id)!;assert.equal(content.items[item.definition_id]!.tier_level,condition.tier);assert.equal(item.rarity_id,'common');}
    if(condition.stage===3)assert.ok(Object.keys(main.skill_levels).some(id=>content.jobs.byId[build.job]!.ancestors.slice(0,-1).includes(String(content.skills[id]!.class_id))));
  }
  assert.equal(count,1224);
});
test('T129 bosses and companion builds are byte-identical across candidate jobs within each condition',()=>{
  for(const condition of [AUDIT_CASES[3]!,AUDIT_CASES[8]!]){
    const inputs=auditBuilds(content,condition.stage).filter((_,i)=>i%8===0).map(b=>auditInput(auditFixture(b,condition,content),'pressure',content));
    const common=inputs[0]!.actors.filter(a=>a.actor_id!=='main').map(a=>({...a,build_hash:'ignored'}));
    for(const input of inputs.slice(1))assert.deepEqual(input.actors.filter(a=>a.actor_id!=='main').map(a=>({...a,build_hash:'ignored'})),common);
  }
});
test('T129 includes summon and periodic damage, independent seeds and exact checkpoint/speed parity',()=>{
  const condition=AUDIT_CASES[3]!,build=auditBuilds(content,2).find(b=>b.id==='alchemist-1-magic')!;
  const f=auditFixture(build,condition,content),before=JSON.stringify(f),input=auditInput(f,'dummy',content),result=auditFight(input,22901,content);
  assert.ok(result.sample.skill_damage.alchemist_hell_plant!>0);assert.ok(result.sample.skill_damage.alchemist_bio_cannibalize!>0);
  assert.equal(result.sample.duration_ms,90000);assert.equal(result.sample.alive_ms,90000);assert.ok(result.sample.last30_dps>0);
  assert.ok(Math.abs(result.sample.dps-result.sample.normal_dps-result.sample.skill_dps)<1e-9);
  const replay=auditFight(input,22901,content);assert.deepEqual(replay.sample,result.sample);assert.deepEqual(replay.final,result.final);assert.equal(JSON.stringify(f),before);
  for(const speed of [1,2,4]){let state:BattleState=result.initial;while(state.game_time_ms<90000){const run=advanceUntil(state,Math.min(90000,state.game_time_ms+1000*speed),content);assert.ok(run.ok);state=JSON.parse(JSON.stringify(run.value.state));}assert.deepEqual(state,result.final);}
});

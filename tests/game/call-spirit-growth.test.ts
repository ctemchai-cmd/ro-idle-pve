// Focused deterministic rule cases, not a balance simulation batch.
import test from 'node:test';
import assert from 'node:assert/strict';
import rawJson from '../../src/generated/content.json';
import type { RawContent } from '../../src/content/model.ts';
import type { ObjectValue } from '../../src/content/value.ts';
import { validateContent } from '../../src/content/loader.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { battleStatusViews } from '../../src/client/combat-status.ts';
import { actor, battle, checkpoint, content, skill, step, type Active } from './combat-fixtures.ts';

const counts = [1,2,3,4,5,5,5,5,5,5], bonuses = [.01,.01,.01,.01,.01,.012,.014,.016,.018,.02];
const close = (a: number, b: number) => assert.ok(Math.abs(a-b) < 1e-7, `${a} != ${b}`);
function monk(id: string, level: number, equipped = true, other?: Active) {
  const learned = structuredClone(resolveSkill('monk_call_spirits', level, content));
  const input = actor(id, 'player', other ? [other] : equipped ? [learned.definition as Active] : []);
  input.resolved_skills.monk_call_spirits = {level,definition:learned.definition as Active};
  input.stat_blueprint.derived_offsets.physical_attack = 1000;
  return input;
}

test('all ten ranks grant the authored number, cap at five, and add the learned per-sphere ATK once', () => {
  for (let level=1;level<=10;level++) {
    const initial=battle([monk('main',level),actor('boss','enemy')]);
    const base=initial.actors.find(a=>a.actor_id==='main')!.stats.physical_attack;
    const result=step(initial,1900),main=result.state.actors.find(a=>a.actor_id==='main')!;
    assert.equal(main.spirit_spheres,counts[level-1]);
    close(main.stats.physical_attack,base*(1+counts[level-1]!*bonuses[level-1]!));
    const view=battleStatusViews(result.state).main!;
    close(view.spirit_attack_per_sphere!,bonuses[level-1]!);close(view.spirit_attack_bonus!,counts[level-1]!*bonuses[level-1]!);
    assert.ok(result.events.some(e=>e.type==='cast_resolve'&&e.skill_id==='monk_call_spirits'));
    const full=checkpoint(initial),held=full.actors.find(a=>a.actor_id==='main')!;held.spirit_spheres=4;recomputeStats(held,content);
    const capped=step(full,1900);assert.equal(capped.state.actors.find(a=>a.actor_id==='main')!.spirit_spheres,5);
    assert.equal(capped.state.metrics.actors.main!.sphere_wasted,Math.max(0,counts[level-1]!-1));
  }
});

test('different monks keep their own learned rank, and passive spheres use that rank even off the active slots', () => {
  const initial=checkpoint(battle([monk('low',1,false),monk('high',10,false),actor('no_call','player'),actor('boss','enemy')]));
  for(const a of initial.actors.filter(a=>a.team==='player')){a.spirit_spheres=5;recomputeStats(a,content);}
  const view=battleStatusViews(initial);close(view.low!.spirit_attack_bonus!,.05);close(view.high!.spirit_attack_bonus!,.10);close(view.no_call!.spirit_attack_bonus!,.05);
  close(view.high!.spirit_attack_per_sphere!,.02);close(view.low!.spirit_attack_per_sphere!,.01);
  const buff=skill('attack_probe',0,0,0);buff.effects=[{id:'atk',type:'apply_status',target:'self',status_id:'attack_up',duration_ms:5000,params:{ratio:.5},chance:1}];
  const mixed=checkpoint(battle([monk('main',10,false,buff),actor('boss','enemy')])),main=mixed.actors.find(a=>a.actor_id==='main')!,base=main.stats.physical_attack;
  main.spirit_spheres=5;recomputeStats(main,content);
  close(step(mixed,1500).state.actors.find(a=>a.actor_id==='main')!.stats.physical_attack,base*1.6);
});

test('rank10 spending uses remaining0/4 spheres at cast start and an interrupted cast never refunds them', () => {
  for(const cost of [1,5]){
    const spend=skill('spend_probe',1000,0,0);spend.cost.spirit_spheres=cost;
    const cancel=skill('cancel_probe',200,10000,0);cancel.effects=[{id:'stop',type:'interrupt',target:'foe'}];
    const initial=checkpoint(battle([monk('main',10,false,spend),actor('boss','enemy',[cancel])]));
    const main=initial.actors.find(a=>a.actor_id==='main')!,base=main.stats.physical_attack;main.spirit_spheres=5;recomputeStats(main,content);
    const casting=step(initial,1500).state.actors.find(a=>a.actor_id==='main')!;
    assert.equal(casting.spirit_spheres,5-cost);close(casting.cast!.offense_snapshot.physical_attack,base*(1+(5-cost)*.02));
    const cut=step(initial,2000);assert.ok(cut.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='main'));
    assert.equal(cut.state.actors.find(a=>a.actor_id==='main')!.spirit_spheres,5-cost);
    assert.ok(!cut.events.some(e=>e.type==='damage'&&e.skill_id==='spend_probe'));
  }
});

test('resource skill references reject unknown skill/curve or unsupported conditions before gameplay', () => {
  for(const [kind,expected]of [['skill','unknown_resource_skill'],['curve','resource_skill_curve'],['condition','resource_modifier_value']]as const){
    const raw=structuredClone(rawJson)as unknown as RawContent;
    const resources=raw.documents['stat-definitions.json']!.combat_resources as ObjectValue[];
    const row=(resources.find(r=>r.id==='spirit_spheres')!.per_unit_modifiers as ObjectValue[])[0]!;
    if(kind==='skill')(row.value_from_skill as ObjectValue).skill_id='does_not_exist';
    if(kind==='curve')(row.value_from_skill as ObjectValue).level_parameter='does_not_exist';
    if(kind==='condition')row.when={type:'has_tag',actor:'self',tag:'probe'};
    const result=validateContent(raw);assert.ok(!result.ok);assert.ok(result.errors.some(e=>e.code===expected),kind);
  }
});

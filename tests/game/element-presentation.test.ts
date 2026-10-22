// Read-only presentation and a focused engine parity check; no balance runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Effect, SkillDefinition, StatusDefinition } from '../../src/contracts/index.ts';
import { actorElements, elementMatchups, elementNames, skillDamageElements } from '../../src/client/elements.ts';
import { effectDescriptions } from '../../src/client/skills.ts';
import { ElementBadge, SkillElements } from '../../src/ui/element-badge.tsx';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { actor, battle, checkpoint, content, skill, step } from './combat-fixtures.ts';

const definition = (id: string) => structuredClone(resolveSkill(id, 1, content).definition) as SkillDefinition;
test('ROO Global screenshot goldens use total damage percentages, including asymmetric and same-element penalties', () => {
  const rows = elementMatchups();
  for (const [attack, armor, total] of [
    ['fire','earth',175],['fire','fire',25],['fire','water',80],['fire','undead',150],
    ['water','fire',175],['water','wind',90],['earth','water',100],['earth','fire',80],
    ['wind','water',175],['wind','earth',80],['neutral','ghost',70],['ghost','neutral',70],
    ['ghost','ghost',150],['ghost','undead',125],['holy','undead',175],['holy','dark',150],
    ['holy','holy',25],['poison','holy',50],['poison','water',125],['dark','undead',25],
    ['undead','dark',25],['undead','holy',125],
  ] as const) assert.equal(rows.find(r=>r.attack===attack)!.targets.find(c=>c.armor===armor)!.multiplier, total/100, `${attack} → ${armor}`);
});
test('direct, weapon, mixed, periodic, passive, summoned and handler skill elements use their actual programs', () => {
  const expected = {
    mage_fire_bolt: ['fire'], mage_cold_bolt: ['water'], mage_lightning_bolt: ['wind'], mage_soul_strike: ['ghost'],
    wizard_storm_gust: ['water'], wizard_heavens_drive: ['earth'], wizard_meteor: ['fire'],
    acolyte_holy_light: ['holy'], crusader_reflect: ['holy'], hunter_blitz_beat: ['neutral'], hunter_falcon: ['neutral'],
    sage_auto_bolt: ['fire'], thief_envenom: ['weapon', 'poison'], assassin_venom_dust: ['poison'],
    assassin_detonate: ['poison'], alchemist_hell_plant: ['poison'], alchemist_demonstration: ['fire'],
    swordsman_bash: ['weapon'], monk_asura: ['weapon'], rogue_copy_mage_fire_bolt: ['fire'],
    acolyte_heal: [], bard_healing_song: [], dancer_healing_song: [], sage_fire_endow: [], alchemist_bio_cannibalize: [],
  };
  for (const [id, elements] of Object.entries(expected)) assert.deepEqual(skillDamageElements(definition(id)), elements, id);
  assert.match(effectDescriptions((definition('thief_envenom') as Extract<SkillDefinition, { kind: 'active' }>).effects)[0]!, /ตามธาตุอาวุธ/);
  assert.match(effectDescriptions((definition('thief_envenom') as Extract<SkillDefinition, { kind: 'active' }>).effects)[1]!, /ดาเมจธาตุพิษ/);
  for (const id of ['acolyte_heal', 'bard_healing_song']) {
    const d = definition(id) as Extract<SkillDefinition, { kind: 'active' }>;
    assert.ok(!effectDescriptions(d.effects).some(s => s.includes('ธาตุ')), id);
  }
});

test('all126 player skill descriptions remain read-only and nested status cycles terminate', () => {
  const ids = Object.values(content.skills).filter(s => s.class_id !== 'enemy').map(s => String(s.id));
  assert.equal(ids.length, 126);
  for (const id of ids) {
    const d = definition(id), before = JSON.stringify(d), elements = skillDamageElements(d);
    assert.ok(elements.every(e => e === 'weapon' || e in elementNames), id);
    assert.equal(new Set(elements).size, elements.length, id);
    assert.equal(JSON.stringify(d), before, id);
  }
  const d = definition('thief_envenom') as Extract<SkillDefinition, { kind: 'active' }>;
  const catalog = structuredClone(content), venom = catalog.statuses.venom as unknown as StatusDefinition;
  venom.periodic!.effects.push(d.effects[1]!);
  assert.deepEqual(skillDamageElements(d, catalog), ['weapon', 'poison']);
});

test('displayed armor element agrees with actual damage priority for every element and latest source', () => {
  const elements = Object.keys(elementNames) as (keyof typeof elementNames)[];
  const chart = content.documents['combat-rules.json']!.element_chart as unknown as Record<string, Record<string, number>>;
  const displayed = elementMatchups(); assert.equal(displayed.length, 10); assert.equal(displayed.reduce((n,row)=>n+row.targets.length,0),100);
  for (const armor of elements) {
    const target = actor('target', 'enemy'); target.tags = ['element:water'];
    for (const [i, element] of ['fire', armor].entries()) target.stat_blueprint.permanent_sources.push({
      source: { instance_id: `card_${i}`, owner_actor_id: 'target', origin_actor_id: 'target', origin_life_epoch: 0, definition_id: 'card_test' },
      modifiers: [], triggers: [], defense_element: element as keyof typeof elementNames,
    });
    const state = checkpoint(battle([actor('caster', 'player'), target])), a = state.actors.find(a => a.actor_id === 'target')!;
    const pipeline = new EffectPipeline(state, content, { emit: () => {}, metric: () => {}, interrupt: () => {}, revive: () => {} });
    for (const attack of elements) {
      const before = JSON.stringify(state); assert.equal(actorElements(a).armor, armor); assert.equal(JSON.stringify(state), before);
      const c = pipeline.context(state.actors.find(a => a.actor_id === 'caster')!, 'probe', 'skill', 'root'); c.selected = { target: [a] };
      const effect: Effect = { id: 'probe', type: 'damage', target: 'target', formula: { id: 'flat_power', params: { amount: 1000 } }, damage_type: 'physical', element: attack, hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'ignore' };
      const hp = a.hp; pipeline.program([effect], c);
      assert.equal(hp - a.hp, 1000 * chart[attack]![armor]!, `${attack} → ${armor}`);
      assert.equal(hp-a.hp,1000*displayed.find(row=>row.attack===attack)!.targets.find(cell=>cell.armor===armor)!.multiplier,`display ${attack} → ${armor}`);
    }
  }
  const neutral = battle([actor('plain', 'player'), actor('boss', 'enemy')]).actors[0]!;
  assert.equal(actorElements(neutral).armor, 'neutral');
  const tagged = checkpoint(battle([actor('plain', 'player'), actor('boss', 'enemy')])).actors[1]!; tagged.tags = ['element:earth'];
  assert.equal(actorElements(tagged).armor, 'earth');
});

test('Fire Endow changes only live weapon display and expires; fixed skill/armor remain separate', () => {
  const endow = skill('endow', 0, 60000, 0); endow.effects = [{ id: 'fire', type: 'apply_status', target: 'self', status_id: 'fire_endow', duration_ms: 1000, params: {}, chance: 1 }];
  const state = battle([actor('sage', 'player', [endow]), actor('boss', 'enemy')]);
  assert.deepEqual(actorElements(state.actors.find(a => a.actor_id === 'sage')!), { weapon: 'neutral', armor: 'neutral' });
  const live = step(state, 1500).state;
  assert.deepEqual(actorElements(live.actors.find(a => a.actor_id === 'sage')!), { weapon: 'fire', armor: 'neutral' });
  assert.deepEqual(skillDamageElements(definition('mage_cold_bolt')), ['water']);
  assert.deepEqual(actorElements(step(live, 2500).state.actors.find(a => a.actor_id === 'sage')!), { weapon: 'neutral', armor: 'neutral' });
});

test('badges disclose elements as text, distinguish armor/weapon, and do not invent a Holy heal', () => {
  const fire = renderToStaticMarkup(createElement(SkillElements, { definition: definition('mage_fire_bolt') }));
  assert.match(fire, /data-element="fire"/); assert.match(fire, /aria-label="ธาตุไฟ"/);
  const mixed = renderToStaticMarkup(createElement(SkillElements, { definition: definition('thief_envenom') }));
  assert.match(mixed, /ตามอาวุธ/); assert.match(mixed, /data-element="poison"/);
  assert.match(renderToStaticMarkup(createElement(ElementBadge, { element: 'water', armor: true })), /aria-label="เกราะธาตุน้ำ"/);
  assert.match(renderToStaticMarkup(createElement(SkillElements, { definition: definition('acolyte_heal') })), /ไม่มีธาตุโจมตี/);
});

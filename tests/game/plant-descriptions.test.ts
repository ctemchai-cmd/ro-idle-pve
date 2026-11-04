import test from 'node:test';
import assert from 'node:assert/strict';
import { actor, battle, content, step, unwrap, type Active } from './combat-fixtures.ts';
import { serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { enhanceArtifactSkill } from '../../src/domain/build/artifacts.ts';
import { describeResolvedSkill } from '../../src/client/skills.ts';
import { artifactView, artifactDetails, type ArtifactItem } from '../../src/client/artifacts.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';

test('plant descriptions agree with actual first damage/heal ticks at base/Awaken ranks and Artifact power', () => {
  const original = JSON.stringify(content.documents['summon-actors.json']);
  for (const id of ['alchemist_hell_plant', 'alchemist_bio_cannibalize']) for (const level of [1, 10]) for (const awakened of [false, true]) for (const bonus of [0, .5]) {
    const definition = enhanceArtifactSkill(resolveSkill(id, level, content, awakened).definition, bonus) as Active;
    const info = describeResolvedSkill(definition, level), text = info.effects.join(' ');
    assert.match(text, /M\.ATK ผู้ร่าย.*ทุก 1s\/ตัว/);
    assert.doesNotMatch(text, /พลัง \d|P\.ATK/);
    assert.match(info.notes.join(' '), /ตอนเริ่มร่าย/);
    const a = actor('a', 'player', [definition]);
    Object.assign(a.stat_blueprint.derived_offsets, { magical_attack: 1000, physical_attack: 90000, max_sp: 10000 });
    const checkpoint = serializeBattle(battle([a, actor('b', 'enemy')]));
    checkpoint.actors[0]!.hp = Math.floor(checkpoint.actors[0]!.hp / 2);
    const stats = checkpoint.actors[0]!.stats, result = step(unwrap(restoreBattle(checkpoint, content)), 7000);
    const spawn = result.events.find(e => e.type === 'summon')!;
    assert.ok(spawn, id);
    for (const [kind, prefix] of [['damage', 'เวท'], ['heal', 'ฟื้น HP']] as const) {
      const line = info.effects.find(line => line.startsWith(prefix));
      if (!line) { assert.equal(kind, 'heal'); assert.equal(id, 'alchemist_hell_plant'); continue; }
      const ratio = Number(line.match(/([\d.,]+)% M\.ATK/)![1]!.replaceAll(',', '')) / 100;
      const event = result.events.find(e => e.type === kind && e.source_instance_id === spawn.actor_id)!;
      assert.ok(event, `${id} ${kind}`);
      assert.equal(event.at_ms - spawn.at_ms, 1000);
      // UI rounds percent to 2 decimals; engine floors inherited M.ATK and final healing.
      assert.ok(Math.abs(stats.magical_attack * ratio - (kind === 'damage' ? event.raw! : event.amount!)) < 2, `${id} ${level} ${awakened} ${bonus}: ${line}`);
    }
  }
  assert.equal(JSON.stringify(content.documents['summon-actors.json']), original, 'presentation does not rewrite actor formulas');
});

test('Artifact plant labels distinguish damage and healing and show the enhanced current phase', () => {
  const state = initializeAccount(content, { root_job_id: 'merchant', gender: 'male' }, '2026-11-04T00:00:00Z', '2026-11-04', 1);
  const actor = state.roster[0]!; actor.job_id = 'creator'; actor.level = 100; actor.local_cap = 100;
  for (const id of ['alchemist_hell_plant', 'alchemist_bio_cannibalize']) {
    const item: ArtifactItem = { instance_id: id, definition_id: 'artifact_' + id, rarity_id: 'legendary', level: 10, stars: 0, locked: false, invested_gold: 0, invested_essence: 0 };
    actor.skill_levels[id] = 1;
    assert.match(artifactView(item, state).enhancementLabel, /ดาเมจผู้ช่วย \+50%/);
    assert.equal(artifactView(item, state).enhancementLabel.includes('ฮีลผู้ช่วย'), id === 'alchemist_bio_cannibalize');
    const base = artifactDetails(item, state).effects;
    actor.awakened_skills.push(id);
    const awakened = artifactDetails(item, state).effects;
    assert.notDeepEqual(base, awakened);
    assert.ok([...base, ...awakened].filter(t => /^(เวท|ฟื้น HP)/.test(t)).every(t => t.includes('M.ATK ผู้ร่าย')));
  }
});

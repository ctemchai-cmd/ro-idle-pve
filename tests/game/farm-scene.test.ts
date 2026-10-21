import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStage } from '../../src/domain/modes/story.ts';
import { FarmWaveSession, farmSceneStage, farmWaveRows, type FarmTuning } from '../../src/client/farm-scene.ts';
import { content } from './combat-fixtures.ts';

const shell = JSON.parse(readFileSync(new URL('../../src/renderer/shell-visuals.json', import.meta.url), 'utf8')) as { farm: FarmTuning & { chapters: Record<string, { label: string; meta_path: string }[]> } };
const tuning = shell.farm;
const account = () => initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);

test('farm scene uses the selected farm stage, else furthest cleared, else 1-1', () => {
  const state = account();
  assert.equal(farmSceneStage(state).id, '1-1');
  state.story.cleared_stage_ids = ['1-1', '1-2', '1-3'];
  assert.equal(farmSceneStage(state).id, '1-3');
  state.story.selected_farm_stage = '1-2';
  assert.equal(farmSceneStage(state).id, '1-2');
});

test('farm waves prefer authored stage adds and only derive weak rows from the boss when a stage has none', () => {
  const withAdds = storyStage('1-8', content)!, onlyBoss = storyStage('1-1', content)!;
  const authored = farmWaveRows(withAdds, 0, tuning);
  assert.ok(authored.length >= tuning.mobs_per_wave[0] && authored.length <= tuning.mobs_per_wave[1]);
  assert.ok(authored.every(row => row.actor_id !== 'enemy_front'));
  const boss = onlyBoss.encounter[0]!, derived = farmWaveRows(onlyBoss, 1, tuning);
  assert.equal(derived[0]!.resolved_base.max_hp, Math.round(boss.resolved_base.max_hp * tuning.derived_from_boss_when_no_adds.max_hp));
  assert.ok(derived[0]!.resolved_base.max_hp < boss.resolved_base.max_hp);
});

test('a farm wave runs the shared engine to a terminal result with presentation skins only', () => {
  const state = account(), skins = shell.farm.chapters['1']!;
  for (const wave of [0, 1, 2]) {
    const session = new FarmWaveSession(state, farmSceneStage(state), wave, skins, tuning);
    const mobs = session.scene.actors.filter(a => a.actor_id.startsWith('farm_mob_'));
    assert.ok(mobs.length >= 2 && mobs.every(a => skins.some(s => s.meta_path === a.body_meta)));
    assert.equal(session.view().actors.filter(a => a.team === 'player').length, 4);
    for (let ms = 0; ms <= tuning.wave_time_limit_ms && !session.state.terminal_result; ms += 500) session.advanceTo(ms);
    assert.ok(session.state.terminal_result, `wave ${wave} reaches a terminal state`);
  }
});

test('farm presentation never mutates the saved account state', () => {
  const state = account(), before = JSON.stringify(state);
  const session = new FarmWaveSession(state, farmSceneStage(state), 0, shell.farm.chapters['1']!, tuning);
  session.advanceTo(5000);
  assert.equal(JSON.stringify(state), before);
});

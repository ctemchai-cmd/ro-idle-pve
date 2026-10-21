import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStats } from '../../src/domain/math/index.ts';
import { storyStages, storyStage, storyBoss } from '../../src/domain/modes/story.ts';
import { progressionData } from '../../src/domain/progression/characters.ts';
import { storyStageInfo } from '../../src/client/story.ts';
import { actor, content } from './combat-fixtures.ts';

const stats = (primary: Partial<Record<'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk', number>>, level = 20) => {
  const blueprint = actor('a', 'player').stat_blueprint;
  blueprint.derived_offsets = Object.fromEntries(Object.keys(blueprint.derived_offsets).map(key => [key, 0])) as typeof blueprint.derived_offsets;
  blueprint.level = level; blueprint.allocated_primary = { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1, ...primary };
  return resolveStats(blueprint, content);
};

test('D-057 stages: chapters 1-3 have 10, 4-8 have 20; chapter bosses sit on the last stage', () => {
  const stages = storyStages(content), byChapter = (c: number) => stages.filter(s => s.chapter === c);
  assert.equal(stages.length, 130);
  for (const c of [1, 2, 3]) assert.equal(byChapter(c).length, 10);
  for (const c of [4, 5, 6, 7, 8]) assert.equal(byChapter(c).length, 20);
  assert.equal(storyBoss(storyStage('4-20', content)!).definition_id, 'golem');
  assert.equal(storyBoss(storyStage('4-10', content)!).definition_id, 'ork_warrior');
  assert.deepEqual(storyStageInfo('4-20'), { chapter: 4, index: 20, last: true, heavy_cast: false, heavy_skill: null });
  assert.deepEqual(storyStageInfo('4-10'), { chapter: 4, index: 10, last: false, heavy_cast: true, heavy_skill: 'enemy_doom' }, 'D-074 rotation names the heavy cast');
  assert.equal(storyStageInfo('4-10')!.last, false);
  assert.equal(storyStage('5-1', content)!.unlock_after, '4-20');
});

test('D-057 status points: 3 + floor(level/5) per level gained (Lv10 34, Lv20 91, Lv70 676)', () => {
  const rows = progressionData(content).progression.level_rows;
  assert.deepEqual([1, 10, 20, 70].map(level => rows[level - 1]!.total_status_points), [0, 34, 91, 676]);
});

test('D-057 primary milestone bonus applies every full 10 points and never changes ASPD or cast speed', () => {
  const base = stats({}), str9 = stats({ str: 9 }), str10 = stats({ str: 10 });
  assert.equal(str10.physical_attack - str9.physical_attack, 2 + 5);
  assert.equal(stats({ vit: 10 }).max_hp - stats({ vit: 9 }).max_hp, 20 + 50);
  assert.equal(stats({ int: 20 }).magical_attack - base.magical_attack, 19 * 3 + 2 * 8);
  assert.ok(Math.abs(stats({ agi: 30 }).evasion_bonus - .03) < 1e-12);
  assert.ok(Math.abs(stats({ dex: 10 }).hit_bonus - .01) < 1e-12);
  assert.ok(Math.abs(stats({ luk: 40 }).crit_chance_bonus - .04) < 1e-12);
  assert.equal(stats({ agi: 30 }).attack_speed, 100 + 29);
  assert.equal(stats({ dex: 10 }).cast_speed, 100 + 1.5 * 9);
});

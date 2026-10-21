// TASK-039 AC-01: the first-play guide derives the next useful step from the real save, never a scripted state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';

const fresh = () => initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);
const broke = (state: ReturnType<typeof fresh>) => { for (const key of Object.keys(state.wallet) as (keyof typeof state.wallet)[]) state.wallet[key] = 0; return state; };

test('T039 AC-01: a new save is pointed at the first boss, then claim/level/weapon/skill steps appear only when they are really possible', async () => {
  const { nextGuide } = await import('../../src/client/guide.ts');
  const state = fresh();
  assert.deepEqual(nextGuide(state), { id: 'first_boss', text: 'แตะ "ท้าบอส" เพื่อสู้บอสด่าน 1-1', view: 'stage' });
  state.story.cleared_stage_ids = ['1-1']; broke(state);
  assert.equal(nextGuide(state), null, 'no gold, no rewards, nothing new: no fake step');
  state.pending_rewards.push({ claim_id: 'story_1-1', kind: 'story', resource_vector: { ...state.wallet, gold: 250 }, items: [], content_version: 'x', reserved_at: '2026-10-20T00:00:00.000Z', source_keys: ['story:1-1'], status: 'pending' } as never);
  assert.equal(nextGuide(state)!.id, 'claim');
  state.pending_rewards = []; state.wallet.gold = 1000; state.wallet.hero_exp = 1000;
  const level = nextGuide(state)!; assert.match(level.id, /^level_/); assert.equal(level.view, 'buddy');
  const weapon = nextGuide(state, new Set([level.id]))!; assert.equal(weapon.id, `weapon_${weapon.character}`, 'unarmed member can buy the 125-gold training weapon');
  for (const actor of state.roster) actor.equipment.weapon = 'held';
  const main = state.roster.find(actor => actor.character_id === 'main')!; main.level = 5;
  const seen = new Set(state.team.map(p => `level_${p.character_id}`));
  assert.deepEqual(nextGuide(state, seen), { id: 'skill_main', text: 'มีสกิลใหม่ให้เรียนฟรี · ไปหน้า Skill', view: 'skills', character: 'main' }, 'Lightning Bolt unlocks at Lv.5 and learning Lv.1 is free');
});

test('T039 AC-01: mode and store tips follow the real unlocks and disappear once used or dismissed', async () => {
  const { nextGuide } = await import('../../src/client/guide.ts');
  const state = broke(fresh()); state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(stage => stage.id);
  for (const actor of state.roster) actor.equipment.weapon = 'held';
  assert.equal(nextGuide(state)!.id, 'daily_open');
  assert.equal(nextGuide(state, new Set(['daily_open']))!.id, 'tower_open');
  state.tower.highest_cleared_floor = 1;
  assert.equal(nextGuide(state, new Set(['daily_open'])), null, 'no crystal: no store tip');
  state.wallet.crystal = 100;
  assert.equal(nextGuide(state, new Set(['daily_open']))!.view, 'store');
  assert.equal(nextGuide(state, new Set(['daily_open', 'store_crystal'])), null);
});

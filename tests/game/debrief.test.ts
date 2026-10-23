// TASK-039 AC-02: the result debrief explains actual causes from shared metrics, never a power-score gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceUntil, createBattle } from '../../src/domain/combat/index.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { probe, resolved } from './class-skills.ts';

test('T039 AC-02: debrief reports who fell when, damage/heal/overheal, interrupts and SP skips with matching tips', async () => {
  const { battleDebrief } = await import('../../src/client/story.ts');
  const healer = probe('p_heal', 'player', 'back_1', [resolved('acolyte_heal', 10)], false, 'acolyte');
  const fighter = probe('p_hit', 'player', 'front_1', [resolved('wizard_meteor', 10)], true, 'wizard'); fighter.stat_blueprint.derived_offsets.max_sp = -320; // ~7 max SP: Meteor (54) cannot be paid even after regen; four-slot skips remain observable
  const boss = probe('e_boss', 'enemy', 'front_1', [], false); boss.stat_blueprint.derived_offsets.max_hp = 50000000; // never hits: every heal is overheal
  const mode = { kind: 'story' as const, ref: 'debrief', time_limit_ms: 20000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
  const end = unwrap(advanceUntil(unwrap(createBattle({ actors: [healer, fighter, boss], mode }, content, 3)), 20000, content)).state;
  const debrief = battleDebrief(end); if (process.env.DEBUG_DEBRIEF) console.log(JSON.stringify(debrief), end.actors.map(a => [a.actor_id, a.stats.max_sp]));
  assert.equal(debrief.kind, 'time_limit'); assert.ok(debrief.boss_hp_ratio > .9);
  const hit = debrief.members.find(m => m.actor_id === 'p_hit')!, heal = debrief.members.find(m => m.actor_id === 'p_heal')!;
  assert.equal(hit.damage, end.metrics.actors.p_hit!.hp_damage); assert.equal(heal.overheal, end.metrics.actors.p_heal!.overheal);
  assert.ok(hit.sp_skips >= 3 && debrief.tips.some(tip => tip.includes('SP ไม่พอ')), 'SP starvation explained');
  assert.ok(debrief.tips.some(tip => tip.includes('ดาเมจยังไม่พอ')), 'time limit with a healthy boss explained');
  assert.ok(heal.overheal > heal.healing * 2 && heal.overheal > 0 && debrief.tips.some(tip => tip.includes('ฮีลเกิน')), 'overheal explained');
  assert.ok(!('power' in debrief), 'no power-score field');
});

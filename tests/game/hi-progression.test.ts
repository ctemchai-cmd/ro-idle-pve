import{seedSupportingRoster}from'./roster-level-fixture.ts';
import test from 'node:test';
import { class2Content } from './class2-content-fixture.ts';
import assert from 'node:assert/strict';
import rawJson from '../../src/generated/content.json';
import { validateContent } from '../../src/content/loader.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applyRosterCommand, effectiveLevelCap, jobChangePlan, levelQuote, progressionData } from '../../src/domain/progression/characters.ts';
import { applySkillCommand, compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { equipmentFit } from '../../src/domain/build/equipment-definition.ts';
import { equipStarterSet } from './gear-fixtures.ts';
import { unwrap } from './combat-fixtures.ts';
import type { Command } from '../../src/contracts/index.ts';

function futureContent() {
  // This activates only an isolated fixture. Product release remains Class2/cap70.
  const raw = structuredClone(rawJson), data = raw.documents['progression.json'];
  data.promotion.hi_class_enabled = true; data.release.level_cap = 90; data.release.enabled_job_stages.push(3);
  return unwrap(validateContent(raw));
}
const future = futureContent(), data = progressionData(future), at = '2026-10-23T00:00:00.000Z';
type Character = ReturnType<typeof initializeAccount>['roster'][number];
const jobs = data.hi_class!.job_advancements;
function fixture(parent: Character['job_id'] = 'knight') {
  const root = future.jobs.byId[parent]!.root as Character['root_job_id'];
  const state = initializeAccount(future, { root_job_id: root, gender: 'male' }, at, '2026-10-23', 1), actor = state.roster[0]!;
  Object.assign(actor, { job_id: parent, level: 70, local_cap: 80, completed_gate_ids: [20, 40, 60], unspent_status_points: 676 });
  if (parent === 'dancer') actor.gender = 'female';
  equipStarterSet(state); Object.assign(state.wallet, { gold: 100_000_000, hero_exp: 100_000_000, skill_manual: 100_000, breakthrough_essence: 100_000 });
  let sequence = 0;
  const command = (type: Command['type'], params: unknown) => ({ type, params, request_id: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}`, expected_revision: sequence, schema_version: 1, content_hash: future.manifest.content_hash, content_version: future.manifest.content_version, rules_version: future.manifest.rules_version }) as Command;
  const jobSkill = Object.values(future.skills).find(s => s.class_id === parent && s.kind === 'active')!;
  applySkillCommand(state, command('skill.upgrade', { character_id: 'main', skill_id: jobSkill.id, target_level: 5 }) as never, future);
  applyRosterCommand(state, command('character.allocate_status', { character_id: 'main', allocation: { ...actor.primary_stats, str: 8 } }) as never, future);
  actor.active_slots[2] = String(jobSkill.id); actor.slot_progress.weapon.refine = 15;
  return { state, actor, command };
}

test('former Class2 release fixture remains closed and rejects over-cap states at the semantic boundary', () => {
  const content = class2Content();
  assert.equal(content.jobs.order.length, 19); assert.equal(data.hi_class!.job_advancements.length, 13);
  assert.equal(progressionData(content).progression.level_rows.at(-1)!.level, 70);
  assert.equal(progressionData(content).release.level_cap, 70);
  assert.equal(content.jobs.byId.champion, undefined);
  const f = fixture(); assert.throws(() => jobChangePlan(f.actor, 'lord_knight', progressionData(content)), /HI_CLASS_UNAVAILABLE/);
  f.actor.level = 71; f.actor.unspent_status_points += 17;
  assert.throws(() => new AccountCommandRules(content).validateAccount(f.state), /INVALID_CHARACTER_PROGRESSION|INVALID_ITEM/);
});

test('all13 same-branch Hi promotions retain paid stats/skills/slots/equipment/cards/ledger without automatic growth', () => {
  assert.equal(future.jobs.order.length, 32);
  for (const row of jobs) {
    const f = fixture(row.parent_job_id as Character['job_id']), before = structuredClone(f.state);
    const code = applyRosterCommand(f.state, f.command('character.change_job', { character_id: 'main', job_id: row.job_id }) as never, future);
    assert.equal(code, 'HI_CLASS_PROMOTED', row.job_id);
    assert.equal(f.actor.job_id, row.job_id); assert.equal(f.actor.level, 70);
    const expected = structuredClone(before); expected.roster[0]!.job_id = row.job_id as Character['job_id'];
    assert.deepEqual(f.state, expected, row.job_id);
    const weapon = f.state.inventory.find(i => i.instance_id === f.actor.equipment.weapon)!;
    assert.equal(equipmentFit(f.actor, 'weapon', weapon, future), null, row.job_id);
    assert.deepEqual(compileCharacterSkills(f.actor, future).active_slots, before.roster[0]!.active_slots);
    new AccountCommandRules(future).validateAccount(f.state);
  }
});

test('Hi fixture advances70→80→gate80→90 with exact manual budget, no gate70 and no stat auto-growth', () => {
  const f = fixture();seedSupportingRoster(f.state,future);const original = structuredClone(f.actor.primary_stats), before = structuredClone(f.state.wallet);
  applyRosterCommand(f.state, f.command('character.change_job', { character_id: 'main', job_id: 'lord_knight' }) as never, future);
  const quote = levelQuote(f.actor, 80, data);
  applyRosterCommand(f.state, f.command('character.level_up', { character_id: 'main', target_level: 80 }) as never, future);
  assert.equal(f.state.wallet.gold, before.gold - quote.gold!); assert.equal(f.state.wallet.hero_exp, before.hero_exp - quote.hero_exp!);
  assert.deepEqual(f.actor.primary_stats, original); assert.equal(f.actor.local_cap, 80);
  assert.throws(() => levelQuote(f.actor, 81, data), /LEVEL_CAP_REACHED/);
  applyRosterCommand(f.state, f.command('character.breakthrough', { character_id: 'main', gate_level: 80 }) as never, future);
  assert.deepEqual(f.actor.completed_gate_ids, [20, 40, 60, 80]); assert.equal(f.actor.local_cap, 100);
  applyRosterCommand(f.state, f.command('character.level_up', { character_id: 'main', target_level: 90 }) as never, future);
  assert.equal(f.actor.level, 90); assert.equal(effectiveLevelCap(f.actor, data), 90);
  assert.equal(f.actor.unspent_status_points, 1050 - 7); assert.deepEqual(f.actor.primary_stats, original);
  assert.equal(before.hero_exp - f.state.wallet.hero_exp, 714850); assert.equal(before.gold - f.state.wallet.gold, 285940 + 400000);
  assert.equal(before.breakthrough_essence - f.state.wallet.breakthrough_essence, 1600);
  assert.throws(() => levelQuote(f.actor, 91, data), /LEVEL_CAP_REACHED/);
  assert.throws(() => jobChangePlan(f.actor, 'knight', data), /PROMOTION_DOWNGRADE_BLOCKED/);
  new AccountCommandRules(future).validateAccount(f.state);
});

test('promotion guards cover level/parent/NPC root/battle, and Class2 still caps70 with Hi enabled', () => {
  const f = fixture(), before = structuredClone(f.state);
  assert.equal(effectiveLevelCap(f.actor, data), 70); assert.throws(() => levelQuote(f.actor, 71, data), /LEVEL_CAP_REACHED/);
  f.actor.level = 69; assert.throws(() => jobChangePlan(f.actor, 'lord_knight', data), /CLASS_LEVEL_REQUIRED/); f.actor.level = 70;
  assert.throws(() => jobChangePlan(f.actor, 'paladin', data), /PROMOTION_PARENT_REQUIRED/);
  const npc = { ...f.actor, kind: 'npc' as const, character_id: 'npc_swordsman' };
  assert.throws(() => jobChangePlan(npc, 'champion', data), /NPC_ROOT_IMMUTABLE/);
  f.state.active_battle = {} as NonNullable<typeof f.state.active_battle>;
  assert.throws(() => applyRosterCommand(f.state, f.command('character.change_job', { character_id: 'main', job_id: 'lord_knight' }) as never, future), /BUILD_LOCKED_DURING_BATTLE/);
  f.state.active_battle = null; assert.deepEqual(f.state, before);
});

test('account command uses the same Hi reducer/validator and preserves live build; sibling change resets and refunds real costs', () => {
  const f = fixture(), rules = new AccountCommandRules(future), cmd = f.command('character.change_job', { character_id: 'main', job_id: 'lord_knight' });
  rules.parse(cmd);
  const time: CommandTime = { server_at: at, now_ms: 0, new_lease_at: at, last_ack_ms: 0, lease_expires_ms: 0, started_ms: 0, farm_from_ms: 0, stored_last_ack_ms: 0, stored_lease_ms: 0 };
  const result = rules.decide(cmd, f.state, null, time, 'a'.repeat(64));
  assert.equal(result.receipt.outcome, 'committed'); assert.equal(result.receipt.result.code, 'HI_CLASS_PROMOTED');
  rules.validateAccount(result.state);
  const paid = result.state.paid_ledger.filter(e => e.feature_id === 'skill').reduce((n, e) => n + e.paid_resources.skill_manual, 0), wallet = structuredClone(result.state.wallet);
  applyRosterCommand(result.state, f.command('character.change_job', { character_id: 'main', job_id: 'paladin' }) as never, future);
  assert.equal(result.state.wallet.skill_manual, wallet.skill_manual + paid);
  assert.deepEqual(result.state.roster[0]!.primary_stats, data.status_allocation.base);
  assert.equal(Object.keys(result.state.roster[0]!.skill_levels).some(id => id.startsWith('knight_')), false);
});

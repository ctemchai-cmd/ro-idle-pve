import {towerBoss,towerRow} from './historical-tower-fixture.ts';
// TASK-035: Infinity Tower on the shared engine/save protocol.
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { createBattle } from '../../src/domain/combat/index.ts';
import { storyParty, storyInput } from '../../src/domain/build/story.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import {towerData,towerStageRef} from '../../src/domain/modes/tower.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { buildAccount, treeData } from './class-skills.ts';

const rules = new AccountCommandRules();
/** Real command path with a movable server clock (Bangkok day boundaries matter for AC-03). */
function fixture(state: AccountState, startIso = '2026-10-20T12:00:00.000Z') {
  let save = state, stored: StoredBattle | null = null, revision = 1, serial = 0, now = Date.parse(startIso);
  const hashes = Object.fromEntries(save.roster.map(actor => [actor.character_id, 'a'.repeat(64)]));
  function run(type: Command['type'], params: unknown, advanceMs = 1000, seed = 7) {
    now += advanceMs; const pointer = save.active_battle;
    const input = { type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
    const time: CommandTime = { account_id: '11111111-1111-4111-8111-111111111111', battle_id: `33333333-3333-4333-8333-${String(serial).padStart(12, '0')}`, battle_seed: seed, build_hashes: hashes, server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(),
      last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(save.farm.reserved_through),
      stored_last_ack_ms: stored ? Date.parse(stored.last_ack_at) : 0, stored_lease_ms: stored ? Date.parse(stored.lease_expires_at) : 0 };
    const result = rules.decide(input, save, stored, time, 'b'.repeat(64));
    if (result.receipt.outcome === 'committed') { save = result.state; revision++; if (result.battle_write.kind === 'upsert') stored = result.battle_write.battle; if (result.battle_write.kind === 'delete') stored = null; }
    return result.receipt;
  }
  function finish() { for (let i = 0; i < 120 && save.active_battle; i++) { const receipt = run('battle.advance', { battle_id: save.active_battle.battle_id, requested_game_ms: 90000 }); if (receipt.result.code !== 'BATTLE_ADVANCED') return receipt; } throw new Error('BATTLE_DID_NOT_END'); }
  return { run, finish, get state() { return save; }, get stored() { return stored; } };
}
const strong = () => { const tree = treeData('swordsman'); const state = buildAccount('swordsman', [tree.builds.find(b => b.id === 'knight_striker')!, tree.builds.find(b => b.id === 'crusader_guardian')!]); state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(s => s.id); return state; };

test('T035 AC-01: floors 1/100/101/1000 come from one generator (HP 710/2090600/…/2008100600), load valid refs and start a real battle', () => {
  const data = towerData(content);
  for (const row of data.floor_rows) assert.deepEqual(towerRow(row.floor, content), row, `authored floor ${row.floor} = generator`);
  assert.deepEqual([1, 100, 1000].map(floor => towerRow(floor, content).hp), [710, 2090600, 2008100600]);
  assert.equal(towerRow(101, content).hp, 600 + 100 * 101 + 8 * 101 * 101 + 2 * 101 ** 3);
  const state = strong(), skills = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, content)])), party = storyParty(state, content, skills, Object.fromEntries(state.roster.map(a => [a.character_id, 'x'])));
  for (const floor of [1, 20, 100, 101, 1000]) {
    const boss = towerBoss(floor, content), battle = unwrap(createBattle(storyInput(towerStageRef(floor, content), boss, party, content, { kind: 'tower' }), content, 1));
    const enemy = battle.actors.find(actor => actor.team === 'enemy')!;
    assert.equal(battle.mode.kind, 'tower'); assert.equal(enemy.stats.max_hp, towerRow(floor, content).hp); assert.equal(enemy.stats.physical_defense, towerRow(floor, content).defense);
    assert.ok(boss.active_slots.every(id => id === null || content.skills[id]), `skills of ${floor}`); assert.equal(boss.passives.length, floor % 20 === 0 ? 1 : 0);
  }
});

test('D-114: D142 floor21 is24750HP/300ATK, following floors grow faster, with original defense/speed (rewards updated separately by D187)', () => {
  const expected = [[1,710,14],[10,4400,88],[20,21800,275],[21,24750,300],[22,27968,326],[30,64800,572],[50,275600,1496],[100,2090600,5731]];
  for(const [floor,hp,attack]of expected){
    const row=towerRow(floor!,content),boss=towerBoss(floor!,content);
    assert.equal(row.hp,hp);assert.equal(row.attack,attack);assert.equal(row.defense,5+3*floor!);

    assert.equal(boss.resolved_base.attack_speed,100);assert.equal(boss.resolved_base.cast_speed,100);
  }
  assert.equal(towerRow(22,content).attack-towerRow(21,content).attack,26);
  assert.equal(towerRow(101,content).hp,2152910);assert.equal(towerRow(101,content).attack,5844);
});

test('T035 AC-02: the frontier floor pays its first clear once; replays, losses and locked floors pay nothing', () => {
  const f = fixture(strong());
  assert.equal(f.run('battle.start_tower', { floor: 2 }).result.code, 'TOWER_FLOOR_LOCKED');
  assert.equal(f.run('battle.start_tower', { floor: 1 }).result.code, 'TOWER_STARTED');
  assert.equal(f.finish().result.code, 'TOWER_WON'); assert.equal(f.state.tower.highest_cleared_floor, 1);
  const claim = f.state.pending_rewards.find(c => c.claim_id === 'tower_1')!; assert.equal(claim.resource_vector.gold, 1750); assert.equal(claim.resource_vector.crystal, 0);
  assert.equal(f.run('reward.claim', { claim_id: 'tower_1' }).result.code, 'REWARD_CLAIMED');
  const wallet = structuredClone(f.state.wallet);
  f.run('battle.start_tower', { floor: 1 }); assert.equal(f.finish().result.code, 'TOWER_WON');
  assert.equal(f.state.tower.highest_cleared_floor, 1); assert.ok(!f.state.pending_rewards.some(c => c.kind === 'tower'), 'replay pays nothing'); assert.deepEqual(f.state.wallet, wallet);
  for (let floor = 2; floor <= 10; floor++) { assert.equal(f.run('battle.start_tower', { floor }).result.code, 'TOWER_STARTED'); assert.equal(f.finish().result.code, 'TOWER_WON', `floor ${floor}`); }
  const ten = f.state.pending_rewards.find(c => c.claim_id === 'tower_10')!; assert.equal(ten.resource_vector.crystal, 100); assert.equal(ten.items.length, 1); assert.equal(ten.items[0]!.kind, 'card');
  // A frontier far beyond the team: defeat or time-out leaves the frontier and wallet untouched.
  const weak = fixture((() => { const s = buildAccount('swordsman', []); s.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(x => x.id); s.tower.highest_cleared_floor = 199; return s; })());
  const before = structuredClone(weak.state.wallet);
  assert.equal(weak.run('battle.start_tower', { floor: 200 }).result.code, 'TOWER_STARTED');
  assert.match(weak.finish().result.code, /^TOWER_(DEFEATED|TIME_LIMIT)$/); assert.equal(weak.state.tower.highest_cleared_floor, 199); assert.deepEqual(weak.state.wallet, before); assert.equal(weak.state.pending_rewards.filter(c => c.kind === 'tower').length, 0);
});

test('T035 AC-03: the Tower never resets across the Bangkok day and survives a reload; the team stays as saved', () => {
  const f = fixture(strong(), '2026-10-20T16:58:00.000Z'); // 23:58 Bangkok
  f.run('battle.start_tower', { floor: 1 }); f.finish();
  const reloaded = rules.validateAccount(structuredClone(f.state)), team = structuredClone(f.state.team);
  assert.equal(reloaded.tower.highest_cleared_floor, 1);
  f.run('reward.claim', { claim_id: 'tower_1' }, 5 * 60 * 1000); // next Bangkok day
  assert.equal(f.state.tower.highest_cleared_floor, 1); assert.deepEqual(f.state.team, team);
  assert.equal(f.run('battle.start_tower', { floor: 2 }).result.code, 'TOWER_STARTED');
});

test('T035 AC-04: generated floors stay finite and safe until the generator itself refuses with TOWER_FLOOR_OVERFLOW', () => {
  for (const floor of [500, 5000, 50000, 100000, 150000]) {
    const row = towerRow(floor, content), boss = towerBoss(floor, content);
    assert.ok(Object.values(row).every(value => typeof value === 'string' || (typeof value === 'object' ? Object.values(value!).every(Number.isSafeInteger) : Number.isSafeInteger(value))), `floor ${floor}`);
    assert.ok(boss.active_slots.every(id => id === null || content.skills[id]) && content.documents['enemies.json'] && boss.resolved_base.attack_speed === 100, 'no hidden speed scaling');
  }
  assert.throws(() => towerRow(200_000, content), /TOWER_FLOOR_OVERFLOW/);
  assert.throws(() => towerRow(0, content), /INVALID_TOWER_FLOOR/);
});

test('T035 AC-01: the client battle session builds a Tower scene (floor title, template boss look) from the server checkpoint', async () => {
  const { SavedBattleSession } = await import('../../src/client/story.ts');
  const f = fixture(strong()); f.run('battle.start_tower', { floor: 1 });
  const session = new SavedBattleSession(f.stored!.payload, f.state);
  assert.equal(session.scene.title, 'หอคอย ชั้น 1'); assert.ok(session.scene.actors.some(actor => actor.actor_id === 'enemy_front' && actor.body_meta?.includes('poring')));
  assert.equal(session.initial.mode.kind, 'tower');
});

test('D-071: battle.advance speed 4 credits four times the wall interval through the real command path; the schema refuses speed 3', () => {
  const game = (speed?: number) => {
    const f = fixture(strong()); assert.equal(f.run('battle.start_tower', { floor: 1 }).result.code, 'TOWER_STARTED');
    const id = f.state.active_battle!.battle_id, params = { battle_id: id, requested_game_ms: 90000, ...(speed ? { speed } : {}) };
    assert.equal(f.run('battle.advance', params, 250).result.code, 'BATTLE_ADVANCED');
    return { f, id, ms: (f.stored!.payload as { game_time_ms: number }).game_time_ms };
  };
  const normal = game(), fast = game(4);
  assert.equal(normal.ms, 250); assert.equal(fast.ms, 1000);
  assert.throws(() => fast.f.run('battle.advance', { battle_id: fast.id, requested_game_ms: 90000, speed: 3 }), 'speed 3 is not in the command schema');
});

test('T053 AC-02: a Tower card chest gives a card of the player\'s tier (chapter 2 cleared → tier 20; chapter 4 → tier 40)', async () => {
  const { gachaCardTier } = await import('../../src/domain/rewards/gacha.ts');
  for (const [chapters, tier] of [[2, 20], [4, 40]] as const) {
    const state = strong(); state.story.cleared_stage_ids = storyStages(content).filter(s => s.chapter <= chapters).map(s => s.id); state.tower.highest_cleared_floor = 9;
    const f = fixture(state); assert.equal(gachaCardTier(f.state, content), tier);
    assert.equal(f.run('battle.start_tower', { floor: 10 }).result.code, 'TOWER_STARTED'); assert.equal(f.finish().result.code, 'TOWER_WON');
    const card = f.state.pending_rewards.find(c => c.claim_id === 'tower_10')!.items[0]!;
    assert.equal(card.kind, 'card'); assert.equal((content.items[card.definition_id] as unknown as { tier_level: number }).tier_level, tier, `chapter ${chapters}`);
  }
});

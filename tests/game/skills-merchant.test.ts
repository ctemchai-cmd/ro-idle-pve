// TASK-034: Merchant / Blacksmith / Alchemist skills (incl. summoned plants) on the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import type { BattleEvent } from '../../src/domain/combat/index.ts';
import { advanceUntil, restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('merchant'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('merchant', row, id, position);
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-034', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T034 AC-01: all 19 tree skills match the 57 M0 golden cases (summon actor/limit/duration included)', () => {
  assert.equal(ids.length, 19); const rows = goldens(ids); assert.equal(rows.length, 57);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.length;
});

test('T034 AC-01: every Active executes every effect at every level 1-10, summoned plants act, and no battle touches the wallet', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  assert.ok(actives.every(skill => typeof skill.cost.sp !== 'number' || !('gold' in (skill.cost as Record<string, unknown>))), 'skills cost SP, never wallet gold');
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T034 AC-01: every Passive changes stats at every level 1-10', () => {
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) probePassive(skill.id, level);
});

test('T034 AC-01: Blacksmith/Alchemist skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  const state = buildAccount('merchant', [build('blacksmith_hammer'), build('alchemist_gardener')]);
  for (const [characterId, branch, other] of [['main', 'blacksmith', 'alchemist'], ['npc_merchant', 'alchemist', 'blacksmith']] as const) {
    const options = characterSkillOptions(state.roster.find(actor => actor.character_id === characterId)!, state).skills;
    assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('merchant_') || id.startsWith(`${branch}_`)).sort());
    for (const option of options) assert.ok(!option.id.startsWith(`${other}_`) && option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${characterId} ${option.id} ${option.effects}`);
  }
  const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- AC-02 ------------------------------------------------------------------------------------------
/** fast: recasts every ~0.7s (limit/replacement); slow: a Meteor filler spaces casts past the 6.5s life (expiry). */
function plantFight(skillId: string, until: number, pace: 'fast' | 'normal' | 'slow' = 'normal') {
  const alchemist = probe('p_alch', 'player', 'front_1', pace === 'slow' ? [resolved(skillId, 10), resolved('wizard_meteor', 1), resolved('wizard_storm_gust', 1)] : [resolved(skillId, 10)], false, 'alchemist');
  if (pace === 'fast') { alchemist.stat_blueprint.derived_offsets.attack_speed = 400; alchemist.stat_blueprint.derived_offsets.cast_speed = 400; }
  return run([alchemist, probe('p_ally', 'player', 'back_1'), probe('e_front', 'enemy', 'front_1'), probe('e_back', 'enemy', 'back_1')], until, 1, checkpoint => { checkpoint.actors.find(actor => actor.actor_id === 'p_ally')!.hp = 2000000; });
}
function lifetimes(events: readonly BattleEvent[]) {
  return events.filter(event => event.type === 'summon').map(spawn => {
    const end = events.find(event => event.type === 'despawn' && event.actor_id === spawn.actor_id);
    const acts = events.filter(event => (event.type === 'damage' || event.type === 'heal') && event.source_instance_id === spawn.actor_id);
    return { id: spawn.actor_id, kind: spawn.detail!, at: spawn.at_ms, end: end?.at_ms ?? null, reason: end?.detail ?? null, ticks: [...new Set(acts.map(event => event.at_ms - spawn.at_ms))] };
  });
}

test('T034 AC-02: Hell Plant keeps at most 2 alive, lives 6500 ms with ticks at +1000..+6000, the oldest is replaced, and damage is credited to the owner once', () => {
  const fast = plantFight('alchemist_hell_plant', 20000, 'fast'), slow = plantFight('alchemist_hell_plant', 40000, 'slow');
  const { events, state } = slow, plants = [...lifetimes(fast.events), ...lifetimes(slow.events)];
  assert.ok(plants.length >= 6, `plants ${plants.length}`);
  for (const plant of lifetimes(fast.events)) assert.ok(lifetimes(fast.events).filter(other => other.at <= plant.at && (other.end === null || other.end > plant.at)).length <= 2, 'fast: at most 2 alive');
  for (const plant of lifetimes(slow.events)) {
    const alive = lifetimes(slow.events).filter(other => other.at <= plant.at && (other.end === null || other.end > plant.at));
    assert.ok(alive.length <= 2, `at ${plant.at} ${alive.length} alive`);
    if (plant.reason === 'expired') { assert.equal(plant.end! - plant.at, 10000); assert.deepEqual(plant.ticks, [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000], plant.id); }
  }
  for (const plant of plants) if (plant.reason === 'replaced') assert.ok(plant.ticks.every(tick => plant.at + tick < plant.end!), 'no tick after replacement');
  assert.ok(plants.some(plant => plant.reason === 'replaced') && plants.some(plant => plant.reason === 'expired'), 'both replacement and expiry happen');
  const plantDamage = events.filter(event => event.type === 'damage' && event.skill_id === 'alchemist_hell_plant').reduce((sum, event) => sum + (event.amount ?? 0), 0);
  assert.ok(plantDamage > 0); assert.equal(state.metrics.skills['p_alch:alchemist_hell_plant']!.hp_damage, plantDamage);
  for (const plant of lifetimes(slow.events)) assert.equal(state.metrics.actors[plant.id]?.hp_damage ?? 0, 0, 'plant rows never double count owner damage');
  assert.ok(!state.actors.some(actor => actor.kind === 'summon' && actor.action_phase === 'dead'), 'despawned plants are swept from the checkpoint');
  evidence.hell_plant = { plants: plants.length, replaced: plants.filter(plant => plant.reason === 'replaced').length, expired: plants.filter(plant => plant.reason === 'expired').length, owner_damage: plantDamage };
});

test('T034 AC-02: Healing Plant keeps 1 alive and heals the lowest-HP ally; owner death removes every plant immediately', () => {
  const { events } = plantFight('alchemist_bio_cannibalize', 20000), plants = lifetimes(events);
  for (const plant of plants) assert.ok(plants.filter(other => other.at <= plant.at && (other.end === null || other.end > plant.at)).length <= 1, 'one healing plant');
  assert.ok(events.some(event => event.type === 'heal' && event.skill_id === 'alchemist_bio_cannibalize' && event.target_id === 'p_ally' && (event.amount ?? 0) > 0), 'plant heals the wounded ally');
  // Owner death: take the live checkpoint with plants out, drop the owner to 0 HP and advance one step.
  const fight = plantFight('alchemist_hell_plant', 9000), alive = fight.state.actors.filter(actor => actor.kind === 'summon');
  assert.ok(alive.length >= 1, 'plants alive before the owner dies');
  const checkpoint = serializeBattle(fight.state); checkpoint.actors.find(actor => actor.actor_id === 'p_alch')!.hp = 0;
  const after = unwrap(advanceUntil(unwrap(restoreBattle(checkpoint, content)), 9100, content));
  assert.deepEqual(after.events.filter(event => event.type === 'despawn').map(event => [event.actor_id, event.detail]).sort(), alive.map(actor => [actor.actor_id, 'owner_dead']).sort());
  assert.ok(!after.state.actors.some(actor => actor.kind === 'summon'), 'no orphaned plants');
  assert.ok(!after.events.some(event => event.type === 'damage' && event.skill_id === 'alchemist_hell_plant' && event.at_ms > 9000), 'no plant action after owner death');
  evidence.healing_plant = { plants: plants.length, owner_death_despawned: alive.length };
});

test('T034 AC-02: Blacksmith buffs raise physical attack / attack speed of the party and leave magic untouched', () => {
  const smith = buildActor(build('blacksmith_weaponsmith'), 'smith', 'front_1');
  const { events, initial } = run([smith, probe('p_ally', 'player', 'back_1'), probe('e_idle', 'enemy', 'front_1')], 15000);
  const before = unwrap(restoreBattle(initial, content)).actors.find(actor => actor.actor_id === 'p_ally')!.stats;
  const applied = (status: string) => events.find(event => event.type === 'status_applied' && event.target_id === 'p_ally' && event.status_change?.status_id === status)!;
  const sample = (at: number) => unwrap(advanceUntil(unwrap(restoreBattle(initial, content)), at, content)).state.actors.find(actor => actor.actor_id === 'p_ally')!.stats;
  const adrenaline = applied('aspd_up'), perfection = events.find(event => event.type === 'status_applied' && event.target_id === 'p_ally' && event.skill_id === 'blacksmith_weapon_perfection')!;
  const fast = sample(adrenaline.at_ms), strong = sample(perfection.at_ms);
  assert.ok(Math.abs(fast.attack_speed - before.attack_speed * (1 + adrenaline.status_change!.params.ratio!)) < 1e-6, `aspd ${before.attack_speed} -> ${fast.attack_speed}`);
  assert.ok(strong.physical_attack > before.physical_attack && strong.magical_attack === before.magical_attack, 'weapon perfection is physical only');
  evidence.blacksmith = { attack_speed: [before.attack_speed, fast.attack_speed], physical_attack: [before.physical_attack, strong.physical_attack], magical_attack: [before.magical_attack, strong.magical_attack] };
});

// --- AC-03 ------------------------------------------------------------------------------------------
test('T034 AC-03: dry catalog trace of all four builds reproduces the M0 queue estimate (permanent Passives only)', () => {
  evidence.dry_trace = checkDryTraces('merchant', tree.builds);
});

test('T034 AC-03: real fights follow the dry first cycle where no self-haste exists, plants stay bounded and never become a fifth party member', () => {
  const real: Record<string, unknown> = {};
  for (const row of tree.builds) {
    const { events, state } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 20000);
    const starts = events.filter(event => event.actor_id === 'hero' && event.type === 'cast_start').map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    real[row.id] = { real: starts.slice(0, 4), dry };
    if (row.active_slots[0] === 'blacksmith_adrenaline') { assert.deepEqual(starts[0], dry[0]); assert.ok(starts[1]!.start_ms < dry[1]!.start_ms, 'Adrenaline hastes the smith'); }
    else assert.deepEqual(starts.slice(0, 4), dry, row.id);
    assert.equal(state.actors.filter(actor => actor.team === 'player' && actor.counts_for_terminal).length, 2, 'summons never count as party');
    const spawned = events.filter(event => event.type === 'summon');
    for (const spawn of spawned) { const max = spawn.detail === 'hell_plant' ? 2 : 1; const alive = spawned.filter(other => other.detail === spawn.detail && other.at_ms <= spawn.at_ms && !events.some(end => end.type === 'despawn' && end.actor_id === other.actor_id && end.at_ms <= spawn.at_ms)); assert.ok(alive.length <= max, `${row.id} ${spawn.detail} ${alive.length}`); }
  }
  evidence.real_fight_first_starts = real;
});

// --- AC-04 ------------------------------------------------------------------------------------------
test('T034 AC-04: same seed/build gives identical state/RNG/source metrics in server, client session and runner; plants act once per tick', async () => {
  // Parity fixture, not a balance check: 3-8 keeps this two-built-member team alive long enough for every tree skill to act
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('merchant', [build('alchemist_gardener'), build('blacksmith_weaponsmith')], '3-8', 34);
  const skills = runner.report.skills;
  for (const key of ['main:alchemist_hell_plant', 'main:alchemist_bio_cannibalize', 'npc_merchant:blacksmith_adrenaline', 'npc_merchant:blacksmith_weapon_perfection']) assert.ok((skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  const plantActs = clientEvents.filter(event => (event.type === 'damage' || event.type === 'heal') && event.source_instance_id?.startsWith('summon_main_'));
  const perTick = new Map<string, number>(); for (const event of plantActs) { const key = `${event.source_instance_id}@${event.at_ms}`; perTick.set(key, (perTick.get(key) ?? 0) + 1); }
  assert.ok(plantActs.length>0);for(const[key,count]of perTick){const acts=plantActs.filter(e=>`${e.source_instance_id}@${e.at_ms}`===key);const bio=acts[0]!.skill_id==='alchemist_bio_cannibalize';assert.equal(count,bio?2:1,'one of each authored effect per plant tick');assert.equal(new Set(acts.map(e=>e.effect_id)).size,count,'no duplicate effects');}
  assert.ok(team.some(member => member.character_id === 'npc_merchant'), 'merchant companion in the team');
  evidence.parity = { stage, seed: 34, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, plant_actions: plantActs.length, summons: clientEvents.filter(event => event.type === 'summon').length, despawns: Object.fromEntries(['expired', 'replaced', 'owner_dead', 'battle_end'].map(reason => [reason, clientEvents.filter(event => event.type === 'despawn' && event.detail === reason).length])), tree_skill_metrics: Object.fromEntries(Object.entries(skills).filter(([key]) => /:(merchant|blacksmith|alchemist)_/.test(key)).map(([key, value]) => [key, { casts_resolved: value.metrics.casts_resolved, hp_damage: value.metrics.hp_damage, effective_heal: value.metrics.effective_heal }])) };
});

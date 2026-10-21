// TASK-041 journey simulation (user request 20 Oct 2026): an automated player that farms, spends every
// resource through the REAL command reducers (levels, breakthroughs, job change, status, skills, loadout,
// gear equip/refine/tier-up/fuse/salvage, gacha, shop) and challenges the next Story stage. Team, branch
// builds and skill order are chosen by real test fights, not by a power score. Writes a pace report.
//   node --import tsx scripts/game/journey.ts [--main mage] [--days 30] [--step-min 10] [--seed 1] [--out plan/evidence/balance/journey-mage.json]
//   --schedule <snapshots.json.gz>: no fights; stage s is credited at its D-065 pace time and the account is
//   snapshotted just before, giving "the player the economy produces at that point" for stage calibration.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadValidatedContent } from '../../src/content/index.ts';
import type { AccountState, Command, PrimaryStats, Receipt } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { characterSkillCap, skillQuote } from '../../src/domain/progression/skills.ts';
import { levelQuote, progressionData, allocationQuote } from '../../src/domain/progression/characters.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { bangkokDay, dailyUnlocked } from '../../src/domain/modes/daily.ts';
import { towerCanChallenge, towerUnlocked } from '../../src/domain/modes/tower.ts';
import { towerFight } from '../../src/simulation/modes-sim.ts';
import { itemDefinition } from '../../src/domain/build/equipment-definition.ts';
import { bestInterruptLoadout, storyFight, type BuildProfile } from '../../src/simulation/balance.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors)); const content = loaded.value;
const options = process.argv.slice(2), option = (name: string, fallback: string) => { const i = options.indexOf(name); return i < 0 ? fallback : options[i + 1]!; };
const SCHEDULE = option('--schedule', ''), TRIO = option('--trio', ''); // --trio swordsman,acolyte,archer fixes companions and branch builds (calibration)
const MAIN = option('--main', 'mage') as Root, DAYS = Number(option('--days', '30')), STEP = Number(option('--step-min', '10')) * 60000, SEED = Number(option('--seed', '1')), OUT = option('--out', `plan/evidence/balance/journey-${MAIN}.json`);
type Root = AccountState['roster'][number]['root_job_id']; type Character = AccountState['roster'][number]; type Wallet = AccountState['wallet']; type Item = AccountState['inventory'][number];
const ROOTS: Root[] = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'], SLOTS = ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'] as const;
const FRONT: Record<Root, number> = { swordsman: 3, merchant: 2, thief: 2, archer: 1, acolyte: 0, mage: -1 } as never;
const data = progressionData(content), rules = new AccountCommandRules(), stages = storyStages(content);
/**
 * D-065: the economy (TASK-010 rates/costs) sets the pace. In --schedule mode a stage is credited when the team's
 * mean level reaches its recommended level (breakthroughs included, since levels above a gate need it), so the
 * snapshot is "the player the economy produces when this stage is meant to be played".
 */
const recommended = (stageId: string) => (stages.find(s => s.id === stageId) as unknown as { recommended_party_level: number }).recommended_party_level;
const equipment = content.documents['equipment.json']! as unknown as { weapon_compatibility: Record<string, string>; rarities: { id: string; rank: number }[]; tier_upgrade: { rows: { from: number; to: number; gold: number; refine_ore: number }[] } };
const rank = (id: string) => equipment.rarities.find(r => r.id === id)?.rank ?? 0;
const builds = new Map<string, BuildProfile & { role?: string }>(), byRoot = new Map<Root, string[]>();
for (const root of ROOTS) { const list = (JSON.parse(await readFile(`plan/data/skills/${root}.json`, 'utf8')) as { builds: (BuildProfile & { role: string })[] }).builds; byRoot.set(root, list.map(b => b.id)); for (const b of list) builds.set(b.id, b); }
let rng = SEED >>> 0; const random = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; };

/** Real reducers with a movable server clock and a stored battle row, like the API (no network/DB). */
class Server {
  save: AccountState; stored: StoredBattle | null = null; revision = 1; serial = 0; now: number; commands = 0; rejected: Record<string, number> = {};
  constructor(state: AccountState, now: number) { this.save = state; this.now = now; }
  run(type: Command['type'], params: unknown, advanceMs = 1): Receipt {
    this.now += advanceMs; const pointer = this.save.active_battle, serial = ++this.serial;
    const input = { type, params, request_id: `22222222-2222-4222-8222-${String(serial).padStart(12, '0')}`, expected_revision: this.revision, schema_version: 1, ...rules.versions } as Command;
    const time: CommandTime = { account_id: '11111111-1111-4111-8111-111111111111', battle_id: `33333333-3333-4333-8333-${String(serial).padStart(12, '0')}`, battle_seed: Math.floor(random() * 4294967295), build_hashes: Object.fromEntries(this.save.roster.map(a => [a.character_id, 'a'.repeat(64)])),
      server_at: new Date(this.now).toISOString(), now_ms: this.now, new_lease_at: new Date(this.now + 15000).toISOString(), last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0,
      started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(this.save.farm.reserved_through), stored_last_ack_ms: this.stored ? Date.parse(this.stored.last_ack_at) : 0, stored_lease_ms: this.stored ? Date.parse(this.stored.lease_expires_at) : 0 };
    const result = rules.decide(input, this.save, this.stored, time, 'b'.repeat(64)); this.commands++;
    if (result.receipt.outcome === 'committed') { this.save = result.state; this.revision++; if (result.battle_write.kind === 'upsert') this.stored = result.battle_write.battle; if (result.battle_write.kind === 'delete') this.stored = null; }
    else this.rejected[`${type}:${result.receipt.result.code}`] = (this.rejected[`${type}:${result.receipt.result.code}`] ?? 0) + 1;
    return result.receipt;
  }
  ok(type: Command['type'], params: unknown) { return this.run(type, params).outcome === 'committed'; }
  fight(stageId: string): string {
    let receipt = this.run('battle.start_story', { stage_id: stageId }); if (receipt.outcome !== 'committed') return receipt.result.code;
    for (let i = 0; i < 40 && this.save.active_battle; i++) { receipt = this.run('battle.advance', { battle_id: this.save.active_battle.battle_id, requested_game_ms: 40000 }, 5000); if (receipt.result.code !== 'BATTLE_ADVANCED') return receipt.result.code; }
    return receipt.result.code;
  }
}

// ---- player policy ------------------------------------------------------------------------------------
const plan = new Map<string, string>(); // character_id -> intended build id (decides status profile and branch)
const canPay = (wallet: Wallet, cost: Partial<Wallet>) => Object.entries(cost).every(([k, n]) => wallet[k as keyof Wallet] >= (n ?? 0));
const member = (s: AccountState, id: string) => s.roster.find(a => a.character_id === id)!;
const team = (s: AccountState) => s.team.map(p => member(s, p.character_id));
function positions(ids: string[], s: AccountState): AccountState['team'] {
  const sorted = [...ids].sort((a, b) => (FRONT[member(s, b).root_job_id] ?? 0) - (FRONT[member(s, a).root_job_id] ?? 0));
  return sorted.map((id, i) => ({ character_id: id, position: (['front_1', 'front_2', 'back_1', 'back_2'] as const)[i]! })) as AccountState['team'];
}
/** Status: spend unspent points toward the intended build's Lv.70 shape with the real RO-style costs. */
function allocation(actor: Character, profile: PrimaryStats): PrimaryStats | null {
  const base = data.status_allocation.base, keys = Object.keys(base) as (keyof PrimaryStats)[], stats = { ...actor.primary_stats };
  const weight = Object.fromEntries(keys.map(k => [k, Math.max(0, profile[k] - base[k])])) as Record<keyof PrimaryStats, number>;
  const cost = (next: number) => data.status_allocation.cost_by_new_value.find(row => row.new_value === next)?.point_cost ?? Infinity;
  let left = actor.unspent_status_points, changed = false;
  for (;;) {
    const open = keys.filter(k => weight[k] > 0 && stats[k] < data.status_allocation.manual_value_max && cost(stats[k] + 1) <= left); if (!open.length) break;
    const pick = open.reduce((a, b) => ((stats[a] - base[a]) / weight[a] <= (stats[b] - base[b]) / weight[b] ? a : b)); left -= cost(stats[pick] + 1); stats[pick]++; changed = true;
  }
  return changed ? stats : null;
}
const score = (item: Item) => { const d = itemDefinition(item, content) as { tier_level: number }; return d.tier_level * 100 + rank(item.rarity_id) * 10 + (item.kind === 'equipment' ? item.options.length : 0); };
function wearable(actor: Character, item: Item) {
  if (item.kind !== 'equipment') return false; const d = itemDefinition(item, content) as { slot: string; weapon_type?: string | null; required_level: number };
  return d.required_level <= actor.level && (d.slot !== 'weapon' || d.weapon_type === equipment.weapon_compatibility[actor.job_id]);
}
function equipBest(server: Server) {
  for (const actor of team(server.save)) for (const slot of SLOTS) {
    const s = server.save, current = actor.equipment[slot] ? s.inventory.find(i => i.instance_id === member(s, actor.character_id).equipment[slot]) : undefined;
    const owned = new Set(s.roster.flatMap(a => Object.values(a.equipment).filter(Boolean)));
    const best = s.inventory.filter(i => !owned.has(i.instance_id) && (itemDefinition(i, content) as { slot: string }).slot === slot && wearable(member(s, actor.character_id), i)).sort((a, b) => score(b) - score(a))[0];
    if (best && (!current || score(best) > score(current))) server.ok('equipment.equip', { character_id: actor.character_id, slot, item_instance_id: best.instance_id });
  }
  for (const actor of team(server.save)) if (!actor.equipment.weapon && server.save.wallet.gold >= 125) server.ok('equipment.purchase_weapon', { character_id: actor.character_id, weapon_type: equipment.weapon_compatibility[actor.job_id], tier_level: 1 });
}
function tidyInventory(server: Server) {
  const s = server.save, owned = new Set(s.roster.flatMap(a => Object.values(a.equipment).filter(Boolean)));
  // Fuse three identical-rarity spares of one slot/tier before salvaging the rest of the weak ones.
  const spare = s.inventory.filter(i => i.kind === 'equipment' && !owned.has(i.instance_id) && !i.locked && !i.training);
  const groups = new Map<string, Item[]>(); for (const item of spare) { const d = itemDefinition(item, content) as { slot: string; tier_level: number; weapon_type?: string | null }; const key = `${item.rarity_id}|${d.slot}|${d.tier_level}|${d.weapon_type ?? ''}`; groups.set(key, [...(groups.get(key) ?? []), item]); }
  for (const list of groups.values()) for (let i = 0; i + 3 <= list.length && rank(list[0]!.rarity_id) < 3; i += 3) server.ok('equipment.fuse', { instance_ids: list.slice(i, i + 3).map(x => x.instance_id) });
  const after = server.save, held = new Set(after.roster.flatMap(a => Object.values(a.equipment).filter(Boolean)));
  if (after.inventory.length > 120) { const junk = after.inventory.filter(i => i.kind === 'equipment' && !held.has(i.instance_id) && !i.locked).sort((a, b) => score(a) - score(b)).slice(0, after.inventory.length - 80).map(i => i.instance_id); if (junk.length) server.ok('equipment.salvage', { instance_ids: junk }); }
}
function learnSkills(server: Server, actor: Character): boolean {
  const build = builds.get(plan.get(actor.character_id)!)!, wanted = Object.entries(build.skill_levels).filter(([id]) => { const d = content.skills[id] as unknown as { class_id: string; unlock_level: number } | undefined; return d && (d.class_id === actor.root_job_id || d.class_id === actor.job_id) && d.unlock_level <= actor.level; });
  const order = [...wanted].sort(([a], [b]) => Number(build.active_slots.includes(b)) - Number(build.active_slots.includes(a)));
  for (const [id, target] of order) {
    const now = member(server.save, actor.character_id), level = now.skill_levels[id] ?? 0, cap = Math.min(target, characterSkillCap(now, content.skills[id] as never));
    if (level >= cap) continue;
    try { if (canPay(server.save.wallet, skillQuote(now, id, level + 1, content)) && server.ok('skill.upgrade', { character_id: actor.character_id, skill_id: id, target_level: level + 1 })) return true; } catch { /* unavailable */ }
  }
  return false;
}
function setLoadout(server: Server, actor: Character, order?: (string | null)[]) {
  const now = member(server.save, actor.character_id), build = builds.get(plan.get(actor.character_id)!)!;
  const active = (id: string | null): id is string => !!id && !!now.skill_levels[id] && (content.skills[id] as unknown as { kind: string }).kind === 'active';
  const slots = (order ?? build.active_slots).filter(active); for (const id of Object.keys(now.skill_levels)) if (slots.length < 4 && active(id) && !slots.includes(id)) slots.push(id);
  const wanted = [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null, slots[3] ?? null];
  if (JSON.stringify(wanted) !== JSON.stringify(now.active_slots)) server.ok('skill.set_loadout', { character_id: actor.character_id, skill_ids: wanted });
}
/** A member waiting at an unpaid Breakthrough gate: a sensible player saves gold for it instead of refining. */
function gateWaiting(server: Server) {
  return team(server.save).some(a => data.progression.breakthrough_gates.some(g => g.at_level === a.level && a.local_cap === a.level && !a.completed_gate_ids.includes(g.at_level) && !canPay(server.save.wallet, g.cost)));
}
function spend(server: Server, log: Record<string, number>) {
  for (let round = 0; round < 400; round++) {
    let progressed = false;
    const saving = gateWaiting(server);
    for (const actor of team(server.save)) {
      const now = member(server.save, actor.character_id), build = builds.get(plan.get(actor.character_id)!)!;
      // Job change at Lv.20 into the planned branch, breakthrough at the gate.
      if (now.level >= data.promotion.class2_min_level && now.job_id === now.root_job_id && server.ok('character.change_job', { character_id: now.character_id, job_id: build.job_id })) { progressed = true; log.job_changes = (log.job_changes ?? 0) + 1; setLoadout(server, member(server.save, now.character_id)); }
      const gate = data.progression.breakthrough_gates.find(g => g.at_level === now.level && now.local_cap === now.level && !now.completed_gate_ids.includes(g.at_level));
      if (gate && canPay(server.save.wallet, gate.cost) && server.ok('character.breakthrough', { character_id: now.character_id, gate_level: gate.at_level })) { progressed = true; log.breakthroughs = (log.breakthroughs ?? 0) + 1; }
      const stats = allocation(member(server.save, now.character_id), build.primary_stats);
      if (stats) { try { allocationQuote(member(server.save, now.character_id).primary_stats, stats, data); if (server.ok('character.allocate_status', { character_id: now.character_id, allocation: stats })) log.status_allocations = (log.status_allocations ?? 0) + 1; } catch { /* nothing affordable */ } }
    }
    // Level-ups: lowest member first, one level at a time (EXP is the main limiter).
    const lowest = team(server.save).filter(a => a.level < Math.min(data.release.level_cap, a.local_cap)).sort((a, b) => a.level - b.level)[0];
    if (lowest && canPay(server.save.wallet, levelQuote(lowest, lowest.level + 1, data)) && server.ok('character.level_up', { character_id: lowest.character_id, target_level: lowest.level + 1 })) { progressed = true; log.level_ups = (log.level_ups ?? 0) + 1; }
    // Skills (gold + manuals): one upgrade per round for the member whose loadout is least developed.
    if (!saving) for (const actor of team(server.save).sort((a, b) => Object.values(a.skill_levels).reduce((n, v) => n + v, 0) - Object.values(b.skill_levels).reduce((n, v) => n + v, 0))) if (learnSkills(server, actor)) { progressed = true; log.skill_upgrades = (log.skill_upgrades ?? 0) + 1; setLoadout(server, member(server.save, actor.character_id)); break; }
    // Gear: tier-up worn items to the highest tier the owner can wear, then refine the lowest slot (weapon/armor first).
    if (!saving) for (const actor of team(server.save)) for (const slot of SLOTS) {
      const id = member(server.save, actor.character_id).equipment[slot]; if (!id) continue; const item = server.save.inventory.find(i => i.instance_id === id)!, tier = (itemDefinition(item, content) as { tier_level: number }).tier_level;
      const row = equipment.tier_upgrade.rows.find(r => r.from === tier && r.to <= actor.level);
      if (row && canPay(server.save.wallet, { gold: row.gold, refine_ore: row.refine_ore }) && server.ok('equipment.tier_up', { item_instance_id: id, target_tier: row.to })) { progressed = true; log.tier_ups = (log.tier_ups ?? 0) + 1; }
    }
    const refineTargets = team(server.save).flatMap(a => (['weapon', 'armor', 'head', 'garment', 'shoes', 'accessory'] as const).filter(slot => a.equipment[slot]).map(slot => ({ a, slot, level: a.slot_progress[slot].refine + (slot === 'weapon' ? 0 : slot === 'armor' ? 0.5 : 1) }))).filter(t => member(server.save, t.a.character_id).slot_progress[t.slot].refine < 10).sort((x, y) => x.level - y.level);
    for (const target of saving ? [] : refineTargets.slice(0, 1)) { const r = server.run('slot.refine', { character_id: target.a.character_id, slot: target.slot, target_level: member(server.save, target.a.character_id).slot_progress[target.slot].refine + 1 }); if (r.outcome === 'committed') { progressed = true; log.refine_attempts = (log.refine_attempts ?? 0) + 1; } }
    if (!saving && enchantOnce(server)) { progressed = true; log.enchants = (log.enchants ?? 0) + 1; }
    if (!progressed) break;
  }
  // Crystal: equipment 10-pulls; surplus gold: daily ore/manual packs.
  while (server.save.wallet.crystal >= 1500 && server.save.inventory.length < 480 && server.ok('gacha.pull', { pool_id: 'equipment_v1', count: 10 })) log.gacha_10pulls = (log.gacha_10pulls ?? 0) + 1;
  if (!gateWaiting(server)) for (const offer of ['manual_pack', 'ore_pack']) if (server.save.wallet.gold > 30000) server.run('shop.buy', { offer_id: offer, quantity: 1 });
}
// ---- other sources and sinks: daily dungeons, Tower, cards, enchant ------------------------------------------
const slotRules = content.documents['slot-progress.json']! as unknown as { enchant: { max: number; upgrade_rows: { from: number; to: number; gold: number; enchant_dust: number }[] }; cards: { capacity_by_refine: { minimum_refine: number; slots: number }[] } };
function battleToEnd(server: Server, limitMs: number) {
  for (let i = 0; i < 60 && server.save.active_battle; i++) {
    const r = server.run('battle.advance', { battle_id: server.save.active_battle.battle_id, requested_game_ms: limitMs }, 5000);
    if (r.result.code !== 'BATTLE_ADVANCED') {
      // A refused advance must not leave the battle open: every other command is locked while it is (a 25-day run once stalled for days).
      if (server.save.active_battle) { process.stderr.write(`[journey] ${server.save.active_battle.mode} advance refused (${r.result.code}) at ${new Date(server.now).toISOString()} → retreat\n`); server.run('battle.retreat', { battle_id: server.save.active_battle.battle_id }); }
      return r.result.code;
    }
  }
  if (server.save.active_battle) { process.stderr.write(`[journey] ${server.save.active_battle.mode} still open after 60 advances → retreat\n`); server.run('battle.retreat', { battle_id: server.save.active_battle.battle_id }); }
  return 'ENDED';
}
let dailyDay = '';
function dailyRuns(server: Server, log: Record<string, number>) {
  const day = bangkokDay(server.now); if (day === dailyDay || !dailyUnlocked(server.save, content)) return; dailyDay = day;
  for (const boss of ['treasury', 'forge', 'essence'] as const) for (let n = 0; n < 3; n++) {
    if (server.run('battle.start_daily', { boss_id: boss }).outcome !== 'committed') break;
    // Claim each attempt's chests like the result card does: the 32-claim queue would otherwise refuse the next settlement.
    battleToEnd(server, 60000); log.daily_attempts = (log.daily_attempts ?? 0) + 1; collect(server);
  }
}
function climbTower(server: Server, log: Record<string, number>) {
  if (!towerUnlocked(server.save, content)) return;
  for (let k = 0; k < 10; k++) {
    const floor = server.save.tower.highest_cleared_floor + 1; if (!towerCanChallenge(floor, server.save, content)) return;
    if (![1, 2].every(seed => towerFight(server.save, floor, 700 + seed, content).win)) return;
    if (server.run('battle.start_tower', { floor }).outcome !== 'committed') return;
    battleToEnd(server, 40000); if (server.save.tower.highest_cleared_floor < floor) { log.tower_losses = (log.tower_losses ?? 0) + 1; return; }
    log.tower_floors = (log.tower_floors ?? 0) + 1; collect(server);
  }
}
function socketCards(server: Server, log: Record<string, number>) {
  const s = server.save, used = new Set(s.roster.flatMap(a => Object.values(a.slot_progress).flatMap(p => p.cards.filter(Boolean)))) as Set<string>;
  const free = s.inventory.filter(i => i.kind === 'card' && !used.has(i.instance_id)).sort((a, b) => rank(b.rarity_id) - rank(a.rarity_id));
  for (const actor of team(s)) for (const slot of SLOTS) {
    const progress = member(server.save, actor.character_id).slot_progress[slot], capacity = Math.max(...slotRules.cards.capacity_by_refine.filter(r => progress.refine >= r.minimum_refine).map(r => r.slots));
    for (let index = 0; index < capacity; index++) {
      const at = free.findIndex(card => (itemDefinition(card, content) as { slot: string }).slot === slot); if (progress.cards[index] || at < 0) continue;
      const card = free.splice(at, 1)[0]!; if (server.ok('card.assign', { character_id: actor.character_id, slot, card_slot: index, card_instance_id: card.instance_id })) log.cards_socketed = (log.cards_socketed ?? 0) + 1;
    }
  }
}
function enchantOnce(server: Server): boolean {
  const targets = team(server.save).flatMap(a => SLOTS.filter(slot => a.equipment[slot]).map(slot => ({ a, slot, level: a.slot_progress[slot].enchant.level }))).filter(t => t.level < slotRules.enchant.max).sort((x, y) => x.level - y.level);
  for (const t of targets.slice(0, 2)) {
    const row = slotRules.enchant.upgrade_rows.find(r => r.from === t.level)!, line = t.a.slot_progress[t.slot].enchant.line_id ?? (t.slot === 'weapon' || t.slot === 'accessory' ? 'offense' : 'vitality');
    if (canPay(server.save.wallet, { gold: row.gold, enchant_dust: row.enchant_dust }) && server.ok('slot.enchant', { character_id: t.a.character_id, slot: t.slot, line_id: line, target_level: t.level + 1 })) return true;
  }
  return false;
}
function collect(server: Server) {
  server.run('farm.claim', {});
  for (const claim of [...server.save.pending_rewards]) if (server.run('reward.claim', { claim_id: claim.claim_id }).outcome !== 'committed') { tidyInventory(server); server.run('reward.claim', { claim_id: claim.claim_id }); }
  server.run('daily.objective_claim', {});
}
// ---- choosing by real test fights -----------------------------------------------------------------------
function trial(state: AccountState, stageId: string, seeds = 3) { let wins = 0, time = 0; for (let s = 1; s <= seeds; s++) { const r = storyFight(state, stageId, 1000 + s, content).sample; if (r.kind === 'victory') { wins++; time += r.end_ms; } } return { wins, time: wins ? time / wins : Infinity }; }
const better = (a: { wins: number; time: number }, b: { wins: number; time: number }) => a.wins > b.wins || (a.wins === b.wins && a.time < b.time);
/** Skill order: try each candidate order per member (rotations of the planned slots) and keep the best by test fights. */
function tuneLoadouts(server: Server, stageId: string, log: Record<string, number>) {
  for (const actor of team(server.save)) {
    const base = member(server.save, actor.character_id).active_slots, ids = base.filter((x): x is string => !!x); if (ids.length < 2) continue;
    const orders = [ids, [...ids.slice(1), ids[0]!], [...ids].reverse(), [ids[1]!, ids[0]!, ...ids.slice(2)]];
    let bestOrder = base, best = trial(server.save, stageId);
    for (const order of orders) { const clone = structuredClone(server.save); member(clone, actor.character_id).active_slots = [order[0] ?? null, order[1] ?? null, order[2] ?? null, order[3] ?? null]; const r = trial(clone, stageId); if (better(r, best)) { best = r; bestOrder = member(clone, actor.character_id).active_slots; } }
    if (JSON.stringify(bestOrder) !== JSON.stringify(base)) { server.ok('skill.set_loadout', { character_id: actor.character_id, skill_ids: bestOrder }); log.loadout_changes = (log.loadout_changes ?? 0) + 1; }
  }
}
/** Before a challenge: planned loadouts, or for a heavy-cast boss (D-067) the interrupt arrangement found by test fights. */
function heavy(stageId: string) { return stages.find(s => s.id === stageId)!.encounter[0]!.active_slots.some(id => !!id && ((content.skills[id] as unknown as { tags?: string[] } | undefined)?.tags ?? []).includes('heavy_cast')); }
function chooseLoadoutFor(server: Server, stageId: string, log: Record<string, number>) {
  for (const actor of team(server.save)) setLoadout(server, member(server.save, actor.character_id));
  if (!heavy(stageId)) return;
  const pick = bestInterruptLoadout(server.save, stageId, content);
  for (const actor of team(pick)) if (JSON.stringify(actor.active_slots) !== JSON.stringify(member(server.save, actor.character_id).active_slots)) { server.ok('skill.set_loadout', { character_id: actor.character_id, skill_ids: actor.active_slots }); log.interrupt_loadouts = (log.interrupt_loadouts ?? 0) + 1; }
}
/** Initial team: every trio of companions (main fixed) with each root's first-listed builds, tested at reference levels. */
async function chooseTeam(main: Root) {
  const { referenceAccount } = await import('../../src/simulation/balance.ts');
  const defaults: Record<Root, string> = { swordsman: 'crusader_guardian', acolyte: 'priest_healer', archer: 'hunter_sniper', mage: 'wizard_artillery', thief: 'assassin_critical', merchant: 'blacksmith_hammer' } as never;
  const companions = ROOTS, trios: Root[][] = [];
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) trios.push([companions[a]!, companions[b]!, companions[c]!]);
  const results = trios.map(trio => {
    const ids = ['main', ...trio.map(r => `npc_${r}`)], probe = initializeAccount(content, { root_job_id: main, gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);
    const placements = positions(ids, probe), roots = Object.fromEntries(ids.map(id => [id, id === 'main' ? main : id.slice(4) as Root]));
    const ref = { id: trio.join('+'), members: placements.map(p => ({ character_id: p.character_id, root: roots[p.character_id]!, position: p.position, build: builds.get(defaults[roots[p.character_id]!])! })) };
    let wins = 0, time = 0; for (const [stage, level] of [['1-10', 10], ['3-10', 26], ['6-20', 50]] as const) { const r = trial(referenceAccount(ref as never, level, content), stage, 2); wins += r.wins; time += r.wins ? r.time : 40000; }
    return { trio, wins, time, placements };
  }).sort((x, y) => y.wins - x.wins || x.time - y.time);
  return { best: results[0]!, ranking: results.slice(0, 5).map(r => ({ trio: r.trio, wins: r.wins, mean_time_s: Math.round(r.time / 3 / 10) / 100 })), defaults };
}
/** Branch choice at Lv.20: for each member, test its builds' branches on the next stage and keep the best. */
async function chooseBranches(server: Server, stageId: string) {
  const { referenceAccount } = await import('../../src/simulation/balance.ts');
  for (const actor of team(server.save)) {
    let bestBuild = plan.get(actor.character_id)!, best = { wins: -1, time: Infinity };
    for (const id of byRoot.get(actor.root_job_id)!) {
      const ref = { id: 'probe', members: server.save.team.map(p => { const m = member(server.save, p.character_id); return { character_id: p.character_id, root: m.root_job_id, position: p.position, build: builds.get(p.character_id === actor.character_id ? id : plan.get(p.character_id)!)! }; }) };
      const r = trial(referenceAccount(ref as never, Math.max(20, actor.level), content), stageId, 2); if (better(r, best)) { best = r; bestBuild = id; }
    }
    plan.set(actor.character_id, bestBuild);
  }
}

// ---- run ------------------------------------------------------------------------------------------------
const started = performance.now(), start = Date.parse('2026-10-20T00:00:00.000Z');
const server = new Server(initializeAccount(content, { root_job_id: MAIN, gender: 'female' }, new Date(start).toISOString(), bangkokDay(start), SEED), start);
const fixed = TRIO ? (TRIO.split(',') as Root[]) : null;
const choice = fixed ? await (async () => { const ids = ['main', ...fixed.map(r => `npc_${r}`)], probe = initializeAccount(content, { root_job_id: MAIN, gender: 'female' }, new Date(start).toISOString(), bangkokDay(start), SEED); return { best: { trio: fixed, placements: positions(ids, probe) }, ranking: [], defaults: { swordsman: 'crusader_guardian', acolyte: 'priest_healer', archer: 'hunter_sniper', mage: 'wizard_artillery', thief: 'assassin_critical', merchant: 'blacksmith_hammer' } as Record<Root, string> }; })() : await chooseTeam(MAIN);
const log: Record<string, number> = {}, timeline: Record<string, unknown>[] = [];
server.ok('party.set', { placements: choice.best.placements });
for (const p of server.save.team) plan.set(p.character_id, choice.defaults[member(server.save, p.character_id).root_job_id]);
let stuckSince = start, branchesChosen = !!fixed, attempts = 0, failures = 0;
const end = start + DAYS * 86400000, snapshots: Record<string, AccountState> = {}, wallStart = Date.now();
let reportedDay = -1;
while (server.now < end) {
  const next = stages.find(s => !server.save.story.cleared_stage_ids.includes(s.id)); if (!next) break;
  // Progress on stderr (stdout stays the JSON report): one line per simulated day with real elapsed time and an ETA.
  const day = Math.floor((server.now - start) / 86400000);
  if (day !== reportedDay) { reportedDay = day; const real = (Date.now() - wallStart) / 1000, eta = day > 0 ? real / day * (DAYS - day) : NaN;
    process.stderr.write(`[journey ${MAIN}] day ${day}/${DAYS} · next ${next.id} · team Lv ${team(server.save).map(a => a.level).join('/')} · ${real.toFixed(0)}s real${Number.isFinite(eta) ? ` · ETA ~${(eta / 60).toFixed(0)} min` : ''}\n`); }
  collect(server); dailyRuns(server, log); spend(server, log); tidyInventory(server); equipBest(server); socketCards(server, log);
  climbTower(server, log);
  if (!branchesChosen && team(server.save).some(a => a.level >= 19)) { await chooseBranches(server, next.id); branchesChosen = true; }
  if (SCHEDULE) {
    // Pace-driven credit (measurement only): snapshot the spent-out account, then credit the first clear like the server would.
    if (team(server.save).reduce((n, a) => n + a.level, 0) / 4 >= recommended(next.id)) {
      chooseLoadoutFor(server, next.id, log); snapshots[next.id] = structuredClone(server.save);
      const reward = (next as unknown as { first_clear_reward: Partial<Wallet> }).first_clear_reward;
      server.save = { ...server.save, story: { ...server.save.story, cleared_stage_ids: [...server.save.story.cleared_stage_ids, next.id] }, wallet: Object.fromEntries(Object.entries(server.save.wallet).map(([k, v]) => [k, v + (reward[k as keyof Wallet] ?? 0)])) as Wallet, daily_objectives: { ...server.save.daily_objectives, battle_finished: true } };
      rules.validateAccount(server.save); server.run('farm.set_stage', { stage_id: next.id });
      timeline.push({ stage: next.id, hours: Math.round((server.now - start) / 36000) / 100, recommended: recommended(next.id), levels: team(server.save).map(a => a.level), jobs: team(server.save).map(a => a.job_id) });
      continue;
    }
    server.now += STEP; continue;
  }
  chooseLoadoutFor(server, next.id, log);
  const ready = trial(server.save, next.id, 3);
  if (ready.wins >= 2) {
    attempts++; const code = server.fight(next.id);
    if (code === 'STORY_WON') {
      collect(server); const cleared = server.save.story.cleared_stage_ids; server.run('farm.set_stage', { stage_id: cleared[cleared.length - 1] });
      timeline.push({ stage: next.id, hours: Math.round((server.now - start) / 36000) / 100, recommended: recommended(next.id), levels: team(server.save).map(a => a.level), jobs: team(server.save).map(a => a.job_id), gear_tier: Math.max(...team(server.save).map(a => Math.min(...SLOTS.map(slot => { const id = a.equipment[slot]; return id ? (itemDefinition(server.save.inventory.find(i => i.instance_id === id)!, content) as { tier_level: number }).tier_level : 0; })))), refine_weapon: team(server.save).map(a => a.slot_progress.weapon.refine), wait_min: Math.round((server.now - stuckSince) / 60000) });
      stuckSince = server.now; continue;
    }
    failures++;
  } else if (server.now - stuckSince > 60 * 60000 && (server.now - stuckSince) % (60 * 60000) < STEP) tuneLoadouts(server, next.id, log);
  server.now += STEP;
}
const waits = timeline.map(t => t.wait_min as number), sorted = [...waits].sort((a, b) => a - b);
// Diagnostics: --dump-final <path> writes the final simulated account (e.g. to see why a schedule run stalls).
const dumpPath = option('--dump-final', ''); if (dumpPath) await writeFile(dumpPath, JSON.stringify({ now: new Date(server.now).toISOString(), save: server.save, log }));
const report = { task_id: 'TASK-041', kind: 'journey', content_hash: content.manifest.content_hash, main: MAIN, seed: SEED, step_minutes: STEP / 60000, simulated_days: Math.round((server.now - start) / 864000) / 100, policy: 'farm the newest cleared stage continuously; every step claim → spend round-robin (job change/breakthrough/status → level lowest member → one skill upgrade → tier-up → refine lowest slot) → equip best → challenge next stage when 2/3 test fights win; team trio and Lv.20 branches chosen by test fights; skill order re-tested after 1h stuck; crystal → equipment 10-pulls; gold>30k → shop packs',
  team: choice.best.trio, team_ranking: choice.ranking, builds: Object.fromEntries(plan), cleared: server.save.story.cleared_stage_ids.length, last_stage: server.save.story.cleared_stage_ids.at(-1) ?? null,
  wait_minutes: { median: sorted[Math.floor(sorted.length / 2)] ?? null, p90: sorted[Math.floor(sorted.length * 0.9)] ?? null, max: sorted.at(-1) ?? null }, attempts, failed_attempts: failures, spend_log: log, commands: server.commands, rejected: server.rejected,
  final: { levels: team(server.save).map(a => `${a.character_id}:${a.job_id}:${a.level}`), wallet: server.save.wallet, inventory: server.save.inventory.length }, elapsed_ms: Math.round(performance.now() - started), timeline };
await mkdir(path.dirname(path.resolve(OUT)), { recursive: true }); await writeFile(OUT, JSON.stringify(report, null, 1) + '\n');
if (SCHEDULE) { await mkdir(path.dirname(path.resolve(SCHEDULE)), { recursive: true }); await writeFile(SCHEDULE, gzipSync(JSON.stringify({ content_hash: content.manifest.content_hash, main: MAIN, seed: SEED, snapshots }))); }
console.log(JSON.stringify({ main: MAIN, team: report.team, cleared: report.cleared, last: report.last_stage, days: report.simulated_days, wait_minutes: report.wait_minutes, attempts, failures, elapsed_ms: report.elapsed_ms }));
for (const row of timeline.filter((_, i) => i % 5 === 4 || i === timeline.length - 1)) console.log(JSON.stringify(row));

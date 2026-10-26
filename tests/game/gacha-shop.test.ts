// TASK-037 card gacha, TASK-051 store + equipment gacha (D-063) and TASK-052 random option lines (D-062).
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { equippedSources } from '../../src/domain/build/equipment.ts';
import { optionRules, optionValue, rollItemOptions } from '../../src/domain/build/item-options.ts';
import { readFileSync } from 'node:fs';
import { itemDefinition } from '../../src/domain/build/equipment-definition.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { pullCards, pullCost } from '../../src/domain/rewards/gacha.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';

const rules = new AccountCommandRules();
type Gear = Extract<AccountState['inventory'][number], { kind: 'equipment' }>;
function fixture(mutate: (state: AccountState) => void = () => {}, startIso = '2026-10-20T05:00:00.000Z') {
  let save = initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, startIso, '2026-10-20', 1), revision = 1, serial = 0, now = Date.parse(startIso); mutate(save);
  function run(type: Command['type'], params: unknown, seed = 101, advanceMs = 1000) {
    now += advanceMs; const input = { type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
    const time: CommandTime = { battle_seed: seed, server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(), last_ack_ms: 0, lease_expires_ms: 0, started_ms: 0, farm_from_ms: Date.parse(save.farm.reserved_through), stored_last_ack_ms: 0, stored_lease_ms: 0 };
    const result = rules.decide(input, save, null, time, 'b'.repeat(64)); if (result.receipt.outcome === 'committed') { save = result.state; revision++; } return result.receipt;
  }
  return { run, get state() { return save; } };
}

// --- TASK-037 card gacha -------------------------------------------------------------------------------
test('T037 AC-01: D109 fixed monster cards use all78 identities at50/25/20/2/3 for 100/1000 crystal, with no pet/artifact outcomes', () => {
  const pool = content.documents['gacha.json'] as unknown as { definitions: string[]; quality_weights: Record<string, number>; disabled_pools: string[] };
  assert.equal(pool.definitions.length, 78); assert.deepEqual(pool.quality_weights, {common:500000,uncommon:250000,rare:200000,epic:20000,legendary:30000,immortal:0,supreme:0});
  assert.deepEqual(pullCost('card_v1', 1, content), { crystal: 100 }); assert.deepEqual(pullCost('card_v1', 10, content), { crystal: 1000 });
  const draws = () => { let n = 0; return () => (n++ * 0.137) % 1; };
  const early = fixture().state, items = pullCards(early, 10, draws(), 'probe', content);
  assert.ok(items.every(item => item.kind === 'card' && pool.definitions.includes(item.definition_id) ), 'all cards come from the fixed-monster catalog');
  const late = fixture(s => { s.story.cleared_stage_ids = storyStages(content).filter(st => st.chapter <= 5).map(st => st.id); }).state, lateItems = pullCards(late, 10, draws(), 'late', content);
  assert.deepEqual(lateItems.map(i=>[i.definition_id,i.rarity_id]),items.map(i=>[i.definition_id,i.rarity_id]),'card gacha uses all78 identities; equipment tier remains gear-only'); assert.deepEqual(pool.disabled_pools, ['pet', 'artifact']);
});

test('T037 AC-02: a pull debits crystal, adds cards and moves pity atomically; 99 crystal changes nothing', () => {
  const poor = fixture(s => { s.wallet.crystal = 99; }), before = structuredClone(poor.state);
  assert.equal(poor.run('gacha.pull', { pool_id: 'card_v1', count: 1 }).result.code, 'INSUFFICIENT_RESOURCES'); assert.deepEqual(poor.state, before);
  const f = fixture(s => { s.wallet.crystal = 1100; });
  const one = f.run('gacha.pull', { pool_id: 'card_v1', count: 1 }); assert.equal(one.result.code, 'GACHA_PULLED'); assert.equal(f.state.wallet.crystal, 1000); assert.equal(one.result.created_instance_ids.length, 1);
  const ten = f.run('gacha.pull', { pool_id: 'card_v1', count: 10 }); assert.equal(f.state.wallet.crystal, 0); assert.equal(ten.result.created_instance_ids.length, 10);
  const counters = f.state.gacha.card_v1; assert.ok(counters.gold_misses <= 29 && counters.bronze_streak <= 9);
});

test('T037 AC-03: the same server seed reproduces the same cards; duplicates are distinct fixed-rarity instances with rarity salvage unless worn/locked', () => {
  const a = fixture(s => { s.wallet.crystal = 1000; }), b = fixture(s => { s.wallet.crystal = 1000; });
  a.run('gacha.pull', { pool_id: 'card_v1', count: 10 }, 7); b.run('gacha.pull', { pool_id: 'card_v1', count: 10 }, 7);
  assert.deepEqual(a.state.inventory, b.state.inventory); assert.deepEqual(a.state.gacha, b.state.gacha);
  const cards = a.state.inventory.filter(item => item.kind === 'card'); assert.equal(new Set(cards.map(card => card.instance_id)).size, 10);
  const dust = { common:20,uncommon:40,rare:80,epic:120,legendary:200,immortal:300,supreme:400 } as Record<string, number>, target = cards[0]!, wallet = a.state.wallet.card_dust;
  assert.equal(a.run('card.salvage', { instance_ids: [target.instance_id] }).result.code, 'CARDS_SALVAGED'); assert.equal(a.state.wallet.card_dust, wallet + dust[target.rarity_id]!);
  const locked = cards[1]!; a.run('equipment.lock', { item_instance_id: locked.instance_id, locked: true });
  assert.equal(a.run('card.salvage', { instance_ids: [locked.instance_id] }).result.code, 'ITEM_LOCKED');
});

test('T037 AC-04: a worst-case Common sequence hits Rare at pull10/20 and Legendary at pull30, then counters reset', () => {
  const state = fixture().state, worst = () => 0, qualities = pullCards(state, 10, worst, 'a', content).concat(pullCards(state, 10, worst, 'b', content), pullCards(state, 10, worst, 'c', content)).map(item => item.rarity_id);
  assert.equal(qualities[9], 'rare'); assert.equal(qualities[19], 'rare'); assert.equal(qualities[29], 'legendary');
  assert.ok(qualities.filter((_, i) => ![9, 19, 29].includes(i)).every(q => q === 'common'));
  assert.deepEqual(state.gacha.card_v1, { gold_misses: 0, bronze_streak: 0 });
  assert.doesNotThrow(() => rules.validateAccount(structuredClone(state)));
});

// --- TASK-052 random option lines ----------------------------------------------------------------------
test('T052 AC-01: every creation path gives Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5 lines (D-068) within range, deterministic per seed', () => {
  const perRarity = optionRules(content).lines_by_rarity; assert.deepEqual(perRarity, { common: 0, uncommon: 0, rare: 1, epic: 2, legendary: 3, immortal: 4, supreme: 5 });
  const check = (items: AccountState['inventory']) => { for (const item of items) if (item.kind === 'equipment') {
    assert.equal(item.options.length, perRarity[item.rarity_id], `${item.instance_id} ${item.rarity_id}`);
    assert.equal(new Set(item.options.map(o => optionValue(o, 1, content).row.stat)).size, item.options.length, 'no repeated stat');
    for (const option of item.options) { const { row, value } = optionValue(option, 1, content); assert.ok(value >= row.min - 1e-9 && value <= row.max + 1e-9, option.id); }
  } };
  // Farm drops (loot RNG), equipment gacha (command seed) and fusion (command seed).
  const s = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1); s.story.cleared_stage_ids = ['1-1']; s.story.selected_farm_stage = '1-1'; s.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, s, content);
  const base = Date.parse(s.farm.reserved_through), farm = reserveFarm(s, base, base + 12 * 3600000, new Date(base + 12 * 3600000).toISOString(), 'drops', content);
  check(farm.pending_rewards[0]!.items); assert.deepEqual(farm, reserveFarm(s, base, base + 12 * 3600000, new Date(base + 12 * 3600000).toISOString(), 'drops', content));
  const g = fixture(st => { st.wallet.crystal = 3000; }); g.run('gacha.pull', { pool_id: 'equipment_v1', count: 10 }, 9); check(g.state.inventory);
  assert.ok(g.state.inventory.every(item => item.kind !== 'equipment' || ['rare', 'epic', 'legendary', 'immortal'].includes(item.rarity_id)));
  const fuse = fixture(st => { st.wallet.gold = 1e6; for (const id of ['x', 'y', 'z']) st.inventory.push({ instance_id: id, definition_id: 'equipment_sword_1', kind: 'equipment', rarity_id: 'uncommon', locked: false, training: false, options: [] }); });
  assert.equal(fuse.run('equipment.fuse', { instance_ids: ['x', 'y', 'z'] }, 5).result.code, 'EQUIPMENT_FUSED');
  const fused = fuse.state.inventory.find(item => item.kind === 'equipment' && item.rarity_id === 'rare') as Gear; assert.equal(fused.options.length, 1, 'fusion rolls a fresh rare line');
});

test('T052 AC-02: option lines enter the shared stat pipeline exactly once and the pool has no timing stats', () => {
  assert.ok(optionRules(content).pool.every(row => !['attack_speed', 'cast_speed', 'agi', 'dex'].includes(row.stat)), 'timing neutral');
  const f = fixture(s => { s.inventory.push({ instance_id: 'epic_head', definition_id: 'equipment_head_1', kind: 'equipment', rarity_id: 'epic', locked: false, training: false, options: [{ id: 'opt_hp', roll: 1000 }, { id: 'opt_crit', roll: 0 }] }); });
  f.run('equipment.equip', { character_id: 'main', slot: 'head', item_instance_id: 'epic_head' });
  const main = f.state.roster.find(actor => actor.character_id === 'main')!, sources = equippedSources(main, f.state, content), mods = sources.flatMap(source => source.modifiers);
  const hp = mods.filter(m => m.id.includes('opt_hp')), crit = mods.filter(m => m.id.includes('opt_crit'));
  assert.equal(hp.length, 1); assert.equal(hp[0]!.value, 0.05); assert.equal(crit.length, 1); assert.equal(crit[0]!.value, 0.005);
});

test('D146/T052: legacy higher-tier lines retain their scale and retired tier-up cannot mutate them; old saves get stable lines', () => {
  const f = fixture(s => { s.wallet.gold = 1e6; s.wallet.refine_ore = 1e4; const main = s.roster.find(a => a.character_id === 'main')!; main.level = 20; main.local_cap = 40; main.completed_gate_ids = [20]; main.unspent_status_points = 91;
    s.inventory.push({ instance_id: 'blade', definition_id: 'equipment_sword_20', kind: 'equipment', rarity_id: 'rare', locked: false, training: false, options: [{ id: 'opt_atk', roll: 500 }] }); });
  const before = (f.state.inventory.find(i => i.instance_id === 'blade') as Gear).options;
  assert.equal(f.run('equipment.tier_up', { item_instance_id: 'blade', target_tier: 20 }).result.code, 'TIER_UPGRADE_DISABLED');
  const after = f.state.inventory.find(i => i.instance_id === 'blade') as Gear; assert.deepEqual(after.options, before);
  assert.equal(optionValue(after.options[0]!, itemDefinition(after, content).tier_level, content).value, Math.round(optionValue(before[0]!, 1, content).value * 1.5 * 10000) / 10000);
  const old = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1) as unknown as Omit<AccountState, 'shop'> & { shop?: unknown };
  old.inventory.push({ instance_id: 'legacy_epic', definition_id: 'equipment_armor_1', kind: 'equipment', rarity_id: 'epic', locked: false, training: false } as never);
  delete old.shop; delete (old.gacha as { equipment_v1?: unknown }).equipment_v1;
  const once = migrateAccountState(old, content).state, twice = migrateAccountState(old, content).state;
  assert.doesNotThrow(() => rules.validateAccount(once)); assert.deepEqual(once, twice, 'stable backfill');
  assert.equal((once.inventory.find(i => i.instance_id === 'legacy_epic') as Gear).options.length, 2);
});

// --- TASK-051 store and equipment gacha -----------------------------------------------------------------
test('T051 AC-01: shop offers debit and grant exactly, refuse over-limit/insufficient buys whole, and reset limits on the next Bangkok day', () => {
  const f = fixture(s => { s.wallet.gold = 50000; }, '2026-10-20T16:00:00.000Z'), wallet = structuredClone(f.state.wallet);
  assert.equal(f.run('shop.buy', { offer_id: 'ore_pack', quantity: 3 }).result.code, 'SHOP_PURCHASED');
  assert.equal(f.state.wallet.gold, wallet.gold - 12000); assert.equal(f.state.wallet.refine_ore, wallet.refine_ore + 30);
  const before = structuredClone(f.state);
  assert.equal(f.run('shop.buy', { offer_id: 'ore_pack', quantity: 8 }).result.code, 'SHOP_LIMIT_REACHED'); assert.deepEqual(f.state, before);
  assert.equal(f.run('shop.buy', { offer_id: 'essence_pack', quantity: 1 }).result.code, 'INSUFFICIENT_RESOURCES'); assert.deepEqual(f.state, before);
  assert.equal(f.run('shop.buy', { offer_id: 'nope', quantity: 1 }).result.code, 'SHOP_OFFER_UNKNOWN');
  assert.equal(f.run('shop.buy', { offer_id: 'ore_pack', quantity: 3 }, 101, 2 * 3600000).result.code, 'SHOP_PURCHASED', 'new Bangkok day resets the limit');
  assert.equal(f.state.shop.purchases.ore_pack, 3);
});

test('T051 AC-02: equipment gacha costs 150/1500 crystal from the server seed, with epic pity on the 10th and legendary pity on the 50th', () => {
  assert.deepEqual(pullCost('equipment_v1', 1, content), { crystal: 150 }); assert.deepEqual(pullCost('equipment_v1', 10, content), { crystal: 1500 });
  const a = fixture(s => { s.wallet.crystal = 1500; }), b = fixture(s => { s.wallet.crystal = 1500; });
  a.run('gacha.pull', { pool_id: 'equipment_v1', count: 10 }, 33); b.run('gacha.pull', { pool_id: 'equipment_v1', count: 10 }, 33); assert.deepEqual(a.state.inventory, b.state.inventory);
  assert.equal(a.state.wallet.crystal, 0);
  const worst = fixture(s => { s.wallet.crystal = 7500; }); worst.state.gacha.equipment_v1 = { legendary_misses: 0, rare_streak: 0 };
  // seed whose draws are all low would be ideal; instead drive counters to the thresholds and check the forced outcome classes.
  worst.state.gacha.equipment_v1.rare_streak = 9; worst.run('gacha.pull', { pool_id: 'equipment_v1', count: 1 }, 1);
  assert.ok(['epic', 'legendary', 'immortal'].includes(worst.state.inventory.at(-1)!.rarity_id), 'epic-or-better on the 10th');
  worst.state.gacha.equipment_v1.legendary_misses = 49; worst.run('gacha.pull', { pool_id: 'equipment_v1', count: 1 }, 2);
  assert.ok(['legendary', 'immortal'].includes(worst.state.inventory.at(-1)!.rarity_id), 'legendary-or-better on the 50th');
  assert.deepEqual(worst.state.gacha.equipment_v1, { legendary_misses: 0, rare_streak: 0 });
});

test('T051 AC-03: gacha gear uses the player\'s tier and works with equip/fuse/salvage like any drop; tier-up stays retired', () => {
  const f = fixture(s => { s.wallet.crystal = 4500; s.wallet.gold = 1e6; s.wallet.refine_ore = 1e4; s.story.cleared_stage_ids = storyStages(content).slice(0, 10).map(x => x.id); });
  for (const seed of [21, 22, 23]) assert.equal(f.run('gacha.pull', { pool_id: 'equipment_v1', count: 10 }, seed).result.code, 'GACHA_PULLED', `pull ${seed}`);
  const gear = f.state.inventory.filter(i => i.kind === 'equipment') as Gear[], def = (item: Gear) => itemDefinition(item, content);
  const tier = (content.documents['loot.json']!.gear as unknown as { tier_by_chapter: Record<string, number> }).tier_by_chapter['1'];
  assert.equal(gear.length, 30, 'thirty pulls'); assert.ok(gear.every(item => def(item).tier_level === tier), 'chapter-1 clear gives tier 1');
  // Fuse: three pulled items of the same rarity/slot/weapon type become one higher rarity with freshly rolled lines.
  const key = (item: Gear) => `${item.rarity_id}|${def(item).slot}|${def(item).weapon_type ?? ''}`, groups = new Map<string, Gear[]>();
  for (const item of gear) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  const triple = [...groups.values()].find(list => list.length >= 3)!.slice(0, 3); assert.ok(triple, 'a fusable triple among 30 pulls');
  assert.equal(f.run('equipment.fuse', { instance_ids: triple.map(item => item.instance_id) }, 31).result.code, 'EQUIPMENT_FUSED', 'gacha items fuse');
  const pulled = new Set(gear.map(item => item.instance_id)), fused = f.state.inventory.find(item => item.kind === 'equipment' && item.instance_id.startsWith('fusion_')) as Gear;
  assert.ok(fused && fused.options.length === optionRules(content).lines_by_rarity[fused.rarity_id], `fused ${fused?.rarity_id} has its own option lines`);
  // D146: refused tier-up keeps the rolled lines; equip a wearable pulled item; salvage another.
  const rest = (f.state.inventory.filter(i => i.kind === 'equipment') as Gear[]).filter(item => pulled.has(item.instance_id));
  const climber = rest[0]!, lines = structuredClone(climber.options);
  assert.equal(f.run('equipment.tier_up', { item_instance_id: climber.instance_id, target_tier: 20 }).result.code, 'TIER_UPGRADE_DISABLED', 'gacha item cannot be converted to another tier');
  assert.deepEqual((f.state.inventory.find(i => i.instance_id === climber.instance_id) as Gear).options, lines, 'tier-up keeps lines');
  const wearable = rest.find(item => item !== climber && !def(item).weapon_type && Number(def(item).required_level) <= 1)!;
  assert.ok(wearable, 'a level-1 armour piece among the pulls');
  assert.equal(f.run('equipment.equip', { character_id: 'main', slot: def(wearable).slot, item_instance_id: wearable.instance_id }).result.code, 'EQUIPMENT_ASSIGNED', 'gacha item equips');
  const spare = rest.find(item => item !== climber && item !== wearable)!;
  assert.equal(f.run('equipment.salvage', { instance_ids: [spare.instance_id] }).result.code, 'EQUIPMENT_SALVAGED', 'gacha item salvages');
});

test('D146 equipment gacha still creates new Tier20/40/60 items at the corresponding cleared chapters',()=>{
 for(const [chapter,tier] of [[2,1],[3,20],[4,40],[6,60]]){
  const f=fixture(s=>{s.wallet.crystal=1500;s.story.cleared_stage_ids=storyStages(content).filter(row=>row.chapter<=chapter!).map(row=>row.id);});
  const before=structuredClone(f.state.inventory),receipt=f.run('gacha.pull',{pool_id:'equipment_v1',count:10},23);
  assert.equal(receipt.result.code,'GACHA_PULLED');const created=new Set(receipt.result.created_instance_ids);
  assert.equal(created.size,10);assert.ok(f.state.inventory.filter(i=>created.has(i.instance_id)).every(i=>itemDefinition(i,content).tier_level===tier));
  assert.deepEqual(f.state.inventory.filter(i=>!created.has(i.instance_id)),before);
 }
});
test('D-068: the gear gacha banner states the rolled option lines from content (Immortal 4, Supreme 5), not a stale literal', async () => {
  const { optionLineSummary } = await import('../../src/client/store.ts'), rules = optionRules(content);
  const text = optionLineSummary();
  for (const [rarity, count] of Object.entries(rules.lines_by_rarity)) if (count > 0) assert.match(text, new RegExp(`${rarity}\\s${count}`, 'i'), `${rarity} ${count} in "${text}"`);
});

test('D-068 regression (found by the 25-day journey, 21 Oct 2026): a Supreme item with 5 option lines is a valid save in the inventory and in a pending reward', () => {
  const lines = optionRules(content).lines_by_rarity, schema = JSON.parse(readFileSync('plan/data/schemas/account-state.json', 'utf8'));
  for (const branch of [schema.properties.inventory.items.oneOf[0], schema.properties.pending_rewards.items.properties.items.items.oneOf[0]]) assert.ok(branch.properties.options.maxItems >= Math.max(...Object.values(lines)), `schema allows ${branch.properties.options.maxItems} lines, Supreme rolls ${lines.supreme}`);
  let n = 0; const options = rollItemOptions('supreme', () => (n++ * 0.173) % 1, content); assert.equal(options.length, 5);
  const state = fixture().state, base = state.inventory.find(i => i.kind === 'equipment') ?? null;
  const definition = Object.values(content.items).find(d => (d as unknown as { kind: string; tier_level: number }).kind === 'equipment' && (d as unknown as { tier_level: number }).tier_level === 60) as unknown as { id: string };
  const item = { ...(base ?? {}), kind: 'equipment', instance_id: 'supreme_probe', definition_id: definition.id, rarity_id: 'supreme', locked: false, training: false, options } as never;
  state.inventory.push(item); assert.doesNotThrow(() => rules.validateAccount(state), 'inventory');
  state.inventory.pop();
  // A real 12 h farm claim, with one of its drops swapped for the Supreme probe.
  state.story.cleared_stage_ids = ['1-1']; state.story.selected_farm_stage = '1-1'; state.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, state, content);
  const from = Date.parse(state.farm.reserved_through), farm = reserveFarm(state, from, from + 12 * 3600000, new Date(from + 12 * 3600000).toISOString(), 'probe', content);
  const claim = farm.pending_rewards.find(c => c.items.length)!; claim.items[0] = item;
  assert.doesNotThrow(() => rules.validateAccount(farm), 'pending reward');
});

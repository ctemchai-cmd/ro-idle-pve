import test from 'node:test';
import assert from 'node:assert/strict';
import before from '../../plan/evidence/task-163/tower-before.json';
import raw from '../../src/generated/content.json';
import { content } from './combat-fixtures.ts';
import { towerData, towerRow, towerBoss } from '../../src/domain/modes/tower.ts';
import { scheduledTowerRewards, validateTowerRewardSchedule } from '../../src/content/tower-rewards.ts';
import { validateContent } from '../../src/content/loader.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import type { AccountState } from '../../src/contracts/index.ts';

test('D187 exact milestones/rotation, cumulative first100 budget, safe continuation beyond authored floors', () => {
  const totals: Record<string, number> = { cards: 0 };
  const examples = { 1: [1750,1200,0,0], 5: [5500,4000,50,0], 10: [12000,9000,100,1], 20: [26000,20000,200,2], 100: [106000,84000,200,2] };
  for (let f = 1; f <= 100; f++) {
    const row = towerRow(f, content);
    for (const [k, n] of Object.entries(row.reward_resources!)) totals[k] = (totals[k] ?? 0) + n;
    totals.cards! += row.bronze_card_count;
    if (f in examples) assert.deepEqual([row.gold, row.reward_resources!.hero_exp, row.crystal, row.bronze_card_count], examples[f as keyof typeof examples]);
  }
  assert.deepEqual(totals, { cards:15, gold:1940000, hero_exp:1525000, skill_manual:1504, refine_ore:1963, enchant_dust:1051, crystal:2000 });
  assert.equal(towerRow(2, content).reward_resources!.refine_ore,11);
  assert.equal(towerRow(3, content).reward_resources!.enchant_dust,5);
  assert.equal(towerRow(101, content).gold,26750);
  assert.equal(towerRow(120, content).bronze_card_count,2);
  assert.throws(() => scheduledTowerRewards(Number.MAX_SAFE_INTEGER, towerData(content).reward_schedule!), /OVERFLOW/);
});

test('D187 only reward schedule/version/derived reward rows change; all enemies, curves and rules retain exact old values', () => {
  const now = structuredClone(content.documents['tower.json']) as any, old = structuredClone(before);
  delete now.reward_schedule; now.content_version = old.content_version;
  for (const row of now.floor_rows) { const previous = old.floor_rows.find(r => r.floor === row.floor)!; delete row.reward_resources; for (const k of ['gold','crystal','bronze_card_count'] as const) row[k] = previous[k]; }
  assert.deepEqual(now, old);
  const legacy = { ...content, documents: { ...content.documents, 'tower.json': before } } as unknown as typeof content;
  for (const floor of [1,5,20,21,100,101,1000]) assert.deepEqual(towerBoss(floor,content),towerBoss(floor,legacy));
  assert.deepEqual(towerRow(10,legacy),before.floor_rows[9]);
});

test('D187 content boundary rejects malformed/unknown/negative/fractional reward programs before play', () => {
  const schedule = towerData(content).reward_schedule!;
  for (const mutate of [
    (s:any) => { s.base.godmode = {base:1,linear:0}; },
    (s:any) => { s.base.gold.base = -1; }, (s:any) => { s.base.gold.linear = 1.5; },
    (s:any) => { s.base.gold.divisor = 0; }, (s:any) => { s.base.gold.surprise = 1; },
    (s:any) => { s.rotation = []; }, (s:any) => { s.milestones[0].every = 0; },
    (s:any) => { s.milestones[0].card_count = 0.5; }, (s:any) => { s.base.gold.base = Number.MAX_SAFE_INTEGER+1; },
  ]) {
    const bad = structuredClone(schedule); mutate(bad);
    assert.throws(() => validateTowerRewardSchedule(bad), /INVALID_TOWER_REWARD/);
    const bundle = structuredClone(raw); (bundle.documents['tower.json'] as any).reward_schedule = bad;
    const loaded = validateContent(bundle); assert.equal(loaded.ok,false);
    if (!loaded.ok) assert.ok(loaded.errors.some(e=>e.source==='tower.json'||e.code==='bundle_shape'));
  }
});

test('D187 migration retains old frontier/unpaid rewards and owned investments without paying old floors again', () => {
  const state = initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-27T00:00:00Z','2026-10-27',1);
  state.tower.highest_cleared_floor=20;
  const zero = Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])) as AccountState['wallet'];
  state.pending_rewards=[{claim_id:'tower_20',kind:'tower',resource_vector:{...zero,gold:400,crystal:10},items:[],content_version:content.manifest.content_version,reserved_at:'2026-10-27T00:00:00Z',source_keys:['tower:20'],status:'pending'}];
  const migrated = migrateAccountState(state,content).state;
  for (const key of ['tower','wallet','pending_rewards','inventory','paid_ledger','gacha'] as const) assert.deepEqual(migrated[key],state[key],key);
  const second = migrateAccountState(migrated,content).state;
  assert.deepEqual(second,migrated,'repeat migration gives no additional reward');
});

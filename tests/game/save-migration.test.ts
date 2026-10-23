import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import type { AccountState } from '../../src/contracts/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';
import { migrationSql } from '../../scripts/game/migrate-local-saves.ts';
import { content } from './combat-fixtures.ts';

const rules = new AccountCommandRules(), key = 'k'.repeat(40);
const zero = () => Object.fromEntries(['gold', 'hero_exp', 'skill_manual', 'refine_ore', 'breakthrough_essence', 'enchant_dust', 'card_dust', 'crystal'].map(k => [k, 0])) as AccountState['wallet'];
function oldSave() {
  const state = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);
  const main = state.roster[0]!; main.level = 20; main.primary_stats = { ...main.primary_stats, str: 21 }; main.unspent_status_points = 65; // old 5/level budget: 95 - 30
  state.paid_ledger.push({ entry_id: 'status_main', character_id: 'main', feature_id: 'status', skill_id: null, quantity: 30, cost_version: 'old', cost_versions: ['old'], paid_resources: zero(), refund_state: 'active', refund_command_id: null });
  for (const actor of state.roster) for (const progress of Object.values(actor.slot_progress)) delete (progress as { refine_failures?: number }).refine_failures;
  state.story.cleared_stage_ids = ['1-1', '9-9']; state.story.selected_farm_stage = '9-9';
  return state;
}

test('D-058 migration fills new fields, rebalances status budgets and drops dangling stages, then passes the server validator', () => {
  const { state, changes } = migrateAccountState(oldSave(), content), main = state.roster[0]!;
  assert.doesNotThrow(() => rules.validateAccount(state));
  assert.equal(main.unspent_status_points, 61); assert.equal(main.primary_stats.str, 21);
  assert.ok(Object.values(main.slot_progress).every(p => p.refine_failures === 0));
  assert.deepEqual(state.story.cleared_stage_ids, ['1-1']); assert.equal(state.story.selected_farm_stage, null); assert.equal(state.farm.rate_snapshot, null);
  assert.ok(changes.some(c => c.includes('9-9')) && changes.some(c => c.includes('unspent status')));
});

test('D-058 migration refunds status investments that exceed the new budget instead of keeping unfunded stats', () => {
  const save = oldSave(), main = save.roster[0]!; main.level = 10; main.primary_stats = { ...main.primary_stats, str: 27 }; save.paid_ledger[0]!.quantity = 45; main.unspent_status_points = 0;
  const { state } = migrateAccountState(save, content), after = state.roster[0]!;
  assert.doesNotThrow(() => rules.validateAccount(state));
  assert.equal(after.primary_stats.str, 1); assert.equal(after.unspent_status_points, 34); assert.equal(state.paid_ledger[0]!.refund_state, 'refunded');
});

test('D-058 migration SQL appends one signed revision per outdated save and skips current saves', () => {
  const id = '11111111-1111-4111-8111-111111111111', current = '22222222-2222-4222-8222-222222222222';
  const { sql, report } = migrationSql([
    { account_id: id, revision: 7, content_hash: 'a'.repeat(64), content_version: 'old', rules_version: 'old', state: oldSave() },
    { account_id: current, revision: 3, ...rules.versions, state: migrateAccountState(oldSave(), content).state },
  ], key);
  assert.deepEqual(report.map(r => r.to_revision ?? r.skipped), [8, 'already current']);
  const { state } = migrateAccountState(oldSave(), content), hash = createHash('sha256').update(rules.canonical(state)).digest('hex');
  const signature = createHmac('sha256', key).update(rules.canonical({ account_id: id, revision: 8, state_hash: hash, content_hash: rules.versions.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
  assert.ok(sql.startsWith('begin;') && sql.trimEnd().endsWith('commit;'));
  assert.ok(sql.includes(`'${id}', 8,`) && sql.includes(signature) && sql.includes(`where account_id = '${id}' and revision = 7`));
  assert.ok(!sql.includes(current));
  assert.throws(() => migrationSql([{ account_id: id, revision: 1, content_hash: 'a'.repeat(64), content_version: 'old', rules_version: 'old', state: { broken: true } }], key));
});


test('D141 socket migration releases only locked bindings across every actor and slot; originals and card investments survive idempotently', () => {
  const levels = [0, 4, 5, 9, 10, 14, 15], capacities = [0, 0, 1, 1, 2, 2, 3];
  const state = initializeAccount(content, {root_job_id:'mage',gender:'female'}, '2026-10-23T00:00:00Z', '2026-10-23', 1);
  state.roster.forEach((actor, i) => Object.entries(actor.slot_progress).forEach(([slot, p]) => {
    p.refine=levels[i]!;p.refine_failures=2;
    const definition=Object.values(content.items).find(item=>item.kind==='card'&&item.slot===slot)!;
    p.cards.forEach((_, index) => {const id=actor.character_id+'_'+slot+'_'+index;
      state.inventory.push({kind:'card',instance_id:id,definition_id:String(definition.id),rarity_id:cardRarity(String(definition.id),content),level:5,locked:index===2} as AccountState['inventory'][number]);p.cards[index]=id;
    });
  }));
  const before=structuredClone(state);assert.throws(()=>rules.validateAccount(state),/INVALID_CARD_ASSIGNMENT/);
  const migrated=migrateAccountState(state,content);assert.doesNotThrow(()=>rules.validateAccount(migrated.state));
  assert.deepEqual(state,before);assert.deepEqual(migrated.state.inventory,before.inventory);assert.deepEqual(migrated.state.wallet,before.wallet);assert.deepEqual(migrated.state.paid_ledger,before.paid_ledger);
  migrated.state.roster.forEach((actor,i)=>Object.entries(actor.slot_progress).forEach(([slot,p])=>{
    const old=before.roster[i]!.slot_progress[slot as keyof typeof actor.slot_progress];
    assert.deepEqual(p,{...old,cards:old.cards.map((id,index)=>index<capacities[i]!?id:null)});
    assert.equal(actor.level,before.roster[i]!.level);
  }));
  assert.equal(migrated.changes.filter(c=>c.includes('locked by Refine')).length,6*(3+3+2+2+1+1));
  const again=migrateAccountState(migrated.state,content);assert.deepEqual(again.state,migrated.state);assert.deepEqual(again.changes,[]);
});

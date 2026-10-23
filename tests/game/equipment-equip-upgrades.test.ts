import test from 'node:test';
import assert from 'node:assert/strict';
import { equipmentUpgrades } from '../../src/domain/build/equipment-upgrades.ts';
import { applyEquipmentCommand, validateInventory } from '../../src/domain/progression/equipment.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { previewSave } from '../../src/client/save-preview.ts';
import { equipmentUpgradeHints } from '../../src/client/equipment.ts';
import type { Command } from '../../src/contracts/index.ts';
import { content } from './combat-fixtures.ts';
import { equipmentUpgradesFixture, equipmentUpgradeGear } from './equipment-upgrades-fixture.ts';
const rules = new AccountCommandRules(), at = '2026-10-23T00:00:00.000Z';
const command = (character_id = 'main'): Command => ({ type: 'equipment.equip_upgrades', params: { character_id }, request_id: '11111111-1111-4111-8111-111111111111', expected_revision: 1, schema_version: 1, ...rules.versions });
const time: CommandTime = { server_at: at, now_ms: Date.parse(at), new_lease_at: at, last_ack_ms: 0, lease_expires_ms: 0, started_ms: 0, farm_from_ms: 0, stored_last_ack_ms: 0, stored_lease_ms: 0 };

test('equip-all uses exactly the existing six hints and keeps all payloads, investments, cards and other actors', () => {
  const state = equipmentUpgradesFixture(), before = structuredClone(state), hints = equipmentUpgrades(state, 'main', content);
  assert.equal(Object.keys(hints).length, 6); assert.deepEqual(hints, equipmentUpgradeHints(state, 'main'));
  assert.equal(hints.weapon, 'upgrade_weapon'); assert.equal(hints.head, 'upgrade_head');
  assert.deepEqual(state, before); validateInventory(state, content);
  assert.equal(applyEquipmentCommand(state, command() as never, content), 'EQUIPMENT_UPGRADES_ASSIGNED');
  const expected = structuredClone(before); Object.assign(expected.roster[0]!.equipment, hints);
  assert.deepEqual(state, expected); assert.deepEqual(equipmentUpgradeHints(state, 'main'), {});
  validateInventory(state, content);
});

test('tier outranks rarity; same-tier options/ties do not trigger changes and a full500 bag needs no extra capacity', () => {
  const state = equipmentUpgradesFixture(), main = state.roster[0]!;
  state.inventory.find(i => i.instance_id === main.equipment.weapon)!.rarity_id = 'supreme';
  state.inventory.find(i => i.instance_id === 'upgrade_weapon')!.rarity_id = 'common';
  const head = state.inventory.find(i => i.instance_id === 'upgrade_head')!;
  if (head.kind !== 'equipment') throw Error('fixture');
  state.inventory.push({ ...head, instance_id: 'equal_head', kind: 'equipment', training: false, options: [{ id: 'opt_hp', roll: 10000 }] });
  while (state.inventory.length < 500) state.inventory.push(equipmentUpgradeGear(`filler_${state.inventory.length}`, 'equipment_sword_1', 'common'));
  assert.equal(equipmentUpgrades(state, 'main', content).weapon, 'upgrade_weapon');
  assert.equal(equipmentUpgrades(state, 'main', content).head, 'upgrade_head');
  applyEquipmentCommand(state, command() as never, content); assert.equal(state.inventory.length, 500);
  assert.equal(state.roster[0]!.equipment.head, 'upgrade_head'); assert.equal(state.roster[0]!.equipment.weapon, 'upgrade_weapon');
});

test('single account command and optimistic preview match, grant nothing, and advance one receipt revision', () => {
  const state = equipmentUpgradesFixture(), before = structuredClone(state), cmd = command();
  assert.ok(rules.supports(cmd.type)); rules.parse(cmd); rules.validateAccount(state);
  const predicted = previewSave(state, cmd, content), result = rules.decide(cmd, state, null, time, 'a'.repeat(64));
  assert.equal(result.receipt.outcome, 'committed'); assert.equal(result.receipt.committed_revision, 2);
  assert.equal(result.receipt.result.code, 'EQUIPMENT_UPGRADES_ASSIGNED'); assert.deepEqual(result.state, predicted);
  assert.ok(Object.values(result.receipt.result.resource_delta).every(n => n === 0));
  assert.deepEqual(result.receipt.result.created_instance_ids, []); assert.deepEqual(result.receipt.result.removed_instance_ids, []);
  assert.equal(result.battle_write.kind, 'keep'); assert.deepEqual(state, before); rules.validateAccount(result.state);
});

test('no upgrades/missing actor/battle reject without partial changes; client cannot supply arbitrary item IDs', () => {
  const state = equipmentUpgradesFixture(); applyEquipmentCommand(state, command() as never, content); const before = structuredClone(state);
  assert.throws(() => applyEquipmentCommand(state, command() as never, content), /NO_EQUIPMENT_UPGRADES/); assert.deepEqual(state, before);
  assert.throws(() => applyEquipmentCommand(state, command('missing') as never, content), /CHARACTER_NOT_FOUND/); assert.deepEqual(state, before);
  state.active_battle = {} as NonNullable<typeof state.active_battle>;
  const locked = structuredClone(state); assert.throws(() => applyEquipmentCommand(state, command() as never, content), /BUILD_LOCKED_DURING_BATTLE/); assert.deepEqual(state, locked);
  assert.equal(previewSave(state, command(), content), null);
  assert.throws(() => rules.parse({ ...command(), params: { character_id: 'main', item_instance_ids: ['npc_owned'] } }));
});

test('choosing an off-team companion equips only that companion and never transfers slot investments', () => {
  const state = equipmentUpgradesFixture(), npc = state.roster.find(a => a.character_id === 'npc_swordsman')!, before = structuredClone(state);
  state.team.find(p => p.character_id === npc.character_id)!.character_id = 'npc_mage'; before.team = structuredClone(state.team);
  const hints = equipmentUpgrades(state, npc.character_id, content);
  assert.ok(Object.keys(hints).length > 0); assert.equal(hints.weapon, undefined); // NPC's Supreme20 already beats the unassigned Epic20.
  applyEquipmentCommand(state, command(npc.character_id) as never, content);
  const expected = structuredClone(before); Object.assign(expected.roster.find(a => a.character_id === npc.character_id)!.equipment, hints);
  assert.deepEqual(state, expected);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { prepareCloudTransfer, cloudProjectRef } from '../../scripts/game/prepare-cloud-transfer.ts';
import { signTransferContext, targetOwner, transferContext, transferKey, transferTarget } from './cloud-transfer-fixtures.ts';

test('operator transfer preserves the complete state/revision and signs for the destination owner', () => {
  const context = transferContext(), before = structuredClone(context), rules = new AccountCommandRules();
  const output = prepareCloudTransfer(context, transferKey, transferTarget);
  const expected = createHmac('sha256', transferKey).update(rules.canonical({ account_id: targetOwner, revision: context.save!.revision, state_hash: context.save!.state_hash, content_hash: context.save!.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
  assert.equal(output.signature, expected); assert.notEqual(output.signature, context.history!.signature);
  assert.equal(output.report.state_hash, context.save!.state_hash); assert.equal(output.report.source_revision, context.save!.revision);
  assert.deepEqual(context, before); assert.ok(!output.sql.includes(transferKey));
  assert.ok(output.sql.includes(JSON.stringify(context.save!.state)), 'full state is embedded exactly, including ledger/RNG/AFK/pending rewards and quote characters');
});

test('tampered or incomplete source tips and wrong signing keys fail closed', () => {
  const badState = transferContext(); (badState.save!.state as { wallet: { gold: number } }).wallet.gold++;
  assert.throws(() => prepareCloudTransfer(badState, transferKey, transferTarget), /SOURCE_HASH_INVALID/);
  const badHistory = transferContext(); badHistory.history!.revision++;
  assert.throws(() => prepareCloudTransfer(badHistory, transferKey, transferTarget), /SOURCE_TIP_INVALID/);
  const badSignature = transferContext(); badSignature.history!.signature = 'wrong';
  assert.throws(() => prepareCloudTransfer(badSignature, transferKey, transferTarget), /SOURCE_SIGNATURE_INVALID/);
  assert.throws(() => prepareCloudTransfer(transferContext(), 'x'.repeat(48), transferTarget), /SOURCE_SIGNATURE_INVALID/);
  assert.throws(() => prepareCloudTransfer({ ...transferContext(), history: null }, transferKey, transferTarget), /SOURCE_TIP_INVALID/);
});

test('validly signed incompatible data, malformed state, and unfinished battles are rejected', () => {
  const version = transferContext(); version.save!.content_hash = 'e'.repeat(64); signTransferContext(version);
  assert.throws(() => prepareCloudTransfer(version, transferKey, transferTarget), /SOURCE_CONTENT_MISMATCH/);
  const broken = transferContext(); (broken.save!.state as { wallet: { gold: number } }).wallet.gold = -1; signTransferContext(broken);
  assert.throws(() => prepareCloudTransfer(broken, transferKey, transferTarget), /SOURCE_STATE_INVALID/);
  const battle = transferContext(); battle.battle = { account_id: battle.save!.account_id, battle_id: transferTarget.request_id, payload: {}, content_hash: battle.save!.content_hash, last_ack_at: battle.server_at, lease_expires_at: battle.server_at };
  assert.throws(() => prepareCloudTransfer(battle, transferKey, transferTarget), /FINISH_OR_RETREAT_BATTLE_BEFORE_TRANSFER/);
});

test('destination is an exact HTTPS Supabase project and UUIDs are normalized', () => {
  for (const url of ['http://abcdefghijklmnopqrst.supabase.co', 'https://abcdefghijklmnopqrst.supabase.co.evil.invalid', 'https://user:pass@abcdefghijklmnopqrst.supabase.co', 'https://abcdefghijklmnopqrst.supabase.co/path', 'https://abcdefghijklmnopqrst.supabase.co?token=x', "https://x';drop.supabase.co"]) assert.throws(() => cloudProjectRef(url), /INVALID_TARGET_PROJECT_URL/);
  const output = prepareCloudTransfer(transferContext(), transferKey, { ...transferTarget, account_id: targetOwner.toUpperCase() });
  assert.equal(output.report.target_account_id, targetOwner);
  assert.throws(() => prepareCloudTransfer(transferContext(), transferKey, { ...transferTarget, account_id: "'; drop table x;" }), /INVALID_TARGET_ID/);
});

import { createHash, createHmac } from 'node:crypto';
import type { Command } from '../../src/contracts/index.ts';
import type { SaveContext } from '../../src/contracts/save.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';

export const transferKey = 'cloud-transfer-fixture-signing-key-'.repeat(2);
export const sourceOwner = '11111111-1111-4111-8111-111111111111';
export const targetOwner = 'abcdefab-1234-4567-89ab-1234567890ab';
export const transferRequest = '33333333-3333-4333-8333-333333333333';
export const transferProject = 'abcdefghijklmnopqrst';
export const transferTarget = { account_id: targetOwner, project_url: `https://${transferProject}.supabase.co`, request_id: transferRequest };
const rules = new AccountCommandRules();
export const transferHash = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
export function signTransferContext(context: SaveContext): SaveContext {
  const save = context.save!, history = context.history!;
  save.state_hash = transferHash(save.state); history.state = structuredClone(save.state); history.state_hash = save.state_hash;
  history.signature = createHmac('sha256', transferKey).update(rules.canonical({ account_id: save.account_id, revision: save.revision, state_hash: save.state_hash, content_hash: save.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
  return context;
}
/** Funded synthetic progression, never a personal player's save or earned-income proof. */
export function transferContext(): SaveContext {
  const at = '2026-10-20T05:00:00.000Z', now = Date.parse(at);
  let state = equipStarterSet(initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, at, '2026-10-20', 7));
  for (const key of Object.keys(state.wallet) as (keyof typeof state.wallet)[]) state.wallet[key] = 1_000_000;
  state.story.cleared_stage_ids = storyStages(content).slice(0, 12).map(stage => stage.id);
  state.story.selected_farm_stage = '1-1'; state.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, state, content);
  let revision = 20;
  for (const [type, params] of [['character.level_up', { character_id: 'main', target_level: 8 }], ['skill.upgrade', { character_id: 'main', skill_id: 'mage_fire_bolt', target_level: 2 }], ['slot.refine', { character_id: 'main', slot: 'weapon', target_level: 1 }]] as const) {
    const command = { type, params, request_id: transferRequest, expected_revision: revision++, ...rules.versions, schema_version: 1 } as Command;
    const proposal = rules.decide(command, state, null, { server_at: at, now_ms: now, new_lease_at: new Date(now + 15_000).toISOString(), last_ack_ms: now, lease_expires_ms: now + 15_000, started_ms: now, farm_from_ms: now, stored_last_ack_ms: now, stored_lease_ms: now + 15_000 }, transferHash(command));
    if (proposal.receipt.outcome !== 'committed') throw new Error(`INVALID_TRANSFER_FIXTURE_${proposal.receipt.result.code}`);
    state = proposal.state;
  }
  const zero = Object.fromEntries(Object.keys(state.wallet).map(k => [k, k === 'gold' ? 5 : 0])) as typeof state.wallet;
  state.pending_rewards.push({ claim_id: 'fixture_cloud_pending', kind: 'farm', resource_vector: zero, items: [], content_version: rules.versions.content_version, reserved_at: at, source_keys: ["fixture: $import$ $$ '; DROP TABLE public.game_saves; --"], status: 'pending' });
  rules.validateAccount(state);
  return signTransferContext({ server_at: at, battle: null, save: { account_id: sourceOwner, revision, schema_version: 1, ...rules.versions, state, state_hash: '', updated_at: at }, history: { account_id: sourceOwner, revision, state, state_hash: '', signature: '', key_version: 1, created_at: at } });
}

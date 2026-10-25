// TASK-040 backup/export/import/reset/migration/recovery through the real API handler and an
// in-memory store that mirrors game_commit_maintenance (backup-before-write, revision CAS, receipt replay).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { createRecurringHandlers } from '../../api/index.ts';
import type { AccountState, Command, Receipt } from '../../src/contracts/index.ts';
import type { CommandCommit, MaintenanceCommit, SaveContext, StoredBackup, StoredBattle, StoredHistory, StoredSave } from '../../src/contracts/save.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { backupCompat, backupFile, backupRelation, parseBackupFile, saveSummary } from '../../src/domain/build/save-summary.ts';
import { SaveController, SaveProtocolError, type SavePorts, type SaveBackup } from '../../src/client/save-controller.ts';
import { content } from './combat-fixtures.ts';
import { dailyBoss, dailyPhaseStats } from '../../src/domain/modes/daily.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';

const rules = new AccountCommandRules(), key = 'k'.repeat(48), id = '11111111-1111-4111-8111-111111111111', other = '99999999-9999-4999-8999-999999999999';
const sha = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
const sign = (account: string, revision: number, stateHash: string, contentHash = rules.versions.content_hash, schema = 1) => createHmac('sha256', key).update(rules.canonical({ account_id: account, revision, state_hash: stateHash, content_hash: contentHash, schema_version: schema, key_version: 1 })).digest('base64url');
const OLD = 'c'.repeat(64);
const start = Date.parse('2026-10-20T05:00:00.000Z'), hour = 3600000;

/** One account's rows; maintenance mirrors supabase/migrations/202610200006_save_backups.sql. */
function stack(state: AccountState, versions: Partial<StoredSave> = {}, account = id) {
  let now = start, serial = 0, battle: StoredBattle | null = null;
  const versionRow = { schema_version: 1, ...rules.versions, ...versions };
  let save: StoredSave = { account_id: account, revision: 1, ...versionRow, state_hash: sha(state), state: structuredClone(state), updated_at: new Date(now).toISOString() };
  const history = new Map<number, StoredHistory>([[1, { account_id: account, revision: 1, state: structuredClone(state), state_hash: sha(state), signature: sign(account, 1, sha(state), versionRow.content_hash, versionRow.schema_version), key_version: 1, created_at: save.updated_at }]]);
  const backups: StoredBackup[] = [], receipts = new Map<string, { request_hash: string; receipt: Receipt }>();
  const clockReceipts: Receipt[] = [];
  const store = {
    async dailyClockReceipts() { return structuredClone([...clockReceipts, ...[...receipts.values()].map(r => r.receipt)]); },
    async loadContext(): Promise<SaveContext> { return structuredClone({ server_at: new Date(now).toISOString(), save, history: history.get(save.revision) ?? null, battle }); },
    async readCreationReceipt(_: unknown, requestId: string) { return structuredClone(receipts.get(requestId) ?? null); },
    async commitCommand(input: CommandCommit) {
      if (input.expected_revision !== save.revision) return { data: null, error: { message: 'REVISION_CONFLICT' } };
      if (input.receipt.outcome === 'committed') {
        save = { ...save, revision: input.receipt.committed_revision, state: structuredClone(input.state), state_hash: input.state_hash };
        history.set(save.revision, { account_id: account, revision: save.revision, state: structuredClone(input.state), state_hash: input.state_hash, signature: input.signature, key_version: 1, created_at: input.receipt.server_at });
        if (input.battle_write.kind === 'upsert') battle = structuredClone(input.battle_write.battle); else if (input.battle_write.kind === 'delete') battle = null;
      }
      receipts.set(input.request_id, { request_hash: input.request_hash, receipt: input.receipt }); return { data: input.receipt, error: null };
    },
    async commitMaintenance(input: MaintenanceCommit) {
      const prior = receipts.get(input.request_id); if (prior) return prior.request_hash === input.request_hash ? { data: prior.receipt, error: null } : { data: null, error: { message: 'IDEMPOTENCY_KEY_REUSE' } };
      if (input.expected_revision !== save.revision) return { data: null, error: { message: 'REVISION_CONFLICT' } };
      if (input.receipt.committed_revision !== save.revision + 1 || input.receipt.outcome !== 'committed') return { data: null, error: { message: 'INVALID_MAINTENANCE_COMMIT' } };
      const tip = history.get(save.revision), matches = !!tip && tip.state_hash === save.state_hash && rules.canonical(tip.state) === rules.canonical(save.state);
      backups.push({ account_id: account, backup_id: input.backup_id, reason: input.reason, revision: save.revision, schema_version: save.schema_version, content_version: save.content_version, rules_version: save.rules_version, content_hash: save.content_hash, state: structuredClone(save.state), state_hash: save.state_hash, signature: matches ? tip!.signature : null, key_version: matches ? 1 : null, created_at: new Date(now + backups.length).toISOString() });
      battle = null;
      save = { account_id: account, revision: save.revision + 1, schema_version: input.schema_version, content_version: input.content_version, rules_version: input.rules_version, content_hash: input.content_hash, state: structuredClone(input.state), state_hash: input.state_hash, updated_at: input.receipt.server_at };
      history.set(save.revision, { account_id: account, revision: save.revision, state: structuredClone(input.state), state_hash: input.state_hash, signature: input.signature, key_version: input.key_version, created_at: input.receipt.server_at });
      receipts.set(input.request_id, { request_hash: input.request_hash, receipt: input.receipt }); return { data: input.receipt, error: null };
    },
    async listBackups() { return structuredClone([...backups].reverse()); },
  };
  const api = createRecurringHandlers(store as never, key), identity = { account_id: account } as never;
  function command(type: string, params: unknown, revision = save.revision, requestId?: string) {
    return { type, params, request_id: requestId ?? `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command;
  }
  async function send(type: string, params: unknown, revision?: number, requestId?: string) { now += 1000; const reply = await api.command(identity, command(type, params, revision, requestId)); return reply as { status: number; body: { receipt?: Receipt; code?: string } }; }
  return {
    api, identity, send, command, backups, history, clockReceipts, receipts,
    get save() { return save; }, get state() { return save.state as AccountState; }, get now() { return now; },
    advance(ms: number) { now += ms; },
    corrupt(edit: (s: AccountState) => void) { const s = structuredClone(save.state) as AccountState; edit(s); save = { ...save, state: s }; },
    checkpoint() { return api.checkpoint(identity) as Promise<{ status: number; body: Record<string, unknown> }>; },
    backupsReply(backupId: string | null = null) { return api.backups(identity, backupId) as Promise<{ status: number; body: Record<string, unknown> }>; },
  };
}
function progressed(): AccountState {
  const s = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, new Date(start).toISOString(), '2026-10-20', 7);
  s.story.cleared_stage_ids = storyStages(content).slice(0, 12).map(stage => stage.id); s.story.selected_farm_stage = '1-1'; s.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, s, content);
  s.wallet.gold = 40000; s.wallet.crystal = 900; s.wallet.hero_exp = 20000; s.wallet.skill_manual = 300; s.wallet.refine_ore = 50;
  s.inventory.push({ instance_id: 'blade', definition_id: 'equipment_sword_1', kind: 'equipment', rarity_id: 'rare', locked: true, training: false, options: [{ id: 'opt_atk', roll: 700 }] });
  return s;
}
async function grown() {
  const f = stack(progressed());
  for (const [type, params] of [['character.level_up', { character_id: 'main', target_level: 8 }], ['character.level_up', { character_id: 'npc_swordsman', target_level: 6 }], ['equipment.equip', { character_id: 'npc_swordsman', slot: 'weapon', item_instance_id: 'blade' }], ['slot.refine', { character_id: 'npc_swordsman', slot: 'weapon', target_level: 1 }], ['skill.upgrade', { character_id: 'main', skill_id: 'mage_fire_bolt', target_level: 2 }], ['shop.buy', { offer_id: 'ore_pack', quantity: 5 }]] as const)
    { const r = await f.send(type, params); assert.equal(r.body.receipt?.outcome, 'committed', `${type} commits ${r.body.code ?? r.body.receipt?.result.code}`); }
  return f;
}
const kept = (s: AccountState) => ({ roster: s.roster, inventory: s.inventory, wallet: s.wallet, story: s.story, tower: s.tower, team: s.team, paid_ledger: s.paid_ledger });

function migrationClient(f: ReturnType<typeof stack>, pending: Command) {
  let backup: SaveBackup = { checkpoint: null, pending: structuredClone(pending) }, sends = 0;
  const ports: SavePorts = {
    async checkpoint() { const r = await f.checkpoint(); if (r.status !== 200) throw new SaveProtocolError(String(r.body.code), r.status, r.body); return r.body.checkpoint as never; },
    async receipt(request) { return f.receipts.get(request)?.receipt ?? null; },
    async send(command) { sends++; const r = await f.api.command(f.identity, command); if (r.status !== 200) throw new SaveProtocolError((r.body as { code: string }).code, r.status, r.body); return (r.body as { receipt: Receipt }).receipt; },
    load() { return structuredClone(backup); }, store(_, value) { backup = structuredClone(value); },
    async lock() { return () => {}; }, requestId() { return '88888888-8888-4888-8888-888888888888'; },
  };
  return { ports, get backup() { return backup; }, get sends() { return sends; } };
}
function migrateCommand(f: ReturnType<typeof stack>) { return f.command('save.migrate', { from_revision: f.save.revision, from_content_hash: OLD }); }

test('a committed boss-start receipt releases the pending gate even when the next checkpoint requires migration', async () => {
  const f = stack(progressed()), command = f.command('battle.start_story', { stage_id: '1-1' });
  const reply = await f.api.command(f.identity, command); assert.equal(reply.status, 200); assert.ok(f.state.active_battle);
  f.save.content_hash = OLD; f.history.get(f.save.revision)!.signature = sign(id, f.save.revision, f.save.state_hash, OLD);
  const before = structuredClone(f.state), p = migrationClient(f, command), controller = new SaveController(p.ports);
  await controller.start(id); assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED'); assert.equal(controller.snapshot.pending, null); assert.equal(p.backup.pending, null); assert.equal(p.sends, 0);
  await controller.maintain(migrateCommand(f)); assert.equal(controller.snapshot.status, 'ready'); assert.equal(f.backups.length, 1); assert.deepEqual(f.backups[0]!.state, before); assert.deepEqual(kept(f.state), kept(before)); assert.equal(f.state.active_battle, null); assert.equal(p.sends, 1); controller.dispose();
});

test('absent old/current-version intents refused by the version gate are archived before migration and never replayed on new rules', async () => {
  for (const oldRequest of [true, false]) {
    const f = stack(progressed(), { content_hash: OLD }), command = f.command('battle.start_story', { stage_id: '1-1' }); if (oldRequest) command.content_hash = OLD;
    const before = structuredClone(f.state), p = migrationClient(f, command), controller = new SaveController(p.ports); await controller.start(id);
    assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED'); assert.equal(controller.snapshot.pending, null); assert.deepEqual(p.backup.rejectedForUpdate, command); assert.equal(f.receipts.size, 0); assert.equal(p.sends, 1);
    await controller.maintain(migrateCommand(f)); assert.equal(controller.snapshot.status, 'ready'); assert.deepEqual(f.backups[0]!.state, before); assert.deepEqual(kept(f.state), kept(before)); assert.equal(f.state.active_battle, null);
    assert.deepEqual(p.backup.rejectedForUpdate, command); await controller.reconnect(false); assert.equal(p.sends, 2); assert.equal(f.receipts.size, 1); controller.dispose();
  }
});

test('uncertain receipt/network failures keep the original intent; retry can settle it before migration', async () => {
  const f = stack(progressed(), { content_hash: OLD }), command = f.command('battle.start_story', { stage_id: '1-1' }), p = migrationClient(f, command), controller = new SaveController(p.ports), receipt = p.ports.receipt;
  p.ports.receipt = async () => { throw new SaveProtocolError('NETWORK_UNAVAILABLE'); }; await controller.start(id);
  assert.equal(controller.snapshot.status, 'offline'); assert.deepEqual(p.backup.pending, command); assert.equal(p.backup.rejectedForUpdate, undefined); assert.equal(p.sends, 0);
  p.ports.receipt = receipt; await controller.reconnect(); assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED'); assert.equal(controller.snapshot.pending, null); await controller.maintain(migrateCommand(f)); assert.equal(controller.snapshot.status, 'ready'); controller.dispose();
});

test('a version refusal on a live write transitions to the migration preview instead of keeping saving/pending locked', async () => {
  const f = stack(progressed()), command = f.command('party.set', { placements: f.state.team }), p = migrationClient(f, command);
  p.ports.load = () => null; const controller = new SaveController(p.ports); await controller.start(id); assert.equal(controller.snapshot.status, 'ready');
  f.save.content_hash = OLD; f.history.get(f.save.revision)!.signature = sign(id, f.save.revision, f.save.state_hash, OLD);
  await controller.submit(command); assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED'); assert.equal(controller.snapshot.pending, null); assert.deepEqual(p.backup.rejectedForUpdate, command);
  await controller.maintain(migrateCommand(f)); assert.equal(controller.snapshot.status, 'ready'); assert.equal(f.backups.length, 1); controller.dispose();
});

test('a migration preview older than the recovered receipt cannot discard its pending revision barrier', async () => {
  const f = stack(progressed()), command = f.command('party.set', { placements: f.state.team }); await f.api.command(f.identity, command);
  const p = migrationClient(f, command), controller = new SaveController(p.ports); p.ports.checkpoint = async () => { throw new SaveProtocolError('SAVE_MIGRATION_REQUIRED', 409, { migration: { from_revision: 1 } }); };
  await controller.start(id); assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED'); assert.deepEqual(p.backup.pending, command); await assert.rejects(controller.maintain(migrateCommand(f)), /WRITER_NOT_READY/); controller.dispose();
});

test('a storage failure cannot silently drop a version-refused pending intent or strand saving', async () => {
  const f = stack(progressed(), { content_hash: OLD }), command = f.command('battle.start_story', { stage_id: '1-1' }), p = migrationClient(f, command), store = p.ports.store;
  p.ports.store = (account, backup) => { if (backup.rejectedForUpdate) throw Error('BACKUP_UNAVAILABLE'); store(account, backup); };
  const controller = new SaveController(p.ports); await controller.start(id); assert.equal(controller.snapshot.status, 'offline'); assert.deepEqual(p.backup.pending, command); assert.equal(p.backup.rejectedForUpdate, undefined); controller.dispose();
});

test('a checkpoint version validation error after a possible commit is not mistaken for a server refusal', async () => {
  const f = stack(progressed()), command = f.command('party.set', { placements: f.state.team }), p = migrationClient(f, command); p.ports.load = () => null;
  const controller = new SaveController(p.ports); await controller.start(id); p.ports.send = async () => { throw new SaveProtocolError('CONTENT_VERSION_MISMATCH', 409); };
  await controller.submit(command); assert.deepEqual(p.backup.pending, command); assert.equal(p.backup.rejectedForUpdate, undefined); assert.equal(controller.snapshot.status, 'incompatible'); controller.dispose();
});

test('T040 AC-01: export → reset → restore brings back the same characters, NPCs, items and slot progress', async () => {
  const f = await grown(), before = structuredClone(f.state), checkpoint = await f.checkpoint();
  assert.equal(checkpoint.status, 200, 'healthy checkpoint');
  const c = checkpoint.body.checkpoint as { save: StoredSave; history: StoredHistory }, file = backupFile(c.save, c.history, new Date(f.now).toISOString());
  const parsed = parseBackupFile(JSON.parse(JSON.stringify(file))); assert.ok(parsed.ok, 'exported file parses');
  assert.equal(file.save.signature, c.history.signature, 'file carries the signed tip'); assert.ok(!JSON.stringify(file).includes(key), 'no secrets');
  const reset = await f.send('account.reset', { root_job_id: 'thief', gender: 'male', confirm: 'RESET' });
  assert.equal(reset.body.receipt?.result.code, 'ACCOUNT_RESET'); assert.equal(f.state.roster.find(a => a.character_id === 'main')!.job_id, 'thief'); assert.equal(f.state.story.cleared_stage_ids.length, 0);
  assert.equal(f.backups.at(-1)!.reason, 'reset'); assert.equal(f.backups.at(-1)!.signature, c.history.signature, 'backup keeps the signed tip');
  const list = (await f.backupsReply()).body.backups as { backup_id: string; restorable: boolean; signature: string | null; summary: unknown }[];
  assert.equal(list.length, 1); assert.ok(list[0]!.restorable && list[0]!.signature, 'pre-reset backup is restorable'); assert.deepEqual(list[0]!.summary, saveSummary(before));
  const download = (await f.backupsReply(list[0]!.backup_id)).body.file; assert.ok(parseBackupFile(download).ok, 'server backup downloads as a file');
  const restored = await f.send('backup.restore_request', { checkpoint_id: `backup:${list[0]!.backup_id}`, signature: list[0]!.signature });
  assert.equal(restored.body.receipt?.result.code, 'BACKUP_RESTORED'); assert.equal(f.save.revision, c.save.revision + 2, 'restore is a new revision, never a rewind');
  assert.deepEqual(kept(f.state), kept(before), 'characters/NPCs/items/slots/wallet restored exactly');
  assert.equal(f.state.roster.find(a => a.character_id === 'npc_swordsman')!.slot_progress.weapon.refine, before.roster.find(a => a.character_id === 'npc_swordsman')!.slot_progress.weapon.refine);
  assert.equal(f.backups.at(-1)!.reason, 'restore', 'the replaced new game is itself backed up');
  assert.equal((await f.checkpoint()).status, 200, 'restored save loads');
});

test('T040 AC-02: an older signed save is previewed then migrated with a backup; unsupported or broken saves are never changed', async () => {
  const legacy = progressed() as unknown as Record<string, unknown> & AccountState;
  delete (legacy as Partial<AccountState>).shop; delete (legacy.gacha as Partial<AccountState['gacha']>).equipment_v1; delete (legacy.inventory[0] as { options?: unknown }).options;
  const f = stack(legacy, { content_hash: OLD });
  const preview = await f.checkpoint(); assert.equal(preview.status, 409); assert.equal(preview.body.code, 'SAVE_MIGRATION_REQUIRED');
  const migration = preview.body.migration as { from_revision: number; from_content_hash: string; changes: string[]; before: unknown; after: unknown };
  assert.equal(migration.from_content_hash, OLD); assert.ok(migration.changes.some(c => c.includes('option line')), 'preview lists the option backfill'); assert.deepEqual(migration.after, saveSummary(rules.migrateSave(legacy).state));
  assert.equal(f.backups.length, 0, 'preview writes nothing');
  assert.equal((await f.send('save.migrate', { from_revision: 1, from_content_hash: 'd'.repeat(64) })).body.code, 'MIGRATION_SOURCE_MISMATCH');
  const done = await f.send('save.migrate', { from_revision: 1, from_content_hash: OLD });
  assert.equal(done.body.receipt?.result.code, 'SAVE_MIGRATED'); assert.equal(f.save.content_hash, rules.versions.content_hash); assert.equal(f.save.revision, 2);
  assert.equal(f.backups[0]!.reason, 'migration'); assert.equal(f.backups[0]!.content_hash, OLD); assert.equal(f.backups[0]!.state_hash, sha(legacy)); assert.ok(f.backups[0]!.signature, 'backup keeps its old signature');
  assert.equal((await f.checkpoint()).status, 200, 'migrated save loads'); assert.equal((await f.send('save.migrate', { from_revision: 2, from_content_hash: OLD })).body.code, 'SAVE_ALREADY_CURRENT');
  // A newer schema is read-only; an unknown definition blocks migration; neither writes.
  const newer = stack(progressed(), { schema_version: 2, content_hash: OLD });
  assert.equal((await newer.checkpoint()).body.code, 'UPDATE_REQUIRED'); assert.equal((await newer.send('save.migrate', { from_revision: 1, from_content_hash: OLD })).body.code, 'UPDATE_REQUIRED');
  const unknown = progressed(); unknown.inventory[0]!.definition_id = 'equipment_retired_99';
  const blocked = stack(unknown, { content_hash: OLD }), frozen = structuredClone(blocked.save);
  assert.equal((await blocked.checkpoint()).body.code, 'MIGRATION_UNSUPPORTED'); assert.equal((await blocked.send('save.migrate', { from_revision: 1, from_content_hash: OLD })).body.code, 'MIGRATION_UNSUPPORTED');
  assert.deepEqual(blocked.save, frozen, 'unsupported save untouched'); assert.equal(blocked.backups.length, 0);
  // Broken/foreign files are rejected by the reader and never reach a command.
  for (const bad of [null, { format: 'other' }, { format: 'ro-idle-classic-backup', format_version: 9 }, { format: 'ro-idle-classic-backup', format_version: 1, save: { account_id: id } }]) assert.equal(parseBackupFile(bad).ok, false, JSON.stringify(bad));
});

test('T040 AC-03 + D-085: new game clears daily dungeons; restore guards AFK/shop/daily counters and restores once', async () => {
  const f = await grown(); f.advance(2 * hour);
  assert.equal((await f.send('farm.claim', {})).body.receipt?.result.code, 'FARM_RESERVED'); const cursor = f.state.farm.reserved_through;
  assert.equal((await f.send('battle.start_daily', { boss_id: 'treasury' })).body.receipt?.result.code, 'DAILY_STARTED');
  assert.equal((await f.send('battle.retreat', { battle_id: f.state.active_battle!.battle_id })).body.receipt?.result.code, 'DAILY_RETREATED');
  f.advance(5 * hour); // the old save's cursor stays 5h behind the reset
  assert.equal((await f.send('account.reset', { root_job_id: 'mage', gender: 'female', confirm: 'RESET' }, f.save.revision - 1)).body.code, 'REVISION_CONFLICT');
  await f.send('account.reset', { root_job_id: 'mage', gender: 'female', confirm: 'RESET' });
  assert.equal(f.state.shop.purchases.ore_pack, 5, 'today\'s shop limit survives a reset'); assert.ok(f.state.farm.reserved_through > cursor);
  assert.equal(f.state.daily_records.slice().length, 0, 'a new game starts daily dungeons fresh (D-085)');
  f.advance(3 * hour);
  const list = (await f.backupsReply()).body.backups as { backup_id: string; signature: string }[], target = list[0]!;
  assert.equal((await f.send('backup.restore_request', { checkpoint_id: `backup:${target.backup_id}`, signature: 'x'.repeat(43) })).body.code, 'BACKUP_SIGNATURE_INVALID');
  assert.equal((await f.send('backup.restore_request', { checkpoint_id: 'backup:00000000-0000-4000-8000-000000000000', signature: target.signature })).body.code, 'BACKUP_NOT_RESTORABLE');
  const resetCursor = f.state.farm.reserved_through;
  await f.send('backup.restore_request', { checkpoint_id: `backup:${target.backup_id}`, signature: target.signature });
  assert.equal(f.state.farm.reserved_through, resetCursor, 'restored AFK cursor never moves back before the reset');
  const before = f.state.wallet.gold, claim = await f.send('farm.claim', {}), rate = f.state.farm.rate_snapshot!.per_hour.gold;
  const paid = f.state.pending_rewards.filter(c => c.kind === 'farm').reduce((n, c) => n + c.resource_vector.gold, 0) - (structuredClone(f.backups.at(-2)!.state) as AccountState).pending_rewards.filter(c => c.kind === 'farm').reduce((n, c) => n + c.resource_vector.gold, 0);
  assert.equal(claim.body.receipt?.result.code, 'FARM_RESERVED'); assert.ok(paid <= Math.ceil(rate * (3 * hour + 10000) / hour) && paid >= Math.floor(rate * 3), `only the 3h post-reset window is paid, not the 8h since the old cursor (${paid})`);
  assert.equal(f.state.daily_records.find(r => r.boss_id === 'treasury')!.attempts_used, 1, 'restore keeps the spent attempt'); assert.equal(f.state.shop.purchases.ore_pack, 5); assert.equal(f.state.wallet.gold, before, 'nothing paid before reward.claim');
  assert.equal((await f.send('backup.restore_request', { checkpoint_id: `backup:${target.backup_id}`, signature: target.signature })).body.code, 'BACKUP_NOT_RESTORABLE', 'a reset backup restores once (no spend/gacha reroll)');
  // Ownership: a different account cannot use these rows; the same request id replays without a second write.
  const stranger = stack(progressed(), {}, other); await stranger.send('account.reset', { root_job_id: 'mage', gender: 'female', confirm: 'RESET' });
  assert.equal((await stranger.send('backup.restore_request', { checkpoint_id: `backup:${target.backup_id}`, signature: target.signature })).body.code, 'BACKUP_NOT_RESTORABLE');
  const g = await grown(), request = '33333333-3333-4333-8333-000000000001', first = await g.send('account.reset', { root_job_id: 'archer', gender: 'male', confirm: 'RESET' }, undefined, request), revision = g.save.revision;
  const replay = await g.send('account.reset', { root_job_id: 'archer', gender: 'male', confirm: 'RESET' }, revision - 1, request);
  assert.deepEqual(replay.body.receipt, first.body.receipt); assert.equal(g.save.revision, revision); assert.equal(g.backups.length, 1);
});

test('T040 AC-03/04: a quarantined save is recovered only from its signed tip; a healthy save refuses recovery', async () => {
  const f = await grown(), tip = structuredClone(f.state), revision = f.save.revision;
  assert.equal((await f.send('backup.restore_request', { checkpoint_id: `history:${revision}`, signature: f.history.get(revision)!.signature })).body.code, 'RECOVERY_NOT_NEEDED');
  f.corrupt(s => { s.wallet.gold = 99999999; });
  const failure = await f.checkpoint(); assert.equal(failure.status, 503); assert.equal(failure.body.code, 'SAVE_INTEGRITY_FAILED');
  const source = failure.body.recovery as { checkpoint_id: string; signature: string; revision: number; summary: unknown };
  assert.equal(source.revision, revision); assert.deepEqual(source.summary, saveSummary(tip));
  assert.equal((await f.send('farm.claim', {})).body.code, 'SAVE_INTEGRITY_FAILED', 'no normal command on a quarantined save');
  assert.equal((await f.send('backup.restore_request', { checkpoint_id: source.checkpoint_id, signature: 'forged' })).body.code, 'RECOVERY_SOURCE_INVALID');
  const done = await f.send('backup.restore_request', { checkpoint_id: source.checkpoint_id, signature: source.signature });
  assert.equal(done.body.receipt?.result.code, 'SAVE_RECOVERED'); assert.deepEqual(kept(f.state), kept(tip), 'signed tip restored, edited gold discarded');
  assert.equal(f.backups.at(-1)!.reason, 'quarantine'); assert.equal(f.backups.at(-1)!.signature, null, 'the corrupt row is kept unsigned'); assert.equal((await f.checkpoint()).status, 200);
});

test('T040 AC-04: the client only sends maintenance writes the server asked for, and shows nothing until the receipt', async () => {
  let sent = 0; const ports: SavePorts = { checkpoint: async () => { throw new SaveProtocolError('SAVE_MIGRATION_REQUIRED', 409, { migration: { from_revision: 4 } }); }, receipt: async () => null, send: async (command) => { sent++; throw new SaveProtocolError('NETWORK_UNAVAILABLE'); void command; }, load: () => null, store: () => {}, lock: async () => () => {}, requestId: () => 'x' };
  const controller = new SaveController(ports); await controller.start(id);
  assert.equal(controller.snapshot.status, 'incompatible'); assert.equal(controller.snapshot.reason, 'SAVE_MIGRATION_REQUIRED');
  const migrate = (revision: number) => ({ type: 'save.migrate', params: { from_revision: revision, from_content_hash: OLD }, request_id: '44444444-4444-4444-8444-000000000001', expected_revision: revision, schema_version: 1, ...rules.versions }) as Command;
  await assert.rejects(controller.maintain(migrate(3)), /WRITER_NOT_READY/, 'revision must come from the server detail');
  await assert.rejects(controller.maintain({ ...migrate(4), type: 'account.reset', params: { root_job_id: 'mage', gender: 'female', confirm: 'RESET' } } as Command), /WRITER_NOT_READY/);
  await controller.maintain(migrate(4)); assert.equal(sent, 1); assert.equal(controller.snapshot.lastReceipt, null, 'no success without a receipt'); assert.notEqual(controller.snapshot.status, 'ready');
});

test('D-085: migrating an already-reset locked game clears only carried daily progress, with backup; unlocked games retain it', async () => {
  for (const unlocked of [false, true]) {
    const s = progressed();
    s.daily_records = [{ boss_id: 'treasury', ticket_day: '2026-10-20', attempts_used: 3, phase: 8, current_hp: 999, rewarded_phases: [1, 2, 3], chapter_snapshot: 2 }];
    if (!unlocked) { s.story.cleared_stage_ids = []; s.story.selected_farm_stage = null; s.farm.rate_snapshot = null; }
    const before = structuredClone(s), f = stack(s, { content_hash: OLD });
    const preview = await f.checkpoint(); assert.equal(preview.body.code, 'SAVE_MIGRATION_REQUIRED');
    assert.equal(f.backups.length, 0, 'preview does not reset the save');
    assert.equal((await f.send('save.migrate', { from_revision: 1, from_content_hash: OLD })).body.receipt?.result.code, 'SAVE_MIGRATED');
    assert.deepEqual(f.backups[0]!.state, before, 'exact pre-repair signed state retained');
    assert.deepEqual(kept(f.state), kept(before), 'characters/equipment/wallet/Story/Tower/farm/team untouched');
    assert.deepEqual(f.state.daily_records, unlocked ? before.daily_records : []);
    assert.equal((await f.checkpoint()).status, 200);
  }
});

test('T040 AC-05: compatibility matrix — current/older/newer/unknown/cost-version fixtures migrate, reject or refund exactly', async () => {
  const file = (state: AccountState, versions: Partial<StoredSave>) => backupFile({ account_id: id, revision: 3, schema_version: 1, ...rules.versions, ...versions, state_hash: sha(state), state } as never, { signature: 's', key_version: 1 }, '2026-10-20T00:00:00.000Z');
  assert.equal(backupCompat(file(progressed(), {}), rules.versions), 'current'); assert.equal(backupCompat(file(progressed(), { content_hash: OLD }), rules.versions), 'migratable'); assert.equal(backupCompat(file(progressed(), { schema_version: 2 }), rules.versions), 'unsupported');
  assert.equal(backupRelation(file(progressed(), {}), { account_id: id, revision: 5, state_hash: 'x' }), 'older'); assert.equal(backupRelation(file(progressed(), {}), { account_id: other, revision: 3, state_hash: 'x' }), 'other_account');
  assert.equal(backupRelation(file(progressed(), {}), { account_id: id, revision: 3, state_hash: 'y'.repeat(64) }), 'diverged');
  // Cost v1 → v2: a skill bought at an older price refunds exactly what was paid after migration, never the new price.
  const f = stack(progressed()); await f.send('character.level_up', { character_id: 'main', target_level: 11 }); assert.equal((await f.send('skill.upgrade', { character_id: 'main', skill_id: 'mage_fire_bolt', target_level: 3 })).body.receipt?.outcome, 'committed', 'skill bought');
  const legacy = structuredClone(f.state), entry = legacy.paid_ledger.find(e => e.feature_id === 'skill')!; const currentPrice = structuredClone(entry.paid_resources);
  entry.cost_version = 'skill-cost-v0'; entry.cost_versions = ['skill-cost-v0']; entry.paid_resources = { ...entry.paid_resources, gold: 60, skill_manual: 12 };
  const old = stack(legacy, { content_hash: OLD }); assert.equal((await old.checkpoint()).body.code, 'SAVE_MIGRATION_REQUIRED');
  assert.equal((await old.send('save.migrate', { from_revision: 1, from_content_hash: OLD })).body.receipt?.result.code, 'SAVE_MIGRATED');
  const wallet = structuredClone(old.state.wallet), refund = await old.send('character.reset_build', { character_id: 'main', features: ['skills'] });
  assert.equal(refund.body.receipt?.result.code, 'BUILD_RESET'); assert.equal(old.state.wallet.gold - wallet.gold, 60, `refund the paid 60, not today\'s ${currentPrice.gold}`); assert.equal(old.state.wallet.skill_manual - wallet.skill_manual, 12);
  assert.equal((await old.send('character.reset_build', { character_id: 'main', features: ['skills'] })).body.receipt?.result.resource_delta.gold, 0, 'second reset refunds nothing');
});


test('21Oct daily clock incident refunds one Essence attempt with signed backup; retries cannot refund twice', async () => {
 const state:AccountState=progressed();
 state.daily_records=(['essence','treasury'] as const).map(boss=>({boss_id:boss,ticket_day:'2026-10-21',attempts_used:2,phase:1,current_hp:dailyPhaseStats(dailyBoss(boss,content),1,2).hp,rewarded_phases:[],chapter_snapshot:2})) as AccountState['daily_records'];
 const f=stack(state);f.advance(24*hour+hour);
 const start=rules.maintenanceReceipt(f.command('battle.start_daily',{boss_id:'essence'}),'a'.repeat(64),state,state,'2026-10-21T05:00:00.000Z','DAILY_STARTED');start.result.battle_id='33333333-3333-4333-8333-333333333333';
 const retreat=structuredClone(start);retreat.command_type='battle.retreat';retreat.server_at='2026-10-21T05:01:00.000Z';retreat.result.code='DAILY_RETREATED';f.clockReceipts.push(start,retreat);
 const params={checkpoint_id:'daily-clock:essence:2026-10-21',signature:'daily-clock-incident-2026-10-21'};
 const result=await f.send('backup.restore_request',params);
 assert.equal(result.status,200);assert.equal(result.body.receipt?.result.code,'DAILY_CLOCK_ESSENCE_REFUNDED');
 const expected=structuredClone(state);expected.daily_records.find(r=>r.boss_id==='essence')!.attempts_used=1;
 assert.deepEqual(f.state,expected);assert.equal(f.backups.length,1);assert.deepEqual(f.backups[0]!.state,state);assert.ok(f.backups[0]!.signature);assert.equal((await f.checkpoint()).status,200);
 const again=await f.send('backup.restore_request',params);
 assert.equal(again.status,200);assert.equal(again.body.receipt?.outcome,'rejected');assert.equal(again.body.receipt?.result.code,'DAILY_CLOCK_ALREADY_REFUNDED');assert.equal(f.backups.length,1);assert.deepEqual(f.state,expected);
});

test('daily clock repair without an affected historical retreat does not change quota or create a backup', async () => {
 const state:AccountState=progressed();state.daily_records=[{boss_id:'essence',ticket_day:'2026-10-21',attempts_used:1,phase:1,current_hp:dailyPhaseStats(dailyBoss('essence',content),1,2).hp,rewarded_phases:[],chapter_snapshot:2}];
 const f=stack(state);f.advance(24*hour);
 const result=await f.send('backup.restore_request',{checkpoint_id:'daily-clock:essence:2026-10-21',signature:'daily-clock-incident-2026-10-21'});
 assert.equal(result.status,200);assert.equal(result.body.receipt?.outcome,'rejected');assert.equal(result.body.receipt?.result.code,'DAILY_CLOCK_NOT_AFFECTED');assert.deepEqual(f.state,state);assert.equal(f.backups.length,0);
});

// D172 uses the real maintenance/receipt path against an actual pre-update signed state.
test('D172 older chapter11/12 saves reserve frozen Lv60 loot once before installing80/100 and preserve all actor investments', async()=>{
 const {readFileSync}=await import('node:fs'),{gunzipSync}=await import('node:zlib'),{validateContent}=await import('../../src/content/loader.ts'),{reserveFarm}=await import('../../src/domain/rewards/farm.ts');
 const loaded=validateContent(JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-148/before-content.json.gz',import.meta.url))).toString()));assert(loaded.ok);const old=loaded.value;
 for(const chapter of[11,12]){
  const state=initializeAccount(old,{root_job_id:'acolyte',gender:'male'},new Date(start).toISOString(),'2026-10-20',17),main=state.roster[0]!;
  Object.assign(main,{job_id:'champion',level:90,local_cap:100,completed_gate_ids:[20,40,60,80],unspent_status_points:1050});
  state.story.cleared_stage_ids=storyStages(old).map(s=>s.id);state.story.selected_farm_stage=chapter+'-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage(chapter+'-1',old)!,state,old);
  state.inventory.push({kind:'equipment',instance_id:'oldknuckle',definition_id:'equipment_knuckle_60',rarity_id:'epic',locked:true,training:false,options:[{id:'opt_crit',roll:500}]});main.equipment.weapon='oldknuckle';main.slot_progress.weapon.refine=5;main.slot_progress.weapon.refine_failures=3;
  const card=Object.values(old.items).find(i=>i.kind==='card'&&i.slot==='weapon')!;state.inventory.push({kind:'card',instance_id:'oldcard',definition_id:String(card.id),rarity_id:cardRarity(String(card.id),old),locked:true,level:3});main.slot_progress.weapon.cards[0]='oldcard';
  const snapshot=structuredClone(state),f=stack(state,{content_hash:old.manifest.content_hash,content_version:old.manifest.content_version,rules_version:old.manifest.rules_version});f.advance(hour);
  const uuid='14800000-1111-4111-8111-111111111111',first=await f.send('save.migrate',{from_revision:1,from_content_hash:old.manifest.content_hash},1,uuid);
  assert.equal(first.body.receipt?.result.code,'SAVE_MIGRATED',String(first.body.code));assert.equal(f.backups.length,1);assert.deepEqual(f.backups[0]!.state,snapshot);
  assert.deepEqual(f.state.roster,snapshot.roster);assert.deepEqual(f.state.inventory,snapshot.inventory);assert.deepEqual(f.state.wallet,snapshot.wallet);assert.deepEqual(f.state.paid_ledger,snapshot.paid_ledger);assert.equal(f.state.farm.rate_snapshot!.gear_tier,60);assert.deepEqual(f.state.farm,snapshot.farm);assert.deepEqual(f.state.pending_rewards,snapshot.pending_rewards);
  const frozen=structuredClone(f.state),replayed=await f.send('save.migrate',{from_revision:1,from_content_hash:old.manifest.content_hash},1,uuid);assert.deepEqual(replayed.body.receipt,first.body.receipt);assert.deepEqual(f.state,frozen);assert.equal(f.save.revision,2);assert.equal(f.backups.length,1);rules.validateAccount(f.state);
  const until=f.now+1000,expected=reserveFarm(snapshot,start,until,new Date(until).toISOString(),'irrelevant',old),claimId='14800000-2222-4222-8222-222222222222';
  const claim=await f.send('farm.claim',{},2,claimId);assert.equal(claim.body.receipt?.result.code,'FARM_RESERVED');assert.equal(f.state.farm.rate_snapshot!.gear_tier,chapter===11?80:100);
  const drops=f.state.pending_rewards.flatMap(r=>r.items).filter(i=>i.kind==='equipment');assert(drops.length>0&&drops.every(i=>content.items[i.definition_id]!.tier_level===60));assert.deepEqual(drops.map(i=>i.definition_id),expected.pending_rewards.flatMap(r=>r.items).filter(i=>i.kind==='equipment').map(i=>i.definition_id));
  const claimed=structuredClone(f.state);assert.deepEqual((await f.send('farm.claim',{},2,claimId)).body.receipt,claim.body.receipt);assert.deepEqual(f.state,claimed);assert.equal(f.save.revision,3);
 }
});

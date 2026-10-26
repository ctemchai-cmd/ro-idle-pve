import {applyCraftingCommand,protectPendingOption,validateCrafting,type CraftingCommand} from '../progression/equipment-crafting.ts';
import { applyShopPurchase } from '../progression/shop.ts';
import { collectProgressRewards } from '../progression/auto-rewards.ts';
import { claimRewards } from '../progression/claim-rewards.ts';
import { preparedScroll, validateSupplies } from '../build/consumables.ts';
import { prepareConsumable, consumePreparedForTeam } from '../progression/consumables.ts';
import type { AccountState, Command, Receipt } from '../../contracts/index.ts';
import type { BattleWrite, StoredBattle } from '../../contracts/save.ts';
import type { Json } from '../../content/value.ts';
import { createBattle, advanceUntil, restoreBattle, serializeBattle } from '../combat/index.ts';
import { AccountCreationRules } from './creation.ts';
import { calculateBattleCredit } from './protocol.ts';
import { applySkillCommand, validateCharacterSkills, compileCharacterSkills, type SkillCommand } from '../progression/skills.ts';
import { storyStage, storyBoss, storyFarmSnapshot, canChallenge, storyReleaseLock, storyStages } from '../modes/story.ts';
import { storyParty, storyInput } from '../build/story.ts';
import { towerBoss, towerCanChallenge, towerRow, towerStageRef } from '../modes/tower.ts';
import { bangkokDay, dailyBoss, dailyBossActor, dailyChest, dailyRecord, dailyRef, dailyUnlocked, modePolicy, parseDailyRef, type DailyBossId } from '../modes/daily.ts';
import type { BattleCheckpoint } from '../../contracts/index.ts';
import { gachaCardDefinition } from '../rewards/cards.ts';
import { cardRarity } from '../build/card-rarity.ts';
import { gachaCardTier, pullCards, pullCost, pullGear } from '../rewards/gacha.ts';
import { boundItemInstances } from '../build/equipment-definition.ts';
import { applyGearUpgrade, type GearUpgradeCommand } from '../progression/gear-upgrades.ts';
import { compactPaidLedger } from '../progression/ledger.ts';
import { applySlotCommand, type SlotCommand } from '../progression/slots.ts';
import { applyEquipmentCommand, validateInventory, type EquipmentCommand } from '../progression/equipment.ts';
import { reserveFarm } from '../rewards/farm.ts';
import { nextRandom } from '../../content/random.ts';
import { applyRosterCommand, ProgressionRejection, validateProgression, type RosterCommand } from '../progression/characters.ts';
import { initializeAccount } from '../progression/initialize.ts';
import { migrateAccountState } from './migrate.ts';
import { guardRestore, resetAccount } from './maintenance.ts';

export interface CommandTime {
  account_id?: string; battle_id?: string; battle_seed?: number; build_hashes?: Record<string, string>;
  server_at: string; now_ms: number; new_lease_at: string;
  last_ack_ms: number; lease_expires_ms: number; started_ms: number;
  farm_from_ms: number;
  stored_last_ack_ms: number; stored_lease_ms: number;
}
export interface CommandProposal { state: AccountState; receipt: Receipt; battle_write: BattleWrite }
/** Server-owned account command reducers. Mode/upgrade handlers extend this boundary. */
export class AccountCommandRules extends AccountCreationRules {
  buildInputs(state:AccountState){return Object.fromEntries(state.roster.map(actor=>{const prepared=preparedScroll(state,actor.character_id,this.content);return[actor.character_id,{actor,items:boundItemInstances(actor,state),...(prepared?{prepared_scroll:prepared.id}:{})}];}));}
  get leaseMs() { return Number((this.content.documents['save-contracts.json']!.battle_protocol as unknown as { lease_ms: number }).lease_ms); }
  supports(type: Command['type']) { return ['equipment.option_roll','equipment.option_decide','equipment.rarity_up','farm.claim', 'reward.claim', 'battle.advance', 'battle.finish', 'battle.retreat', 'party.set', 'character.level_up', 'character.breakthrough', 'character.allocate_status', 'character.reset_build', 'character.change_job', 'skill.upgrade', 'skill.set_loadout', 'skill.awaken', 'skill.convert_shards', 'battle.start_story', 'farm.set_stage', 'equipment.equip', 'equipment.equip_upgrades', 'equipment.unequip', 'equipment.lock', 'equipment.salvage', 'equipment.purchase_weapon', 'slot.refine', 'slot.enchant', 'slot.change_enchant', 'card.assign', 'card.unassign', 'card.upgrade', 'card.salvage', 'equipment.fuse', 'equipment.tier_up', 'battle.start_tower', 'battle.start_daily', 'gacha.pull', 'consumable.prepare', 'shop.buy', 'daily.objective_claim'].includes(type); }
  /** TASK-040 (D-064): maintenance proposals. The API proves integrity/ownership and supplies time, ids and seed. */
  migrateSave(stored: unknown): { state: AccountState; changes: string[] } { const migrated = migrateAccountState(stored, this.content); return { state: this.validateAccount(migrated.state), changes: migrated.changes }; }
  restoreSave(restored: unknown, current: AccountState | null, nowMs: number): AccountState { return this.validateAccount(guardRestore(this.validateAccount(restored), current, bangkokDay(nowMs), bangkokDay(nowMs - 86400000))); }
  resetSave(current: AccountState, params: { root_job_id: AccountState['roster'][number]['root_job_id']; gender: 'male' | 'female' }, serverAt: string, nowMs: number, seed: number): AccountState {
    const fresh = initializeAccount(this.content, params, serverAt, bangkokDay(nowMs), seed);
    return this.validateAccount(resetAccount(current, fresh, bangkokDay(nowMs), bangkokDay(nowMs - 86400000)));
  }
  maintenanceReceipt(command: Command, requestHash: string, previous: AccountState | null, next: AccountState, serverAt: string, code: string): Receipt {
    const zero = Object.fromEntries(Object.keys(next.wallet).map(k => [k, 0])) as AccountState['wallet'], before = previous?.inventory ?? [];
    const delta = Object.fromEntries(Object.keys(next.wallet).map(k => [k, next.wallet[k as keyof AccountState['wallet']] - ((previous ?? { wallet: zero }).wallet[k as keyof AccountState['wallet']] ?? 0)])) as AccountState['wallet'];
    const receipt: Receipt = { request_id: command.request_id, request_hash: requestHash, outcome: 'committed', committed_revision: command.expected_revision + 1, server_at: serverAt, ...this.versions, schema_version: 1, command_type: command.type, result: { code, resource_delta: previous ? delta : zero, created_instance_ids: previous ? next.inventory.filter(i => !before.some(p => p.instance_id === i.instance_id)).map(i => i.instance_id) : [], removed_instance_ids: previous ? before.filter(i => !next.inventory.some(n => n.instance_id === i.instance_id)).map(i => i.instance_id) : [], pending_claim_ids: next.pending_rewards.map(c => c.claim_id), battle_id: null, reason_key: null, ledger_entry_ids: [], refunded_ledger_entries: [] } };
    this.validator.shape('receipt', receipt as unknown as Json, { source: 'maintenance receipt', path: '' }); return receipt;
  }
  validateAccount(value: unknown): AccountState {
    this.validator.shape('account-state', value as Json, { source: 'stored account', path: '' });
    const s = value as AccountState;
    const ids = s.roster.map(a => a.character_id), itemIds = s.inventory.map(i => i.instance_id);
    if (new Set(ids).size !== ids.length || new Set(itemIds).size !== itemIds.length || s.roster.filter(a => a.kind === 'main').length !== 1) throw new Error('INVALID_ACCOUNT_REFERENCES');
    if (new Set(s.team.map(p => p.character_id)).size !== 4 || new Set(s.team.map(p => p.position)).size !== 4 || s.team.some(p => !ids.includes(p.character_id))) throw new Error('INVALID_TEAM');
    const members = s.team.map(p => s.roster.find(a => a.character_id === p.character_id)!);
    if (members.filter(a => a.kind === 'main').length !== 1 || new Set(members.filter(a => a.kind === 'npc').map(a => a.root_job_id)).size !== 3) throw new Error('INVALID_TEAM');
    if (s.roster.some(a => Object.values(a.equipment).some(id => id !== null && !itemIds.includes(id)))) throw new Error('INVALID_EQUIPMENT_REFERENCE');
    validateProgression(s, this.content);
    validateInventory(s, this.content);validateCrafting(s,this.content);
    validateSupplies(s, this.content);
    for (const actor of s.roster) validateCharacterSkills(actor, this.content);
    return s;
  }
  decide(command: Command, previous: AccountState, battle: StoredBattle | null, time: CommandTime, requestHash: string): CommandProposal {
    let state = structuredClone(previous), code = 'COMMAND_COMMITTED', battleWrite: BattleWrite = { kind: 'keep' }, rejected = false;
    const reject = (reason: string) => { throw new BusinessRejection(reason); };
    const reserveCurrent = (input: AccountState, claimId: string) => {
      if (!input.farm.rate_snapshot) return input;
      if (time.now_ms < time.farm_from_ms) reject('CLOCK_REGRESSION');
      if (time.now_ms === time.farm_from_ms) return input;
      try { return reserveFarm(input, time.farm_from_ms, time.now_ms, time.server_at, claimId, this.content); }
      catch (error) { if (error instanceof Error && /^[A-Z_]+$/.test(error.message)) reject(error.message); throw error; }
    };
    const queueLimit = () => Number((this.content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit);
    /** Writes a finished/abandoned daily attempt into its own ticket day: phase, HP left and one chest per newly cleared phase. */
    const settleDaily = (checkpoint: BattleCheckpoint) => {
      const { id } = parseDailyRef(checkpoint.mode.ref), day = checkpoint.mode.ticket_day!, record = state.daily_records.find(row => row.boss_id === id && row.ticket_day === day);
      if (!record) reject('DAILY_RECORD_MISSING');
      const boss = checkpoint.actors.find(actor => actor.actor_id === 'enemy_front');
      record!.phase = checkpoint.mode.daily_phase ?? record!.phase; record!.current_hp = Math.max(1, boss?.hp ?? record!.current_hp);
      for (const key of checkpoint.mode.reserved_phase_keys) {
        const phase = Number(key); if (!Number.isSafeInteger(phase) || record!.rewarded_phases.includes(phase)) continue;
        if (state.pending_rewards.length >= queueLimit()) reject('PENDING_REWARDS_FULL');
        record!.rewarded_phases.push(phase);
        state.pending_rewards.push({ claim_id: `daily_${id}_${day}_${phase}`, kind: 'daily', resource_vector: { ...Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])), ...dailyChest(dailyBoss(id, this.content), phase,record!.chapter_snapshot) } as AccountState['wallet'], items: [], content_version: this.versions.content_version, reserved_at: time.server_at, source_keys: [`daily:${id}:${day}:${phase}`, `battle:${pointer0()?.battle_id ?? 'retreat'}`], status: 'pending' });
      }
    };
    const pointer0 = () => previous.active_battle;
    const selectFarm = (input: AccountState, stageId: string) => {
      const stage = storyStage(stageId, this.content);
      if (!stage || storyReleaseLock(stage,this.content) || !input.story.cleared_stage_ids.includes(stageId)) reject('FARM_STAGE_NOT_CLEARED');
      input.story.selected_farm_stage = stageId; input.farm.rate_snapshot = storyFarmSnapshot(stage!, input, this.content); input.farm.reserved_through = time.server_at;
    };
    // Daily objective (economy.daily_objective): today's Bangkok record rolls over on the first committed command of a new day.
    const today = bangkokDay(time.now_ms);
    if (state.daily_objectives.day !== today) state.daily_objectives = { day: today, farm_claimed: false, battle_finished: false, claimed: false };
    try {
      protectPendingOption(state,command);
      if (command.type === 'daily.objective_claim') {
        const objective = this.content.documents['economy.json']!.daily_objective as unknown as { crystal: number; unlocks_after: string };
        if (!state.story.cleared_stage_ids.includes(objective.unlocks_after)) reject('DAILY_OBJECTIVE_LOCKED');
        if (state.daily_objectives.claimed) reject('DAILY_OBJECTIVE_CLAIMED');
        if (!state.daily_objectives.farm_claimed || !state.daily_objectives.battle_finished) reject('DAILY_OBJECTIVE_INCOMPLETE');
        state.wallet.crystal += objective.crystal; state.daily_objectives.claimed = true; code = 'DAILY_OBJECTIVE_CLAIMED';
      } else if (command.type === 'battle.start_story') {
        if (state.active_battle) reject('BATTLE_ALREADY_ACTIVE');
        const stage = storyStage(command.params.stage_id, this.content); if (!stage || !canChallenge(stage, state, this.content)) reject('STAGE_LOCKED');
        if (state.pending_rewards.length >= Number((this.content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit)-1) reject('PENDING_REWARDS_FULL');
        if (!time.account_id || !time.battle_id || time.battle_seed===undefined || !time.build_hashes) throw new Error('SERVER_BATTLE_CONTEXT_REQUIRED');
        const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, this.content)]));
        const initial = createBattle(storyInput(stage!, storyBoss(stage!), storyParty(state,this.content,compiled,time.build_hashes), this.content), this.content, time.battle_seed);
        if (!initial.ok) reject('BATTLE_BUILD_UNAVAILABLE');
        consumePreparedForTeam(state);
        state.active_battle = { battle_id: time.battle_id, mode:'story', mode_ref:stage!.id, ticket_day:null, started_at:time.server_at, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at, ...this.versions };
        battleWrite = { kind:'upsert', battle:{ account_id:time.account_id, battle_id:time.battle_id, payload:initial.ok?serializeBattle(initial.value):null, content_hash:this.versions.content_hash, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at } }; code='STORY_STARTED';
      } else if (command.type === 'battle.start_tower') {
        if (state.active_battle) reject('BATTLE_ALREADY_ACTIVE');
        const floor = command.params.floor; if (!towerCanChallenge(floor, state, this.content)) reject('TOWER_FLOOR_LOCKED');
        if (state.pending_rewards.length >= Number((this.content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit)-1) reject('PENDING_REWARDS_FULL');
        if (!time.account_id || !time.battle_id || time.battle_seed===undefined || !time.build_hashes) throw new Error('SERVER_BATTLE_CONTEXT_REQUIRED');
        const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, this.content)]));
        const initial = createBattle(storyInput(towerStageRef(floor, this.content), towerBoss(floor, this.content), storyParty(state,this.content,compiled,time.build_hashes), this.content, { kind: 'tower' }), this.content, time.battle_seed);
        if (!initial.ok) reject('BATTLE_BUILD_UNAVAILABLE');
        consumePreparedForTeam(state);
        state.active_battle = { battle_id: time.battle_id, mode:'tower', mode_ref:String(floor), ticket_day:null, started_at:time.server_at, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at, ...this.versions };
        battleWrite = { kind:'upsert', battle:{ account_id:time.account_id, battle_id:time.battle_id, payload:initial.ok?serializeBattle(initial.value):null, content_hash:this.versions.content_hash, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at } }; code='TOWER_STARTED';
      } else if (command.type === 'battle.start_daily') {
        if (state.active_battle) reject('BATTLE_ALREADY_ACTIVE');
        if (!dailyUnlocked(state, this.content)) reject('DAILY_LOCKED');
        if (state.pending_rewards.length >= queueLimit() - 1) reject('PENDING_REWARDS_FULL');
        if (!time.account_id || !time.battle_id || time.battle_seed===undefined || !time.build_hashes) throw new Error('SERVER_BATTLE_CONTEXT_REQUIRED');
        const id = command.params.boss_id as DailyBossId, boss = dailyBoss(id, this.content), day = bangkokDay(time.now_ms), record = structuredClone(dailyRecord(state, id, day, this.content));
        // The attempt is reserved by this receipt before any combat; retreat/disconnect/loss never refunds it.
        if (record.attempts_used >= boss.attempts_per_day) reject('DAILY_NO_ATTEMPTS');
        record.attempts_used++;
        const yesterday = bangkokDay(time.now_ms - 86400000);
        state.daily_records = [...state.daily_records.filter(row => !(row.boss_id === id && row.ticket_day === day) && row.ticket_day >= yesterday), record] as AccountState['daily_records']; // today + yesterday (≤ 6 rows)
        const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, this.content)]));
        const initial = createBattle(storyInput({ id: dailyRef(id, record.chapter_snapshot), time_limit_ms: boss.time_limit_ms }, dailyBossActor(id, record.phase, record.chapter_snapshot, this.content), storyParty(state,this.content,compiled,time.build_hashes), this.content,
          { kind: 'daily', ticket_day: day, daily_phase: record.phase, daily_current_hp: record.current_hp, reserved_phase_keys: [] }), this.content, time.battle_seed);
        if (!initial.ok) reject('BATTLE_BUILD_UNAVAILABLE');
        consumePreparedForTeam(state);
        // Partial damage carries over: the boss enters with the HP left from earlier attempts today.
        const payload = initial.ok ? serializeBattle(initial.value) : null; if (payload) payload.actors.find(actor => actor.actor_id === 'enemy_front')!.hp = record.current_hp;
        state.active_battle = { battle_id: time.battle_id, mode:'daily', mode_ref:id, ticket_day:day, started_at:time.server_at, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at, ...this.versions };
        battleWrite = { kind:'upsert', battle:{ account_id:time.account_id, battle_id:time.battle_id, payload, content_hash:this.versions.content_hash, last_ack_at:time.server_at, lease_expires_at:time.new_lease_at } }; code='DAILY_STARTED';
      } else if (command.type === 'gacha.pull') {
        // Server seed only: replaying the same request returns the stored receipt, never a re-roll.
        if (time.battle_seed === undefined) throw new Error('SERVER_SEED_REQUIRED');
        const { pool_id: pool, count } = command.params, cost = pullCost(pool, count, this.content);
        if (state.inventory.length + count > Number(this.content.documents['equipment.json']!.inventory_capacity)) reject('INVENTORY_FULL');
        for (const [key, amount] of Object.entries(cost) as [keyof AccountState['wallet'], number][]) if (state.wallet[key] < amount) reject('INSUFFICIENT_RESOURCES');
        for (const [key, amount] of Object.entries(cost) as [keyof AccountState['wallet'], number][]) state.wallet[key] -= amount;
        const rng = { state: time.battle_seed >>> 0, draw_count: 0 }, draw = () => nextRandom(rng), prefix = `gacha_${command.request_id}`;
        state.inventory.push(...(pool === 'card_v1' ? pullCards(state, count, draw, prefix, this.content) : pullGear(state, count, draw, prefix, this.content)));
        code = 'GACHA_PULLED';
      } else if (command.type === 'consumable.prepare') {
        prepareConsumable(state, command.params.character_id, command.params.definition_id, this.content); code='CONSUMABLE_PREPARED';
      } else if (command.type === 'shop.buy') {
        applyShopPurchase(state,command.params.offer_id,command.params.quantity,bangkokDay(time.now_ms),this.content);code='SHOP_PURCHASED';
      } else if (command.type === 'farm.set_stage') {
        state = reserveCurrent(state, `farm_${command.request_id}`); selectFarm(state, command.params.stage_id); code='FARM_STAGE_SELECTED';
      } else if (command.type === 'farm.claim') {
        try {
          // Settle the frozen old profile first; new card rules apply only to subsequent unpaid time.
          if (command.params.collect_rewards && state.pending_rewards.length) claimRewards(state, state.pending_rewards.map(c => c.claim_id), this.content);
          state = reserveFarm(state, time.farm_from_ms, time.now_ms, time.server_at, `farm_${command.request_id}`, this.content);
          const stage = storyStage(state.farm.rate_snapshot!.stage_id, this.content);
          if (stage) state.farm.rate_snapshot = storyFarmSnapshot(stage, state, this.content);
          if (command.params.collect_rewards && state.pending_rewards.length) claimRewards(state, state.pending_rewards.map(c => c.claim_id), this.content);
          state.daily_objectives.farm_claimed = true; code = command.params.collect_rewards ? 'FARM_COLLECTED' : 'FARM_RESERVED';
        }
        catch (error) { if (error instanceof Error && /^[A-Z_]+$/.test(error.message)) reject(error.message); else throw error; }
      } else if (command.type === 'reward.claim') {
        claimRewards(state, 'claim_ids' in command.params ? command.params.claim_ids : [command.params.claim_id], this.content); code = 'REWARD_CLAIMED';
      } else if (command.type === 'battle.retreat' || command.type === 'battle.advance' || command.type === 'battle.finish') {
        const pointer = state.active_battle;
        if (!pointer || pointer.battle_id !== command.params.battle_id) reject('ACTIVE_BATTLE_MISMATCH');
        if (command.type === 'battle.retreat') {
          // Manual retreat may settle played daily damage; reconnect sends no time claim and never catches up offline.
          if (pointer!.mode === 'daily' && battle && battle.battle_id === pointer!.battle_id) {
            const stored = restoreBattle(battle.payload, this.content);
            if (stored.ok) {
              let checkpoint = stored.value;
              if (command.params.requested_game_ms !== undefined) {
                const elapsed = time.now_ms - time.started_ms, protocol = this.content.documents['save-contracts.json']!.battle_protocol as unknown as { ticket_wall_max_ms: number; speed_multipliers: number[] };
                if (elapsed < 0) reject('CLOCK_REGRESSION');
                if (elapsed < protocol.ticket_wall_max_ms) {
                  const target = Math.min(command.params.requested_game_ms, elapsed * Math.max(...protocol.speed_multipliers), checkpoint.mode.time_limit_ms);
                  const replay = advanceUntil(checkpoint, Math.max(checkpoint.game_time_ms, target), this.content, modePolicy(checkpoint.mode, this.content));
                  if (!replay.ok) reject('BATTLE_ADVANCE_FAILED');
                  checkpoint = replay.ok ? replay.value.state : checkpoint;
                }
              }
              settleDaily(checkpoint as BattleCheckpoint);
            }
          }
          state.active_battle = null; battleWrite = { kind: 'delete', battle_id: pointer!.battle_id }; code = pointer!.mode === 'daily' ? 'DAILY_RETREATED' : 'BATTLE_ABORTED';
        }
        else {
          if (!battle || battle.battle_id !== pointer!.battle_id || battle.content_hash !== this.versions.content_hash || time.stored_last_ack_ms !== time.last_ack_ms || time.stored_lease_ms !== time.lease_expires_ms) reject('BATTLE_CONTEXT_MISMATCH');
          const checkpoint = restoreBattle(battle!.payload, this.content); if (!checkpoint.ok) reject('INCOMPATIBLE_CHECKPOINT');
          const protocol = this.content.documents['save-contracts.json']!.battle_protocol as unknown as { max_credited_wall_gap_ms: number; ticket_wall_max_ms: number; speed_multipliers: number[] };
          if (time.now_ms < time.started_ms) reject('CLOCK_REGRESSION');
          if (time.now_ms - time.started_ms >= protocol.ticket_wall_max_ms) reject('BATTLE_TICKET_EXPIRED');
          let target: number;
          if (command.type === 'battle.finish') target = checkpoint.ok ? checkpoint.value.mode.time_limit_ms : 0;
          else {
            // Kept for historical/diagnostic adapters; the game client uses terminal-only settlement.
            const credit = calculateBattleCredit({ last_ack_ms: time.last_ack_ms, lease_expires_ms: time.lease_expires_ms, database_now_ms: time.now_ms, game_time_ms: checkpoint.ok ? checkpoint.value.game_time_ms : 0, requested_game_ms: command.params.requested_game_ms, max_wall_gap_ms: protocol.max_credited_wall_gap_ms, speed: command.params.speed ?? 1 });
            if (!credit.ok) reject(credit.code);
            target = credit.ok ? credit.game_time_ms : 0;
          }
          const next = advanceUntil(checkpoint.ok ? checkpoint.value : null!, target, this.content, checkpoint.ok ? modePolicy(checkpoint.value.mode, this.content) : {});
          if (!next.ok) reject('BATTLE_ADVANCE_FAILED');
          if (command.type === 'battle.finish') {
            if (!next.ok || !next.value.state.terminal_result) reject('BATTLE_NOT_FINISHED');
            // All supported speed choices lead to the same replay. Enforce the fastest legal wall-time bound.
            if (time.now_ms - time.started_ms < Math.ceil((next.ok ? next.value.state.game_time_ms : 0) / Math.max(...protocol.speed_multipliers))) reject('BATTLE_FINISH_TOO_EARLY');
          }
          pointer!.last_ack_at = time.server_at; pointer!.lease_expires_at = time.new_lease_at;
          battleWrite = { kind: 'upsert', battle: { ...battle!, payload: next.ok ? serializeBattle(next.value.state) : null, last_ack_at: time.server_at, lease_expires_at: time.new_lease_at } };
          // TASK-025/035/036 own mode completion and fixed reward reservation.
          // Preserve a terminal checkpoint until that reducer settles/retreats it.
          code = next.ok && next.value.state.terminal_result ? 'BATTLE_TERMINAL_CHECKPOINT' : 'BATTLE_ADVANCED';
          const stage = pointer!.mode==='story' ? storyStage(pointer!.mode_ref,this.content) : undefined;
          if (next.ok && next.value.state.terminal_result && stage) {
            if (next.value.state.mode.ref!==stage.id) reject('BATTLE_CONTEXT_MISMATCH');
            const result=next.value.state.terminal_result;
            if (result.kind==='victory'&&!state.story.cleared_stage_ids.includes(stage.id)) {
              const automatic = command.type === 'battle.finish' && command.params.collect_rewards === true;
              if (automatic) collectProgressRewards(state, this.content);
              state=reserveCurrent(state,`farm_${command.request_id}`);
              state.story.cleared_stage_ids.push(stage.id);
              const stages = storyStages(this.content), previousStage = stages[stages.findIndex(s => s.id === stage.id) - 1]?.id ?? null;
              const farming = state.story.selected_farm_stage;
              const selected=automatic && (farming === null || farming === previousStage) ? stage.id : farming ?? stage.id;
              selectFarm(state,selected);
              const limit=Number((this.content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit);
              if(state.pending_rewards.length>=limit)reject('PENDING_REWARDS_FULL');
              state.pending_rewards.push({claim_id:`story_${stage.id}`,kind:'story',resource_vector:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...stage.first_clear_reward}as AccountState['wallet'],items:[],content_version:this.versions.content_version,reserved_at:time.server_at,source_keys:[`story:${stage.id}`,`battle:${pointer!.battle_id}`],status:'pending'});
            }
            state.active_battle=null;state.daily_objectives.battle_finished=true;
            battleWrite={kind:'delete',battle_id:pointer!.battle_id};code=result.kind==='victory'?'STORY_WON':result.kind==='time_limit'?'STORY_TIME_LIMIT':'STORY_DEFEATED';
          }
          if (next.ok && next.value.state.terminal_result && pointer!.mode==='daily') {
            if (next.value.state.mode.kind!=='daily'||next.value.state.mode.ticket_day!==pointer!.ticket_day) reject('BATTLE_CONTEXT_MISMATCH');
            settleDaily(next.value.state as BattleCheckpoint);
            state.active_battle=null;state.daily_objectives.battle_finished=true;
            battleWrite={kind:'delete',battle_id:pointer!.battle_id};code=next.value.state.terminal_result.kind==='defeat'?'DAILY_DEFEATED':'DAILY_FINISHED';
          }
          if (next.ok && next.value.state.terminal_result && pointer!.mode==='tower') {
            const floor=Number(pointer!.mode_ref); if (next.value.state.mode.kind!=='tower'||next.value.state.mode.ref!==pointer!.mode_ref) reject('BATTLE_CONTEXT_MISMATCH');
            const result=next.value.state.terminal_result;
            // First clear only: the frontier floor advances once and pays once; replays and losses pay nothing (D-035 claim key).
            if (result.kind==='victory'&&floor===state.tower.highest_cleared_floor+1) {
              const row=towerRow(floor,this.content),limit=Number((this.content.documents['save-contracts.json']!.farm as unknown as {queue_limit:number}).queue_limit);
              if(state.pending_rewards.length>=limit)reject('PENDING_REWARDS_FULL');
              const items:AccountState['inventory']=[],rng={state:(time.battle_seed??floor)>>>0,draw_count:0};
              for(let n=0;n<row.bronze_card_count;n++){const definition_id=gachaCardDefinition(nextRandom(rng),this.content,gachaCardTier(state,this.content));items.push({instance_id:`tower_${floor}_card_${n}`,definition_id,kind:'card',rarity_id:cardRarity(definition_id,this.content),locked:false,level:1});}
              state.tower.highest_cleared_floor=floor;
              state.pending_rewards.push({claim_id:`tower_${floor}`,kind:'tower',resource_vector:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...(row.reward_resources??{gold:row.gold,crystal:row.crystal})}as AccountState['wallet'],items,content_version:this.versions.content_version,reserved_at:time.server_at,source_keys:[`tower:${floor}`,`battle:${pointer!.battle_id}`],status:'pending'});
            }
            state.active_battle=null;state.daily_objectives.battle_finished=true;
            battleWrite={kind:'delete',battle_id:pointer!.battle_id};code=result.kind==='victory'?'TOWER_WON':result.kind==='time_limit'?'TOWER_TIME_LIMIT':'TOWER_DEFEATED';
          }
          if (command.type === 'battle.finish' && state.active_battle) reject('BATTLE_CONTEXT_MISMATCH');
          if (command.type === 'battle.finish' && command.params.collect_rewards && ['STORY_WON', 'TOWER_WON'].includes(code)) collectProgressRewards(state, this.content);
        }
      } else if (command.type.startsWith('slot.') || command.type.startsWith('card.')) code = applySlotCommand(state, command as SlotCommand, this.content, time.battle_seed === undefined ? null : nextRandom({ state: time.battle_seed >>> 0, draw_count: 0 }));
      else if (command.type === 'equipment.fuse' || command.type === 'equipment.tier_up') { const rng = { state: (time.battle_seed ?? 0) >>> 0, draw_count: 0 }; code = applyGearUpgrade(state, command as GearUpgradeCommand, this.content, time.battle_seed === undefined ? null : () => nextRandom(rng)); }
      else if (['equipment.option_roll','equipment.option_decide','equipment.rarity_up'].includes(command.type)) { const rng={state:(time.battle_seed??0)>>>0,draw_count:0};code=applyCraftingCommand(state,command as CraftingCommand,this.content,time.battle_seed===undefined?null:()=>nextRandom(rng)); }
      else if (command.type.startsWith('equipment.')) code = applyEquipmentCommand(state, command as EquipmentCommand, this.content);
      else if (command.type === 'skill.upgrade' || command.type === 'skill.set_loadout' || command.type === 'skill.awaken' || command.type === 'skill.convert_shards') code = applySkillCommand(state, command as SkillCommand, this.content);
      else if (command.type === 'party.set' || command.type.startsWith('character.')) code = applyRosterCommand(state, command as RosterCommand, this.content);
      else throw new Error('COMMAND_NOT_REGISTERED');
    } catch (error) { if (!(error instanceof BusinessRejection) && !(error instanceof ProgressionRejection)) throw error; code = error.message; rejected = true; }
    const committed = rejected ? structuredClone(previous) : state;
    const refunded = committed.paid_ledger.filter(e => e.refund_command_id === command.request_id && previous.paid_ledger.some(p => p.entry_id === e.entry_id && p.refund_state === 'active'));
    if (!rejected) committed.paid_ledger = compactPaidLedger(committed.paid_ledger);
    const delta = Object.fromEntries(Object.keys(previous.wallet).map(k => [k, committed.wallet[k as keyof AccountState['wallet']] - previous.wallet[k as keyof AccountState['wallet']]])) as AccountState['wallet'];
    const receipt: Receipt = { request_id: command.request_id, request_hash: requestHash, outcome: rejected ? 'rejected' : 'committed', committed_revision: command.expected_revision + (rejected ? 0 : 1), server_at: time.server_at, ...this.versions, schema_version: 1, command_type: command.type, result: { code, resource_delta: delta, created_instance_ids: committed.inventory.filter(i => !previous.inventory.some(p => p.instance_id === i.instance_id)).map(i => i.instance_id), removed_instance_ids: previous.inventory.filter(i => !committed.inventory.some(current => current.instance_id === i.instance_id)).map(i => i.instance_id), pending_claim_ids: committed.pending_rewards.map(c => c.claim_id), battle_id: committed.active_battle?.battle_id ?? previous.active_battle?.battle_id ?? null, reason_key: rejected ? code.toLowerCase() : null, ledger_entry_ids: committed.paid_ledger.filter(e => !previous.paid_ledger.some(p => p.entry_id === e.entry_id && this.canonical(p) === this.canonical(e))).map(e => e.entry_id), refunded_ledger_entries: refunded } };
    this.validateAccount(committed); this.validator.shape('receipt', receipt as unknown as Json, { source: 'command receipt', path: '' });
    return { state: committed, receipt, battle_write: rejected ? { kind: 'keep' } : battleWrite };
  }
}
class BusinessRejection extends Error {}

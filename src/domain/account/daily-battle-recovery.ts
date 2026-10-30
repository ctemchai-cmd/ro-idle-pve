import replayCompat from './daily-replay-compat.ts';
import compat from './daily-recovery-compat.ts';
import type { AccountState, BattleCheckpoint } from '../../contracts/index.ts';
import type { StoredBattle } from '../../contracts/save.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { restoreBattle, advanceUntil } from '../combat/index.ts';
import { modePolicy, parseDailyRef } from '../modes/daily.ts';
import { settleDailyRewards } from './daily-settlement.ts';

export interface DailyRecoveryContext { account_id: string; now_ms: number; battle?: StoredBattle|null; started_ms?: number; server_at?: string }
const core=(p:string)=>['src/content/','src/contracts/','src/domain/combat/','src/domain/math/','src/domain/build/','src/domain/modes/'].some(prefix=>p.startsWith(prefix));
/** A narrowly proven compatible version can recover its stored daily run during backup migration. */
export function recoverCompatibleDaily(previous:AccountState,next:AccountState,changes:string[],content:ValidatedContent,context?:DailyRecoveryContext):void {
  const pointer=previous.active_battle,battle=context?.battle;
  if(!pointer||pointer.mode!=='daily'||!([...replayCompat.content_hashes,compat.content_hash] as readonly string[]).includes(pointer.content_hash)||!context||!('battle' in context))return;
  if(!battle||!context.server_at||!Number.isSafeInteger(context.started_ms))throw new Error('DAILY_RECOVERY_CONTEXT_MISSING');
  const current=content.manifest,keys=Object.keys(current.input_sha256).filter(core),old=compat.core_sources as Record<string,string>;
  const sealed=current.combat_replay_hash===replayCompat.combat_replay_hash&&Object.entries(replayCompat.sources).every(([p,hash])=>current.input_sha256[p]===hash);
  if(!sealed&&(current.engine_data_hash!==compat.engine_data_hash||current.schema_hash!==compat.schema_hash||keys.length!==Object.keys(old).length||keys.some(p=>current.input_sha256[p]!==old[p])))throw new Error('DAILY_RECOVERY_INCOMPATIBLE');
  if(battle.account_id!==context.account_id||battle.battle_id!==pointer.battle_id||battle.content_hash!==pointer.content_hash)throw new Error('DAILY_RECOVERY_CONTEXT_MISMATCH');
  const payload=structuredClone(battle.payload) as BattleCheckpoint;
  if(payload.content_hash!==pointer.content_hash||payload.mode.kind!=='daily'||payload.mode.ticket_day!==pointer.ticket_day||parseDailyRef(payload.mode.ref).id!==pointer.mode_ref)throw new Error('DAILY_RECOVERY_CONTEXT_MISMATCH');
  payload.content_hash=current.content_hash;
  const restored=restoreBattle(payload,content);if(!restored.ok)throw new Error('DAILY_RECOVERY_CHECKPOINT_INVALID');
  const result=advanceUntil(restored.value,restored.value.mode.time_limit_ms,content,modePolicy(restored.value.mode,content));
  if(!result.ok||!result.value.state.terminal_result)throw new Error('DAILY_RECOVERY_REPLAY_FAILED');
  // Too-new starts are simply cancelled without earning or charging anything.
  const elapsed=context.now_ms-context.started_ms!;
  if(elapsed<Math.ceil(result.value.state.game_time_ms/4))return;
  const count=settleDailyRewards(next,result.value.state as BattleCheckpoint,pointer.battle_id,context.server_at,content,false);
  next.daily_objectives.battle_finished=true;
  changes.push(`daily ${pointer.mode_ref}: recovered completed run, ${count} fixed reward boxes`);
}

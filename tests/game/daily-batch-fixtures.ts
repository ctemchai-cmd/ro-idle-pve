import type { BattleCheckpoint } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { fixture, unlocked } from './daily-fixtures.ts';
import { restoreBattle, advanceUntil, serializeBattle } from '../../src/domain/combat/index.ts';
import { dailyPhaseStats, dailyBoss, modePolicy } from '../../src/domain/modes/daily.ts';
import { content, unwrap } from './combat-fixtures.ts';

export function largeDailyFixture() {
 const f=fixture(unlocked(),'2026-10-28T05:00:00Z');f.run('battle.start_daily',{boss_id:'treasury'});
 const state=structuredClone(f.state),battle=structuredClone(f.stored!) as StoredBattle,payload=battle.payload as BattleCheckpoint;
 // Explicit high-power server fixture, never a client input or a balance calibration.
 for(const a of payload.actors.filter(a=>a.team==='player')){a.stats.physical_attack=10000000;a.stats.magical_attack=10000000;a.stats.max_hp=10000000;a.hp=10000000;a.active_slots=[null,null,null,null];}
 const initial=unwrap(restoreBattle(payload,content)),terminal=unwrap(advanceUntil(initial,60000,content,modePolicy(initial.mode,content))).state;
 return {state,battle,terminal:serializeBattle(terminal)};
}
export function phaseCheckpoint(initial: BattleCheckpoint,count:number):BattleCheckpoint {
 const copy=structuredClone(initial);copy.mode.reserved_phase_keys=Array.from({length:count},(_,i)=>String(i+1));copy.mode.daily_phase=count+1;
 const boss=copy.actors.find(a=>a.actor_id==='enemy_front')!;boss.hp=dailyPhaseStats(dailyBoss('treasury',content),count+1,2).hp-1;return copy;
}

import type { ValidatedContent } from '../content/model.ts';
import type { BattleTimeline, SkillTimelineEntry } from '../contracts/presentation.ts';
import { advanceUntil, type BattleState } from '../domain/combat/index.ts';
import { modePolicy } from '../domain/modes/daily.ts';

/** Replay a disposable checkpoint, never the live session. Yield between chunks
 * so forecasting does not monopolize the browser's animation frame. No second
 * implementation of SI/cast/CC/recovery formulas lives in presentation code. */
export async function projectBattleTimeline(initial: BattleState, content: ValidatedContent, yieldTask: () => Promise<void>): Promise<BattleTimeline> {
  let state = initial;
  const entries: SkillTimelineEntry[] = [], open = new Map<string, SkillTimelineEntry>(), byAction = new Map<string, SkillTimelineEntry>();
  const advance = (from: BattleState, until: number) => {
    const result = advanceUntil(from, until, content, modePolicy(from.mode, content));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    return result.value;
  };
  while (!state.terminal_result && state.game_time_ms < state.mode.time_limit_ms) {
    const before = state, batch = advance(state, Math.min(state.mode.time_limit_ms, state.game_time_ms + 2000));
    state = batch.state;
    const finished = new Map<number, SkillTimelineEntry[]>();
    for (const event of batch.events) {
      if (!event.skill_id) continue;
      if (event.type === 'cast_start' || event.type === 'sp_skip' || event.type === 'sphere_skip') {
        const actor = initial.actors.find(row => row.actor_id === event.actor_id);
        const entry: SkillTimelineEntry = { id: `${event.actor_id}:${event.sequence}`, actor_id: event.actor_id, skill_id: event.skill_id, slot: actor?.active_slots.indexOf(event.skill_id) ?? -1, start_ms: event.at_ms, end_ms: event.at_ms, recovery_end_ms: event.at_ms, outcome: event.type === 'cast_start' ? 'pending' : event.type };
        entries.push(entry);
        if (event.type === 'cast_start') { open.set(event.actor_id, entry); if (event.action_id) byAction.set(event.action_id, entry); }
      }
      if (event.type === 'cast_resolve' || event.type === 'cast_interrupt') {
        const entry = open.get(event.actor_id);
        if (!entry || entry.skill_id !== event.skill_id) continue;
        entry.end_ms = event.at_ms; entry.outcome = event.type === 'cast_resolve' ? 'resolved' : 'interrupted';
        const cause = event.type === 'cast_interrupt' && event.action_id ? byAction.get(event.action_id) : undefined;
        if (cause) { entry.interrupted_by = cause.id; cause.interrupts = [...(cause.interrupts ?? []), { actor_id: event.actor_id, skill_id: event.skill_id, at_ms: event.at_ms }]; }
        open.delete(event.actor_id);
        const group = finished.get(event.at_ms) ?? []; group.push(entry); finished.set(event.at_ms, group);
      }
    }
    // Inspect actual completion barriers: recovery can depend on buffs applied
    // by this cast, so reading the engine's checkpoint is safer than estimating.
    let trace = before;
    for (const [at, completed] of finished) {
      trace = advance(trace, at).state;
      for (const entry of completed) {
        const actor = trace.actors.find(row => row.actor_id === entry.actor_id);
        entry.recovery_end_ms = actor?.action_phase === 'after_cast' && actor.phase_started_at === at ? actor.phase_ready_at ?? at : at;
      }
    }
    await yieldTask();
  }
  for (const entry of entries) {
    if (entry.outcome === 'pending') entry.end_ms = state.game_time_ms;
    entry.recovery_end_ms = Math.max(entry.end_ms, Math.min(entry.recovery_end_ms, state.game_time_ms));
  }
  return { entries, through_ms: state.game_time_ms };
}

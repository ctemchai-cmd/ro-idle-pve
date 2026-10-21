import type { BattlePresentationEvent, BattleTimeline, SkillTimelineEntry } from '../contracts/presentation.ts';
import type { BattleState } from '../domain/combat/index.ts';

const loggedTypes = new Set(['cast_start', 'cast_resolve', 'cast_interrupt', 'sp_skip', 'sphere_skip']);
export type SkillHistoryEvent = BattlePresentationEvent & { skill_id: string };
/** Keep only skill facts already emitted by the live engine, in its equal-time event order. */
export function skillHistoryEvents(events: readonly BattlePresentationEvent[], throughMs: number): SkillHistoryEvent[] {
  return events.filter((event): event is SkillHistoryEvent => !!event.skill_id && event.at_ms <= throughMs && loggedTypes.has(event.type));
}

/** No advance/replay, clock or formula calculation: this is a projection of recorded facts.
 * Recovery is deliberately not inferred; the history renderer omits its bar/label. */
export function recordedBattleTimeline(initial: Pick<BattleState, 'actors'>, events: readonly BattlePresentationEvent[], throughMs: number): BattleTimeline {
  const entries: SkillTimelineEntry[] = [], open = new Map<string, SkillTimelineEntry>(), actions = new Map<string, SkillTimelineEntry>();
  for (const event of skillHistoryEvents(events, throughMs)) {
    if (event.type === 'cast_start' || event.type === 'sp_skip' || event.type === 'sphere_skip') {
      const entry: SkillTimelineEntry = { id: `${event.actor_id}:${event.sequence}`, actor_id: event.actor_id, skill_id: event.skill_id,
        slot: initial.actors.find(actor => actor.actor_id === event.actor_id)?.active_slots.indexOf(event.skill_id) ?? -1,
        start_ms: event.at_ms, end_ms: event.at_ms, recovery_end_ms: event.at_ms, outcome: event.type === 'cast_start' ? 'pending' : event.type };
      entries.push(entry);
      if (event.type === 'cast_start') { open.set(event.actor_id, entry); if (event.action_id) actions.set(event.action_id, entry); }
    } else if (event.type === 'cast_resolve' || event.type === 'cast_interrupt') {
      const entry = open.get(event.actor_id); if (!entry || entry.skill_id !== event.skill_id) continue;
      entry.end_ms = event.at_ms; entry.outcome = event.type === 'cast_resolve' ? 'resolved' : 'interrupted'; open.delete(event.actor_id);
      const cause = event.type === 'cast_interrupt' && event.action_id ? actions.get(event.action_id) : undefined;
      if (cause) { entry.interrupted_by = cause.id; cause.interrupts = [...(cause.interrupts ?? []), { actor_id: event.actor_id, skill_id: event.skill_id, at_ms: event.at_ms }]; }
    }
  }
  for (const entry of entries) { if (entry.outcome === 'pending') entry.end_ms = throughMs; entry.recovery_end_ms = entry.end_ms; }
  return { entries, through_ms: throughMs };
}

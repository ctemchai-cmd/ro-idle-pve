import type { BattlePresentationEvent } from '../contracts/presentation.ts';

export const MULTI_HIT_HOLD_MS = 1000;
export const MULTI_HIT_FADE_MS = 400;
/** Give simultaneous direct-skill hits distinct visual contacts when no native/projectile stagger exists. */
export const MULTI_HIT_FALLBACK_MS = 90;
export interface MultiHitFrame {
  source: string; target: string; skill: string; action: string;
  amount: number; hits: number; at_ms: number; age_ms: number; alpha: number;
}
interface TimedHit { event: BattlePresentationEvent; impact_ms: number }

/** A total belongs to one direct skill use on one recipient, never to a character's whole damage stream. */
function groupKey(event: BattlePresentationEvent): string | null {
  return event.type === 'damage' && event.origin === 'skill' && event.skill_id && event.skill_id !== 'normal_attack' && event.action_id && event.target_id && event.amount !== undefined && Number.isFinite(event.amount) && event.amount >= 0
    ? JSON.stringify([event.actor_id, event.skill_id, event.action_id, event.target_id]) : null;
}
export function multiHitOrdinals(events: readonly BattlePresentationEvent[]): ReadonlyMap<number, number> {
  const groups = new Map<string, BattlePresentationEvent[]>(), ordinals = new Map<number, number>();
  for (const event of events) { const key = groupKey(event); if (key) { const group = groups.get(key) ?? []; group.push(event); groups.set(key, group); } }
  for (const group of groups.values()) if (group.length > 1) {
    const sameEffect = group.every(event => event.effect_id === group[0]!.effect_id);
    group.forEach((event, index) => ordinals.set(event.sequence, sameEffect ? event.hit_index ?? index : index));
  }
  return ordinals;
}
/** Presentation-only history: derive the visible sum at the injected clock, so drawing twice cannot add damage twice. */
export class MultiHitNumbers {
  private readonly groups = new Map<string, Map<number, TimedHit>>();
  queue(event: BattlePresentationEvent, impactMs: number): void {
    const key = groupKey(event); if (!key) return;
    const hits = this.groups.get(key) ?? new Map<number, TimedHit>();
    if (!hits.has(event.sequence)) hits.set(event.sequence, { event, impact_ms: impactMs });
    this.groups.set(key, hits);
    while (this.groups.size > 128) this.groups.delete(this.groups.keys().next().value!);
  }
  frames(now: number, focusedActor: string, motion = true): MultiHitFrame[] {
    const visible = new Map<string, { frame: MultiHitFrame; started: number }>();
    for (const [key, group] of this.groups) {
      const hits = [...group.values()];
      const latest = Math.max(...hits.map(hit => Math.max(hit.event.at_ms, hit.impact_ms)));
      if (now >= latest + MULTI_HIT_HOLD_MS + MULTI_HIT_FADE_MS) { this.groups.delete(key); continue; }
      if (hits.length < 2 || hits[0]!.event.actor_id !== focusedActor) continue;
      const due = hits.filter(hit => (motion ? hit.impact_ms : hit.event.at_ms) <= now).sort((a, b) => (motion ? a.impact_ms - b.impact_ms : a.event.at_ms - b.event.at_ms) || a.event.sequence - b.event.sequence);
      if (!due.length) continue;
      const amount = due.reduce((sum, hit) => sum + hit.event.amount!, 0), last = due.at(-1)!, event = last.event;
      const at = motion ? last.impact_ms : event.at_ms, age = now - at;
      if (amount <= 0 || age >= MULTI_HIT_HOLD_MS + MULTI_HIT_FADE_MS) continue;
      const started = motion ? due[0]!.impact_ms : due[0]!.event.at_ms;
      const previous = visible.get(event.target_id!);
      if (!previous || started >= previous.started) visible.set(event.target_id!, { started, frame: { source: event.actor_id, target: event.target_id!, skill: event.skill_id!, action: event.action_id!, amount, hits: due.length, at_ms: at, age_ms: age, alpha: Math.min(1, (MULTI_HIT_HOLD_MS + MULTI_HIT_FADE_MS - age) / MULTI_HIT_FADE_MS) } });
    }
    return [...visible.values()].map(row => row.frame);
  }
}

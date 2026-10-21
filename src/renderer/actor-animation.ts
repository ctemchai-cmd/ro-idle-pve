import type { ActorRenderView, BattlePresentationEvent } from '../contracts/presentation.ts';
import type { ActorPreset } from '../contracts/assets.ts';
import { actorDuration, type ActorParts } from './native.mjs';

/** Swing fields a battle rig takes from its preset: main attack, optional variant cycle and bow release frame. */
export function presetSwing(preset: ActorPreset): Pick<ActorParts, 'attackIndex' | 'attackVariants' | 'releaseFrame'> {
  return { attackIndex: preset.attack_source_action_index, ...(preset.attack_variant_indices?.length ? { attackVariants: preset.attack_variant_indices } : {}), ...(preset.attack_release_frame != null ? { releaseFrame: preset.attack_release_frame } : {}) };
}

/** Presentation clock only. Clip selection cannot change a combat deadline. */
export class ActorAnimation {
  private readonly poses = new Map<string, { state: string; at: number; duration: number; rate: number }>();
  private readonly swings = new Map<string, { state: string; rate: number }>();
  private readonly swingCount = new Map<string, number>();
  private readonly lastSwingAt = new Map<string, number>();
  constructor(private readonly parts: (id: string) => ActorParts | undefined) {}
  /**
   * Pose and playback rate of one swing, memoised per event so impact timing and the drawn pose agree.
   * Normal attacks cycle the preset's variants in order (skills keep the preset swing) and, like RO's
   * ASPD-scaled attack motion, play faster when attacks come quicker than the native clip, so a bow
   * never starts its next draw before the previous arrow has left.
   */
  swing(event: BattlePresentationEvent): { state: string; rate: number } {
    if (event.type !== 'normal_attack') return { state: 'attack', rate: 1 };
    const key = `${event.actor_id}:${event.at_ms}:${event.sequence}`, known = this.swings.get(key); if (known) return known;
    const parts = this.parts(event.actor_id), variants = parts?.attackVariants?.length ?? 0, count = this.swingCount.get(event.actor_id) ?? 0;
    const state = variants >= 2 && count % variants ? `attack${count % variants + 1}` : 'attack';
    const previous = this.lastSwingAt.get(event.actor_id), full = parts ? actorDuration(parts, state) : 0, gap = previous === undefined ? Infinity : event.at_ms - previous;
    const swing = { state, rate: full > 0 && gap > 0 && gap < full / .9 ? Math.max(.35, gap * .9 / full) : 1 };
    this.swingCount.set(event.actor_id, count + 1); this.lastSwingAt.set(event.actor_id, event.at_ms); this.swings.set(key, swing);
    if (this.swings.size > 256) this.swings.delete(this.swings.keys().next().value!);
    return swing;
  }
  attackState(event: BattlePresentationEvent): string { return this.swing(event).state; }
  accept(event: BattlePresentationEvent): void {
    const parts = this.parts(event.actor_id);
    if (event.type === 'normal_attack' || event.type === 'cast_resolve') { const { state, rate } = this.swing(event); this.poses.set(event.actor_id, { state, at: event.at_ms, duration: parts ? actorDuration(parts, state) * rate : 0, rate }); }
    if (event.type === 'cast_start' || event.type === 'cast_interrupt' || event.type === 'revive') this.poses.delete(event.actor_id);
    if (event.type === 'death') this.poses.set(event.actor_id, { state: 'dead', at: event.at_ms, duration: Infinity, rate: 1 });
    if (event.type === 'damage' && event.target_id && (event.amount ?? 0) > 0) {
      const current = this.poses.get(event.target_id), target = this.parts(event.target_id);
      // Multi-hit damage cannot restart flinch every frame or truncate a swing.
      if ((!current || event.at_ms >= current.at + current.duration) && target) this.poses.set(event.target_id, { state: 'hurt', at: event.at_ms, duration: actorDuration(target, 'hurt'), rate: 1 });
    }
  }
  sample(actor: ActorRenderView, now: number, motion = true): { state: string; elapsed: number } {
    const pose = this.poses.get(actor.actor_id), active = pose && now - pose.at < pose.duration ? pose : null;
    const state = actor.hp <= 0 ? 'dead' : actor.phase === 'casting' ? 'standby' : actor.spatial?.moving ? 'walk' : active?.state ?? 'idle';
    const beganAt = actor.hp <= 0 ? pose?.at ?? 0 : actor.phase === 'casting' ? actor.phase_started_at : active?.at ?? (pose ? pose.at + pose.duration : 0);
    // A sped-up swing reports native clip time so frame selection and rig offsets stay on the ACT clock.
    const rate = active && state === active.state ? active.rate : 1;
    return { state, elapsed: motion ? Math.max(0, now - beganAt) / rate : 0 };
  }
  /** Continuous movement of the complete rig between native sprite poses. */
  offset(state: string, elapsed: number, id: string, enabled: boolean): { x: number; y: number } {
    if (!enabled || state === 'dead') return { x: 0, y: 0 };
    const parts = this.parts(id), duration = parts ? actorDuration(parts, state) : 1;
    const t = Math.min(1, Math.max(0, elapsed / Math.max(1, duration)));
    if (state.startsWith('attack')) { const swing = Math.sin(Math.PI * t); return { x: 4 * swing, y: -2 * swing }; }
    if (state === 'hurt') return { x: -5 * Math.sin(Math.PI * t), y: 0 };
    if (state === 'standby') return { x: 0, y: -1.5 * Math.sin(elapsed / 300) };
    return { x: 0, y: parts?.head ? -.8 * Math.sin(elapsed / 650) : 0 };
  }
}

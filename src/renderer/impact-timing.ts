import { actorAction, type ActorParts } from './native.mjs';
import type { ImpactEffect, ProjectileSpec } from '../contracts/assets.ts';
import { impactAt } from './projectiles.ts';

/** ACT attack-sound frame is our presentation contact/release marker. */
export function attackContactMs(parts: ActorParts | undefined, state = 'attack'): number {
  if (!parts) return 0;
  const action = actorAction(parts, state); if (!action?.frames.length) return 0;
  const events = parts.body.meta.animation?.events ?? [];
  const marked = action.frames.findIndex(frame => frame.event !== undefined && /(?:^|[_/\\])(?:attack|hit)(?:[_.\d]|$)/i.test(events[frame.event] ?? ''));
  // A bow's ACT sound marks the draw; the preset names the frame where the arrow actually leaves.
  const release = state === 'attack' && parts.releaseFrame != null ? Math.min(parts.releaseFrame, action.frames.length - 1) : -1;
  const index = release >= 0 ? release : marked >= 0 ? marked : Math.floor((action.frames.length - 1) / 2);
  return index * Math.max(1, action.frame_duration_ms);
}
export function alignProjectiles(specs: readonly ProjectileSpec[], contactMs: number): readonly ProjectileSpec[] {
  return specs.map(spec => ({ ...spec, release_ms: Math.max(spec.release_ms, contactMs) }));
}
export function visualImpactMs(specs: readonly ProjectileSpec[], contactMs: number, hit = 0, impact?: ImpactEffect | null): number {
  return impactAt(specs, contactMs, hit, impact);
}

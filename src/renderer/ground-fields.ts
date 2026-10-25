import type { ActorRenderView } from '../contracts/presentation.ts';
import { drawNativeImpact, nativeImpactDuration, nativeImpactProfile, type NativeImpactProfile, type LoadedNativeImpact } from './native-impact.ts';

export interface GroundFieldProfile extends NativeImpactProfile {
  status_ids: readonly string[];
  anchor: 'source' | 'targets';
  floor_meta?: string;
  floor_size?: readonly [number, number];
  floor_alpha?: number;
  floor_additive?: boolean;
  floor_black_key?: boolean;
  floor_hue_rotate_deg?: number;
}
export interface LoadedGroundField extends LoadedNativeImpact { config: GroundFieldProfile; floorImage?: HTMLImageElement | HTMLCanvasElement }
export interface GroundField {
  key: string; skill: string; source: string; targets: string[];
  applied_at: number; expires_at: number;
}
export interface GroundFieldFrame extends GroundField {
  origin: readonly [number, number]; meta: string; native_draws: number;
}
/** Explicit presentation bindings: no name/root inference and no gameplay imports. */
export function groundFieldProfiles(visuals: object, presentationIds?: readonly string[]): Readonly<Record<string, GroundFieldProfile>> {
  const profiles = (visuals as { ground_fields?: Record<string, GroundFieldProfile> }).ground_fields ?? {};
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) throw Error('INVALID_GROUND_FIELDS');
  for (const [id, p] of Object.entries(profiles)) {
    if (!p || presentationIds && !presentationIds.includes(id) || !p.meta?.endsWith('.meta.json') || p.native_only !== true ||
        !Number.isFinite(p.scale) || p.scale <= 0 || p.scale > 3 || !Number.isFinite(p.lift) ||
        !['source', 'targets'].includes(p.anchor) || !Array.isArray(p.status_ids) || !p.status_ids.length ||
        p.status_ids.some(s => typeof s !== 'string' || !s.length) || new Set(p.status_ids).size !== p.status_ids.length) throw Error('INVALID_GROUND_FIELD');
    nativeImpactProfile(p);
    if (p.floor_meta !== undefined && (!p.floor_meta.endsWith('.meta.json') || !Array.isArray(p.floor_size) || p.floor_size.length !== 2 ||
        p.floor_size.some(n => !Number.isFinite(n) || n <= 0 || n > 600) || !Number.isFinite(p.floor_alpha) || p.floor_alpha! <= 0 || p.floor_alpha! > 1 ||
        typeof p.floor_additive !== 'boolean' || p.floor_black_key !== undefined && typeof p.floor_black_key !== 'boolean' || p.floor_hue_rotate_deg !== undefined && (!Number.isFinite(p.floor_hue_rotate_deg) || Math.abs(p.floor_hue_rotate_deg) > 360))) throw Error('INVALID_GROUND_FLOOR');
  }
  return profiles;
}
/** One visual per source/skill, never per recipient or buff stack. Only the
 * authored field statuses count; an Awaken self-buff cannot extend a field. */
export function groundFields(actors: readonly ActorRenderView[], gameMs: number, profileFor: (skill: string) => GroundFieldProfile | undefined): GroundField[] {
  const fields = new Map<string, GroundField>();
  for (const target of actors) {
    if (target.hp <= 0) continue;
    for (const group of target.statuses ?? []) {
      const skill = group.icon_skill_id, p = skill && profileFor(skill); if (!skill || !p) continue;
      for (const status of group.instances) {
        if (!p.status_ids.includes(status.status_id) || status.applied_at === null || status.applied_at > gameMs || status.expires_at <= gameMs) continue;
        const key = JSON.stringify([status.source_actor_id, skill]), prior = fields.get(key);
        if (prior) {
          prior.applied_at = Math.max(prior.applied_at, status.applied_at);
          prior.expires_at = Math.max(prior.expires_at, status.expires_at);
          if (!prior.targets.includes(target.actor_id)) prior.targets.push(target.actor_id);
        } else fields.set(key, { key, skill, source: status.source_actor_id, targets: [target.actor_id], applied_at: status.applied_at, expires_at: status.expires_at });
      }
    }
  }
  return [...fields.values()].sort((a, b) => a.key.localeCompare(b.key));
}
/** Ground stays where the application landed; a later cast may place it anew.
 * This cache is renderer-owned and discarded with the battle. */
export class GroundFieldRenderer {
  private readonly anchors = new Map<string, { at: number; point: readonly [number, number]; extent: readonly [number, number] }>();
  draw(ctx: CanvasRenderingContext2D, actors: readonly ActorRenderView[], gameMs: number, presentationMs: number, motion: boolean,
       loaded: ReadonlyMap<string, LoadedGroundField>, point: (actor: ActorRenderView) => readonly [number, number]): GroundFieldFrame[] {
    const fields = groundFields(actors, gameMs, id => loaded.get(id)?.config), active = new Set(fields.map(f => f.key)), frames: GroundFieldFrame[] = [];
    for (const field of fields) {
      const native = loaded.get(field.skill)!, p = native.config;
      let origin = this.anchors.get(field.key);
      if (!origin || origin.at !== field.applied_at) {
        const targets = actors.filter(a => p.anchor === 'source' ? a.actor_id === field.source : field.targets.includes(a.actor_id));
        if (!targets.length) continue;
        const points = targets.map(point);
        const xs = points.map(v => v[0]), ys = points.map(v => v[1]), left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
        origin = { at: field.applied_at, point: [(left + right) / 2, (top + bottom) / 2], extent: [right - left, bottom - top] };
        this.anchors.set(field.key, origin);
      }
      const length = nativeImpactDuration(p, native.asset); if (length <= 0) continue;
      const elapsed = motion ? Math.max(0, presentationMs - field.applied_at) % length : length * .4;
      let native_draws = 0;
      if (p.floor_meta) {
        const floor = native.floorImage; if (!floor) throw Error('GROUND_FLOOR_NOT_PREPARED');
        const width = p.floor_size![0] + origin.extent[0], height = p.floor_size![1] + origin.extent[1];
        const fade = motion ? Math.min(1, Math.max(0, presentationMs - field.applied_at) / 160, Math.max(0, field.expires_at - presentationMs) / 250) : 1;
        ctx.save(); ctx.globalAlpha *= p.floor_alpha! * fade; ctx.globalCompositeOperation = p.floor_additive ? 'lighter' : 'source-over';
        ctx.imageSmoothingEnabled = true; if (p.floor_hue_rotate_deg) ctx.filter = `hue-rotate(${p.floor_hue_rotate_deg}deg)`;
        ctx.drawImage(floor, origin.point[0] - width / 2, origin.point[1] - height / 2, width, height); ctx.restore(); native_draws++;
      }
      native_draws += drawNativeImpact(ctx, native, elapsed, origin.point[0], origin.point[1] - p.lift);
      frames.push({ ...field, origin: origin.point, meta: p.meta, native_draws });
    }
    for (const key of this.anchors.keys()) if (!active.has(key)) this.anchors.delete(key);
    return frames;
  }
}

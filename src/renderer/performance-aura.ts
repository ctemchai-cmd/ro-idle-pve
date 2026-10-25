import type { ActorRenderView } from '../contracts/presentation.ts';
import type { NativeAsset } from './native.mjs';

export interface PerformanceAuraConfig {
  ring_meta: string; note_meta: string;
  ring_size: readonly [number, number]; note_size: number;
  period_ms: number; alpha: number;
  styles: Readonly<Record<string, { hue_rotate_deg: number; note_meta?: string; note_size?: number; note_additive?: boolean }>>;
  skills: Readonly<Record<string, string>>;
}
export interface PerformanceAura {
  source: string; style: string; skills: string[];
  started_at: number | null; expires_at: number;
}
export interface LoadedPerformanceAura { config: PerformanceAuraConfig; ring: NativeAsset; note: NativeAsset; notes: ReadonlyMap<string, NativeAsset> }
/** Rendering config only; never extends the gameplay/status contract. */
export function performanceAuraConfig(visuals: object, skillIds?: readonly string[]): PerformanceAuraConfig | null {
  const value = (visuals as { performance_auras?: PerformanceAuraConfig }).performance_auras;
  if (!value) return null;
  if (!value.ring_meta?.endsWith('.meta.json') || !value.note_meta?.endsWith('.meta.json') ||
      !Array.isArray(value.ring_size) || value.ring_size.length !== 2 || !value.ring_size.every(n => Number.isFinite(n) && n > 0 && n <= 600) ||
      !Number.isFinite(value.note_size) || value.note_size <= 0 || value.note_size > 100 ||
      !Number.isFinite(value.period_ms) || value.period_ms < 600 || value.period_ms > 10000 ||
      !Number.isFinite(value.alpha) || value.alpha <= 0 || value.alpha > 1 ||
      !value.styles || !Object.keys(value.styles).length || Object.values(value.styles).some(s => !Number.isFinite(s.hue_rotate_deg) || s.note_meta !== undefined && !s.note_meta.endsWith('.meta.json') || s.note_additive !== undefined && typeof s.note_additive !== 'boolean' || s.note_size !== undefined && (!Number.isFinite(s.note_size) || s.note_size <= 0 || s.note_size > 100)) ||
      !value.skills || Object.entries(value.skills).some(([id, style]) => !Object.hasOwn(value.styles, style) || skillIds && !skillIds.includes(id))) throw Error('INVALID_PERFORMANCE_AURA');
  return value;
}
/** Merge independent applications for display only. Recipient/source IDs and
 * expiry come from real status instances; never infer them from a cast cue. */
export function performanceAuras(actors: readonly ActorRenderView[], gameMs: number, config: PerformanceAuraConfig): PerformanceAura[] {
  const living = new Set(actors.filter(a => a.hp > 0).map(a => a.actor_id)), auras = new Map<string, PerformanceAura>();
  for (const target of actors) {
    if (target.hp <= 0) continue;
    for (const group of target.statuses ?? []) {
      const id = group.icon_skill_id, style = id && Object.hasOwn(config.skills, id) ? config.skills[id] : undefined;
      if (!id || !style) continue;
      for (const status of group.instances) {
        if (!living.has(status.source_actor_id) || status.expires_at <= gameMs || status.applied_at !== null && status.applied_at > gameMs) continue;
        const prior = auras.get(status.source_actor_id);
        if (prior) {
          prior.expires_at = Math.max(prior.expires_at, status.expires_at);
          if (status.applied_at !== null) prior.started_at = Math.min(prior.started_at ?? status.applied_at, status.applied_at);
          if (!prior.skills.includes(id)) prior.skills.push(id);
          if (id < prior.skills[0]!) prior.style = style;
          prior.skills.sort();
        } else auras.set(status.source_actor_id, { source: status.source_actor_id, style, skills: [id], started_at: status.applied_at, expires_at: status.expires_at });
      }
    }
  }
  return [...auras.values()].sort((a, b) => a.source.localeCompare(b.source));
}
/** Genuine bitmaps only: a ground ring and three notes. Virtual presentation
 * time drives motion; reduced-motion keeps a static indication of the effect. */
export function drawPerformanceAura(ctx: CanvasRenderingContext2D, loaded: LoadedPerformanceAura, aura: PerformanceAura, presentationMs: number, motion: boolean, x: number, y: number): number {
  const p = loaded.config, age = aura.started_at === null ? 1000 : Math.max(0, presentationMs - aura.started_at);
  const fade = Math.min(1, age / 220, Math.max(0, aura.expires_at - presentationMs) / 350);
  if (fade <= 0) return 0;
  const phase = motion ? presentationMs / p.period_ms * 2 * Math.PI : 0, pulse = motion ? 1 + .035 * Math.sin(phase * 2) : 1;
  const [width, height] = p.ring_size;
  ctx.save(); ctx.translate(x, y + 3); ctx.globalCompositeOperation = 'lighter';
  const hue = p.styles[aura.style]!.hue_rotate_deg; if (hue) ctx.filter = `sepia(1) saturate(4) hue-rotate(${hue}deg)`;
  ctx.globalAlpha = p.alpha * fade;
  ctx.drawImage(loaded.ring.image, -width * pulse / 2, -height * pulse / 2, width * pulse, height * pulse);
  ctx.globalAlpha = p.alpha * fade * .28;
  ctx.drawImage(loaded.ring.image, -width * .46, -height * .46, width * .92, height * .92);
  const style = p.styles[aura.style]!, note = style.note_meta ? loaded.notes.get(style.note_meta) : loaded.note, noteSize = style.note_size ?? p.note_size;
  if (!note) throw Error('PERFORMANCE_TEXTURE_NOT_PREPARED');
  // Native song symbols keep their original colors; only the shared ring is tinted.
  ctx.filter = 'none';
  ctx.globalCompositeOperation = style.note_additive ? 'lighter' : 'source-over';
  for (let i = 0; i < 3; i++) {
    const angle = phase + i * 2 * Math.PI / 3, dx = Math.cos(angle) * width * .22, dy = Math.sin(angle) * height * .09 - 14;
    ctx.globalAlpha = fade * (.6 + .22 * Math.sin(angle));
    ctx.drawImage(note.image, dx - noteSize / 2, dy - noteSize, noteSize, noteSize);
  }
  ctx.restore(); return 5;
}

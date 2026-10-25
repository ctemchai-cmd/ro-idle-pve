import type { CombatVisuals, ImpactEffect, ProjectileSpec } from '../contracts/assets.ts';
import type { BattlePresentationEvent } from '../contracts/presentation.ts';
import { nativeImpactProfile } from './native-impact.ts';
import { performanceAuraConfig } from './performance-aura.ts';

export interface ProjectileCue { at_ms: number; source_id: string; target_id: string; spec: ProjectileSpec; from?: readonly [number, number] }
export function validateCombatVisuals(value: CombatVisuals, skillIds: readonly string[], presentationIds?: readonly string[]): void {
  const fail = () => { throw new Error('INVALID_COMBAT_VISUALS'); };
  if (!value || value.schema_version !== 1 || !value.numbers || !value.normal_attacks || !value.skills) fail();
  performanceAuraConfig(value, skillIds);
  if (!value.numbers.meta?.endsWith('.meta.json') || !value.numbers.critical_meta?.endsWith('.meta.json') || !Number.isInteger(value.numbers.critical_frame) || value.numbers.critical_frame < 0 || value.numbers.digit_frames?.length !== 10 || value.numbers.digit_frames.some(frame => !Number.isInteger(frame) || frame < 0)) fail();
  for (const id of Object.keys(value.skills)) if (!skillIds.includes(id)) fail();
  for (const row of Object.values(value.skills)) if (row.hue_rotate_deg !== undefined && (!Number.isFinite(row.hue_rotate_deg) || Math.abs(row.hue_rotate_deg) > 360)) fail();
  for (const row of [...Object.values(value.normal_attacks), ...Object.values(value.skills)]) {
    if (!Array.isArray(row.special_sfx) || row.special_sfx.length > 8) fail();
    for (const spec of row.special_sfx) {
      if (!spec || spec.kind !== 'projectile' || !['arrow', 'orb', 'bullet', 'spear'].includes(spec.shape) || !/^#[a-f0-9]{6}$/i.test(spec.color) || ![undefined, 'line', 'sky'].includes(spec.path)) fail();
      for (const [key, minimum, maximum] of [['travel_ms', 1, 3000], ['release_ms', 0, 1000], ['count', 1, 8], ['stagger_ms', 0, 500], ['arc_height', -300, 300]] as const) if (!Number.isInteger(spec[key]) || spec[key] < minimum || spec[key] > maximum) fail();
    }
  }
  for (const [id, impact] of Object.entries(value.impacts ?? {})) {
    nativeImpactProfile(impact);
    if (presentationIds && !presentationIds.includes(id)) fail();
    if (!impact?.meta?.endsWith('.meta.json') || !(impact.scale > 0 && impact.scale <= 3)) fail();
    if (impact.duration_ms !== undefined && (!Number.isInteger(impact.duration_ms) || impact.duration_ms < 1 || impact.duration_ms > 10000)) fail();
    for (const [key, minimum, maximum] of [['start_ms', 0, 10000], ['lead_ms', 0, 3000], ['stagger_ms', 0, 1000], ['lift', -200, 300]] as const) if (!Number.isInteger(impact[key]) || impact[key] < minimum || impact[key] > maximum) fail();
  }
}
/** Visual moment of hit N: projectile arrival, else the swing contact plus the impact's own lead/stagger. */
export function impactAt(specs: readonly ProjectileSpec[], contactMs: number, hit = 0, impact?: ImpactEffect | null): number {
  return specs.length ? impactDelay(specs, hit) : contactMs + (impact ? impact.lead_ms + hit * impact.stagger_ms : 0);
}
export function projectileLifetime(spec: ProjectileSpec): number { return spec.release_ms + spec.travel_ms + (spec.count - 1) * spec.stagger_ms + 140; }
export function impactDelay(specs: readonly ProjectileSpec[], hit = 0): number { return specs.length ? Math.max(...specs.map(spec => spec.release_ms + spec.travel_ms + Math.min(hit, spec.count - 1) * spec.stagger_ms)) : 0; }
export function isFocusedDamage(event: BattlePresentationEvent, focus: string): boolean { return event.type === 'damage' && event.actor_id === focus && (event.amount ?? 0) > 0; }
/** Presentation trajectory. It never emits a hit or consumes gameplay RNG. */
export function projectilePoint(spec: ProjectileSpec, from: readonly number[], to: readonly number[], elapsed: number, index: number): { x: number; y: number; angle: number; progress: number } | null {
  const t = (elapsed - spec.release_ms - index * spec.stagger_ms) / spec.travel_ms;
  if (t < 0 || t > 1) return null;
  if (spec.path === 'sky') {
    // RO bolts drop onto the target from high above, accelerating; lanes fan the volley out.
    const lane = (index - (spec.count - 1) / 2) * 24, sx = to[0]! + lane - 70, sy = to[1]! - 360, ex = to[0]! + lane * .35, ey = to[1]! + 25, k = t * t;
    return { x: sx + (ex - sx) * k, y: sy + (ey - sy) * k, angle: Math.atan2(ey - sy, ex - sx), progress: t };
  }
  const dx = to[0]! - from[0]!, dy = to[1]! - from[1]!, spread = (index - (spec.count - 1) / 2) * 9;
  return { x: from[0]! + dx * t, y: from[1]! + dy * t - 4 * spec.arc_height * t * (1 - t) + spread * Math.sin(Math.PI * t), angle: Math.atan2(dy - 4 * spec.arc_height * (1 - 2 * t) + spread * Math.PI * Math.cos(Math.PI * t), dx), progress: t };
}
export function drawProjectile(context: CanvasRenderingContext2D, spec: ProjectileSpec, point: NonNullable<ReturnType<typeof projectilePoint>>): void {
  context.save(); context.translate(point.x, point.y); context.rotate(point.angle);
  context.lineCap = 'round'; context.lineJoin = 'round';
  if (spec.shape === 'arrow') {
    context.strokeStyle = '#433b28'; context.lineWidth = 4; context.beginPath(); context.moveTo(-25, 0); context.lineTo(13, 0); context.stroke();
    context.strokeStyle = spec.color; context.lineWidth = 2; context.stroke();
    context.fillStyle = '#f7f0d5'; context.strokeStyle = '#4c5149'; context.lineWidth = 1; context.beginPath(); context.moveTo(20, 0); context.lineTo(9, -5); context.lineTo(12, 0); context.lineTo(9, 5); context.closePath(); context.fill(); context.stroke();
    context.fillStyle = '#eee5c9'; context.beginPath(); context.moveTo(-23, 0); context.lineTo(-29, -6); context.lineTo(-17, -4); context.lineTo(-12, 0); context.lineTo(-17, 4); context.lineTo(-29, 6); context.closePath(); context.fill();
  } else if (spec.shape === 'spear') {
    // Elemental spear: long glowing tail, bright core and a hard tip (fire/ice bolts).
    // Normal blending keeps the element colour on bright fields; additive washed fire out to yellow.
    const tail = context.createLinearGradient(-92, 0, 20, 0); tail.addColorStop(0, 'transparent'); tail.addColorStop(.5, spec.color + 'b0'); tail.addColorStop(1, spec.color);
    context.shadowColor = spec.color; context.shadowBlur = 14;
    context.fillStyle = tail; context.beginPath(); context.moveTo(-92, 0); context.lineTo(-8, -8); context.lineTo(22, 0); context.lineTo(-8, 8); context.closePath(); context.fill();
    context.shadowBlur = 0; context.strokeStyle = 'rgba(40,20,10,.35)'; context.lineWidth = 1; context.stroke();
    context.fillStyle = '#fff6dc'; context.beginPath(); context.moveTo(-40, 0); context.lineTo(-4, -3); context.lineTo(20, 0); context.lineTo(-4, 3); context.closePath(); context.fill();
  } else {
    const tail = context.createLinearGradient(-45, 0, 10, 0); tail.addColorStop(0, 'transparent'); tail.addColorStop(1, spec.color);
    context.fillStyle = tail; context.beginPath(); context.moveTo(-45, 0); context.lineTo(0, -5); context.lineTo(12, 0); context.lineTo(0, 5); context.closePath(); context.fill();
    context.shadowColor = spec.color; context.shadowBlur = 12; context.fillStyle = spec.color; context.beginPath(); context.ellipse(0, 0, spec.shape === 'orb' ? 9 : 12, spec.shape === 'orb' ? 7 : 3, 0, 0, Math.PI * 2); context.fill();
    context.shadowBlur = 0; context.fillStyle = '#fffce6'; context.beginPath(); context.ellipse(2, -1, 4, 2, 0, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

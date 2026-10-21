import type { BattleActor, BattleCheckpoint } from '../../contracts/index.ts';
import type { ActorInput, BattleInput } from './model.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { selectTargets } from './program.ts';
import { compareId } from './scheduler.ts';
import { statusDefinition } from './status.ts';

export const MOTION_STEP_MS = 50;
export function validateSpatialInput(input: Pick<BattleInput, 'arena'> & { actors: readonly Pick<ActorInput, 'spatial'>[] }): void {
  if (!input.arena) { if (input.actors.some(actor => actor.spatial)) throw new Error('SPATIAL_REQUIRES_ARENA'); return; }
  const { width, height, step_ms } = input.arena;
  if (Object.keys(input.arena).length !== 3 || !Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100 || width > 10000 || height > 10000 || step_ms !== MOTION_STEP_MS) throw new Error('INVALID_ARENA');
  for (const actor of input.actors) {
    const s = actor.spatial;
    if (!s || ![s.x, s.y, s.move_speed, s.radius, s.normal_range].every(Number.isFinite) || s.radius < 1 || s.radius > 100 || s.move_speed < 0 || s.move_speed > 1000 || s.normal_range < s.radius || s.normal_range > 10000 || s.x < s.radius || s.x > width - s.radius || s.y < s.radius || s.y > height - s.radius) throw new Error('INVALID_SPATIAL_PROFILE');
  }
}
export function normalTarget(actor: BattleActor, actors: readonly BattleActor[]): BattleActor | undefined {
  return selectTargets(actor, { team: 'enemies', life: 'living', select: actor.spatial ? 'nearest' : 'front_first', count: null, phase: 'cast_resolve', missing: 'skip' }, actors, () => { throw new Error('UNEXPECTED_MOTION_RNG'); })[0];
}
export function inNormalRange(actor: BattleActor, target: BattleActor): boolean {
  return !actor.spatial || !!target.spatial && Math.hypot(actor.spatial.x - target.spatial.x, actor.spatial.y - target.spatial.y) <= actor.spatial.normal_range + .00001;
}
/** Simultaneous 20Hz integration, independent of advanceUntil call boundaries. No obstacles/navmesh. */
export function moveActors(state: BattleCheckpoint, content: ValidatedContent, dueIds: ReadonlySet<string>): void {
  if (!state.arena) return;
  // Summons are fixed markers: they neither move nor take part in separation.
  const actors = state.actors.filter(actor => actor.hp > 0 && actor.spatial && actor.kind !== 'summon').sort((a, b) => compareId(a.actor_id, b.actor_id));
  const movementSpeed = (actor: BattleActor) => actor.spatial!.move_speed * Math.max(0, 1 + actor.stats.move_speed_percent);
  const canMove = (actor: BattleActor) => dueIds.has(actor.actor_id) && actor.action_phase !== 'casting' && actor.action_policy.kind === 'rotation' && actor.action_policy.normal_attack_enabled && !actor.statuses.some(status => statusDefinition(content, status.status_id).tags.includes('hard_cc')) && movementSpeed(actor) > 0;
  const next = actors.map(actor => {
    const s = actor.spatial!, target = normalTarget(actor, actors), t = target?.spatial;
    let x = s.x, y = s.y;
    if (t && canMove(actor)) {
      const dx = t.x - s.x, dy = t.y - s.y, distance = Math.hypot(dx, dy);
      const step = Math.min(movementSpeed(actor) * MOTION_STEP_MS / 1000, Math.max(0, distance - Math.max(s.normal_range - 4, s.radius + t.radius)));
      if (distance > 0) { x += dx / distance * step; y += dy / distance * step; }
    }
    return { actor, x, y, target: target?.actor_id ?? null, movable: canMove(actor) };
  });
  // Local separation keeps allies from occupying one pixel. Casting/CC actors stay anchored.
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < next.length; i++) for (let j = i + 1; j < next.length; j++) {
    const a = next[i]!, b = next[j]!, dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy), minimum = a.actor.spatial!.radius + b.actor.spatial!.radius + 6;
    if (distance >= minimum || !a.movable && !b.movable) continue;
    const ux = distance ? dx / distance : 0, uy = distance ? dy / distance : 1;
    const push = (minimum - distance) / (Number(a.movable) + Number(b.movable));
    if (a.movable) { a.x -= ux * push; a.y -= uy * push; }
    if (b.movable) { b.x += ux * push; b.y += uy * push; }
  }
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  for (const row of next) {
    if (!dueIds.has(row.actor.actor_id)) continue;
    const s = row.actor.spatial!;
    s.previous_x = s.x; s.previous_y = s.y; s.updated_at = state.game_time_ms;
    s.x = round(Math.max(s.radius, Math.min(state.arena.width - s.radius, row.x)));
    s.y = round(Math.max(s.radius, Math.min(state.arena.height - s.radius, row.y)));
    s.moving = Math.hypot(s.x - s.previous_x, s.y - s.previous_y) > .00001;
    s.target_id = row.target;
  }
}

import type { ActorRenderView, BattlePresentationEvent, BattleRenderView, BattleScene } from '../contracts/presentation.ts';
import { drawActor, drawEffect, drawProcedural, type NativeAsset } from './native.mjs';
import { AssetPack } from './pack.ts';
import { ActorAnimation } from './actor-animation.ts';
import type { ImpactEffect, ProjectileSpec } from '../contracts/assets.ts';
import { DamageNumbers, NUMBER_FLIGHT_MS, numberFlight } from './damage-numbers.ts';
import { drawProjectile, isFocusedDamage, projectileLifetime, projectilePoint, type ProjectileCue } from './projectiles.ts';
import { alignProjectiles, attackContactMs, visualImpactMs } from './impact-timing.ts';
import { drawSpiritSpheres } from './spirit-spheres.ts';
import { locateSkillVisual } from './asset-locator.ts';

interface Cue { event: BattlePresentationEvent; duration: number; delay: number; targets: readonly string[] }
/** Length of one pass through a native STR effect. */
const effectLength = (asset: NativeAsset) => asset.meta.effect ? asset.meta.effect.max_key / Math.max(1, asset.meta.effect.fps) * 1000 : 0;
export class BattleRenderer {
  private cues: Cue[] = [];
  private projectiles: ProjectileCue[] = [];
  private reactions: { event: BattlePresentationEvent; at: number }[] = [];
  private sounds: { ref: string; at: number; base: number }[] = [];
  private incomingImpact = new Map<string, number>();
  private deathAt = new Map<string, number>();
  /** Skill name called out above the user on every cast start, instant skills included (presentation only). */
  private shouts = new Map<string, { skill: string; at: number; until: number }>();
  /** Native per-hit skill effects, timed to the same visual impact as the hit's damage number. */
  private impacts: { target_id: string; at: number; config: ImpactEffect; asset: NativeAsset }[] = [];
  private readonly numbers: DamageNumbers | null;
  private readonly animation: ActorAnimation;
  frameStats = { damage: [] as { source: string; target: string; amount: number; critical: boolean; sequence: number; at_ms: number }[], incoming: [] as { source: string; target: string; amount: number; sequence: number }[], projectiles: [] as { source: string; target: string; shape: string }[], shouts: [] as { actor: string; skill: string }[], impacts: [] as { target: string; meta: string }[] };
  private frameTime = 0;
  private statusImages = new Map<string, HTMLImageElement | null>();
  selected = 'main';
  motion = true;
  /** Horizontal background travel in source-image pixels; presentation only. */
  scroll = 0;
  /** Extra camera zoom around the arena centre; presentation only. */
  zoom = 1;
  drawnLayers = 0;
  constructor(readonly canvas: HTMLCanvasElement, readonly pack: AssetPack, readonly scene: BattleScene) { this.animation = new ActorAnimation(id => pack.actors.get(id)); this.numbers = pack.numberFont ? new DamageNumbers(pack.numberFont, pack.index.combat_visuals.numbers.digit_frames, pack.criticalFont, pack.index.combat_visuals.numbers.critical_frame) : null; }
  point(actor: ActorRenderView): [number, number] {
    if (actor.summon_of) {
      // Summons have no body sprite or spatial state: they sit beside their owner, fanned out by order.
      const siblings = this.lastView?.actors.filter(row => row.summon_of === actor.summon_of) ?? [], owner = this.lastView?.actors.find(row => row.actor_id === actor.summon_of);
      const index = Math.max(0, siblings.findIndex(row => row.actor_id === actor.actor_id));
      if (owner) { const [x, y] = this.point(owner); return [x + 52 + index * 34, y + 6 - index * 10]; }
    }
    if (actor.spatial) {
      const s = actor.spatial, fraction = this.motion ? Math.max(0, Math.min(1, (this.frameTime - s.updated_at) / 50)) : 1;
      return [s.previous_x + (s.x - s.previous_x) * fraction, s.previous_y + (s.y - s.previous_y) * fraction];
    }
    if (actor.team === 'enemy' && this.scene.actors.filter(row => row.body_meta).length === 1) return [940, 455];
    const front = actor.position.startsWith('front'), second = actor.position.endsWith('2');
    return [actor.team === 'player' ? (front ? 470 : 270) : (front ? 860 : 1040), actor.team === 'player' ? second ? 625 : 320 : second ? 590 : 445];
  }
  accept(events: readonly BattlePresentationEvent[]): void {
    const launches = new Map<string, { specs: readonly ProjectileSpec[]; contact: number; damaging: boolean; impact: ImpactEffect | null }>();
    const key = (event: BattlePresentationEvent) => `${event.at_ms}:${event.actor_id}:${event.skill_id ?? 'normal_attack'}`;
    for (const event of events) if (event.type === 'normal_attack' || event.type === 'cast_resolve') {
      const job = this.scene.actors.find(actor => actor.actor_id === event.actor_id)?.job_id;
      const swing = this.animation.swing(event), contact = Math.round(attackContactMs(this.pack.actors.get(event.actor_id), swing.state) * swing.rate);
      const configured = event.type === 'normal_attack' ? this.pack.index.combat_visuals.normal_attacks[job ?? '']?.special_sfx ?? [] : this.pack.index.combat_visuals.skills[event.skill_id ?? '']?.special_sfx ?? [];
      const specs = alignProjectiles(configured, contact);
      const damaging = events.some(row => key(row) === key(event) && ['damage', 'miss'].includes(row.type));
      const impact = event.type === 'cast_resolve' ? this.pack.impacts.get(event.skill_id ?? '') ?? null : null;
      launches.set(key(event), { specs, contact, damaging, impact: impact?.config ?? null });
      if (impact) {
        // One native burst per (target, hit); targets reached only by heals/statuses get one at the resolve.
        const reached = new Map<string, number>();
        for (const row of events) if (key(row) === key(event) && row.target_id && ['damage', 'miss', 'heal', 'status_applied'].includes(row.type)) {
          // Hits that land together (no projectile, no stagger) share one burst instead of stacking additive copies.
          const hit = (row.type === 'damage' || row.type === 'miss') && (specs.length || impact.config.stagger_ms) ? row.hit_index ?? 0 : 0, id = `${row.target_id}:${hit}`;
          if (!reached.has(id)) reached.set(id, event.at_ms + (damaging ? visualImpactMs(specs, contact, hit, impact.config) : contact));
        }
        if (!reached.size) reached.set(`${event.actor_id}:0`, event.at_ms + contact);
        for (const [id, at] of reached) this.impacts.push({ target_id: id.slice(0, id.lastIndexOf(':')), at, config: impact.config, asset: impact.asset });
      }
      const targets = event.type === 'normal_attack' && event.target_id ? [event.target_id] : [...new Set(events.filter(row => row.at_ms === event.at_ms && row.actor_id === event.actor_id && row.skill_id === event.skill_id && row.target_id && ['damage', 'miss'].includes(row.type)).map(row => row.target_id!))];
      for (const target of targets) for (const spec of specs) this.projectiles.push({ at_ms: event.at_ms, source_id: event.actor_id, target_id: target, spec, ...(event.world_source ? { from: event.world_source } : {}) });
    }
    for (const event of events) {
      if (event.type === 'revive') {
        this.deathAt.delete(event.actor_id); this.incomingImpact.delete(event.actor_id);
        this.reactions = this.reactions.filter(cue => cue.event.actor_id !== event.actor_id || cue.event.type !== 'death').filter(cue => cue.event.target_id !== event.actor_id || cue.event.type !== 'damage');
      }
      const launch = launches.get(key(event));
      const delay = launch?.damaging ? visualImpactMs(launch.specs, launch.contact, event.hit_index ?? 0, launch.impact) : 0;
      if (event.type === 'damage' && event.target_id && (event.amount ?? 0) > 0) this.incomingImpact.set(event.target_id, Math.max(this.incomingImpact.get(event.target_id) ?? 0, event.at_ms + delay));
      if (event.type === 'death') this.deathAt.set(event.actor_id, Math.max(event.at_ms, this.incomingImpact.get(event.actor_id) ?? 0));
      if (event.type === 'damage' || event.type === 'death') this.reactions.push({ event, at: event.type === 'death' ? this.deathAt.get(event.actor_id)! : event.at_ms + delay });
      else this.animation.accept(event);
      const castChannel = `cast:${event.actor_id}`;
      if (event.type === 'cast_start' && event.skill_id) this.shouts.set(event.actor_id, { skill: event.skill_id, at: event.at_ms, until: event.at_ms + Math.max(1500, (event.cast_duration_ms ?? 0) + 1000) });
      if (event.type === 'death' || event.type === 'revive') this.shouts.delete(event.actor_id);
      if (event.type === 'cast_start' && (event.cast_duration_ms ?? 0) > 0) {
        const sound = this.pack.index.audio_events.cast_start;
        if (sound) void this.pack.sound(sound.id, castChannel).catch(error => this.pack.errors.push(String(error)));
      }
      if (['cast_resolve', 'cast_interrupt', 'death'].includes(event.type)) this.pack.stopSound(castChannel);
      if (event.type === 'terminal') for (const actor of this.scene.actors) this.pack.stopSound(`cast:${actor.actor_id}`);
      if (['damage', 'heal', 'miss', 'status_applied', 'cast_interrupt', 'cast_resolve'].includes(event.type)) {
        this.cues.push({ event, delay, duration: delay + (event.type === 'cast_resolve' ? this.pack.visuals.get(event.skill_id ?? '')?.recipe.duration_ms ?? 600 : event.type === 'damage' ? NUMBER_FLIGHT_MS : 1100), targets: event.type === 'cast_resolve' ? [...new Set(events.filter(value => value.at_ms === event.at_ms && value.actor_id === event.actor_id && value.skill_id === event.skill_id && value.target_id).map(value => value.target_id!))] : [] });
      }
      if (event.type === 'cast_resolve' && event.skill_id) {
        const visual = this.pack.visuals.get(event.skill_id), sound = visual?.sound_paths[0]; if (sound) this.sounds.push({ ref: sound, at: event.at_ms + delay, base: event.at_ms });
      }
      if (event.type === 'terminal') { const sound = this.pack.index.audio_events[event.detail === 'enemy_team_wiped' ? 'victory' : 'defeat']; if (sound) this.sounds.push({ ref: sound.id, at: Math.max(event.at_ms, ...this.deathAt.values()), base: event.at_ms }); }
      if (event.type === 'normal_attack') {
        const job = this.scene.actors.find(actor => actor.actor_id === event.actor_id)?.job_id;
        const key = !job ? 'hit' : ['archer', 'hunter', 'bard', 'dancer'].includes(job) ? 'attack_bow' : ['mage', 'wizard', 'sage'].includes(job) ? 'attack_rod' : ['acolyte', 'priest', 'monk', 'alchemist'].includes(job) ? 'attack_mace' : ['merchant', 'blacksmith'].includes(job) ? 'attack_axe' : ['thief', 'assassin', 'rogue'].includes(job) ? 'attack_dagger' : 'attack_sword';
        const sound = this.pack.index.audio_events[key]; if (sound) this.sounds.push({ ref: sound.id, at: event.at_ms + (launch?.contact ?? 0), base: event.at_ms });
      }
    }
    // Presentation only: discarded cues cannot remove an effect from combat.
    this.cues = this.cues.slice(-300); this.impacts = this.impacts.slice(-120);
    this.projectiles = this.projectiles.slice(-160);
    this.reactions = this.reactions.slice(-600); this.sounds = this.sounds.slice(-300);
  }
  draw(view: BattleRenderView, presentationMs = view.game_time_ms): void {
    const context = this.canvas.getContext('2d'); if (!context) throw new Error('CANVAS_UNAVAILABLE');
    this.frameTime = presentationMs;
    for (const cue of this.reactions.filter(cue => !this.motion || cue.at <= presentationMs).sort((a, b) => a.at - b.at || a.event.sequence - b.event.sequence)) this.animation.accept({ ...cue.event, at_ms: this.motion ? cue.at : cue.event.at_ms });
    this.reactions = this.reactions.filter(cue => this.motion && cue.at > presentationMs);
    for (const cue of this.sounds.filter(cue => !this.motion || cue.at <= presentationMs)) if (presentationMs - (this.motion ? cue.at : cue.base) <= 120) void this.pack.sound(cue.ref).catch(error => this.pack.errors.push(String(error)));
    this.sounds = this.sounds.filter(cue => this.motion && cue.at > presentationMs);
    const width = this.canvas.width, height = this.canvas.height;
    context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, width, height); context.imageSmoothingEnabled = false;
    if (this.pack.background) {
      const image = this.pack.background.image, fit = Math.max(width / image.width, height / image.height), drawnWidth = image.width * fit, top = (height - image.height * fit) / 2;
      if (!this.scroll) context.drawImage(image, (width - drawnWidth) / 2, top, drawnWidth, image.height * fit);
      else {
        // Presentation-only travel: mirrored tiles keep the seam continuous while the party walks.
        const offset = ((this.scroll * fit) % (drawnWidth * 2) + drawnWidth * 2) % (drawnWidth * 2), start = (width - drawnWidth) / 2 - offset;
        for (let tile = -1; start + tile * drawnWidth < width; tile++) {
          const x = start + tile * drawnWidth; if (x + drawnWidth < 0) continue;
          if (((tile % 2) + 2) % 2 === 0) context.drawImage(image, x, top, drawnWidth, image.height * fit);
          else { context.save(); context.translate(x + drawnWidth, top); context.scale(-1, 1); context.drawImage(image, 0, 0, drawnWidth, image.height * fit); context.restore(); }
        }
      }
    }
    const shade = context.createLinearGradient(0, 0, 0, height); shade.addColorStop(0, 'rgba(17,32,29,.14)'); shade.addColorStop(.45, 'transparent'); shade.addColorStop(1, 'rgba(21,35,30,.3)'); context.fillStyle = shade; context.fillRect(0, 0, width, height);
    const worldWidth = view.arena?.width ?? 1280, worldHeight = view.arena?.height ?? 720;
    const zoom = Math.min(width / worldWidth, height / worldHeight) * this.zoom;
    context.save(); context.translate((width - worldWidth * zoom) / 2, (height - worldHeight * zoom) / 2); context.scale(zoom, zoom);
    this.drawnLayers = 0;
    this.frameStats = { damage: [], incoming: [], projectiles: [], shouts: [], impacts: [] };
    const appearances = this.scene.actors;
    this.lastView = view;
    for (const actor of view.actors.filter(row => row.summon_of)) this.drawSummon(context, actor, presentationMs);
    for (const actor of view.actors.slice().sort((a, b) => this.point(a)[1] - this.point(b)[1])) {
      const appearance = appearances.find(row => row.actor_id === actor.actor_id), parts = this.pack.actors.get(actor.actor_id); if (!appearance || !parts) continue;
      const target = view.actors.find(row => row.actor_id === actor.spatial?.target_id);
      const facing = target?.spatial && actor.spatial ? target.spatial.x < actor.spatial.x ? 'left' : 'right' : appearance.facing;
      const visibleActor = this.motion && actor.hp <= 0 && (this.deathAt.get(actor.actor_id) ?? 0) > presentationMs ? { ...actor, hp: 1, phase: 'after_cast' as const } : actor;
      const [x, y] = this.point(actor), { state, elapsed } = this.animation.sample(visibleActor, presentationMs, this.motion);
      context.fillStyle = 'rgba(15,25,22,.25)'; context.beginPath(); context.ellipse(x, y + 4, 27, 8, 0, 0, Math.PI * 2); context.fill();
      if (actor.actor_id === this.selected && actor.team === 'player') { context.strokeStyle = '#f4d284'; context.lineWidth = 3; context.beginPath(); context.ellipse(x, y + 4, 32, 10, 0, 0, Math.PI * 2); context.stroke(); }
      if (actor.phase === 'casting') {
        context.save(); context.translate(x, y); context.rotate((this.motion ? presentationMs : 0) / 700); context.strokeStyle = actor.team === 'enemy' ? actor.cast?.interruptible ? '#ffb17a' : '#d8a7ff' : '#c4ebfa'; context.lineWidth = 2; context.beginPath(); context.ellipse(0, 0, 34, 11, 0, 0, Math.PI * 2); context.stroke(); context.restore();
      }
      const motion = this.animation.offset(state, elapsed, actor.actor_id, this.motion);
      const sphereTime = this.motion ? presentationMs : 0;
      if (actor.hp > 0) drawSpiritSpheres(context, actor.spirit_spheres ?? 0, sphereTime, false, x, y);
      this.drawnLayers += drawActor(context, parts, state, elapsed, x + motion.x * (facing === 'left' ? -1 : 1), y + motion.y, facing, appearance.scale);
      if (actor.hp > 0) drawSpiritSpheres(context, actor.spirit_spheres ?? 0, sphereTime, true, x, y);
    }
    this.projectiles = this.projectiles.filter(cue => presentationMs - cue.at_ms <= projectileLifetime(cue.spec));
    if (this.motion) for (const cue of this.projectiles) {
      const source = view.actors.find(actor => actor.actor_id === cue.source_id), target = view.actors.find(actor => actor.actor_id === cue.target_id); if (!source || !target) continue;
      const [sx, sy] = cue.from ?? this.point(source), [tx, ty] = this.point(target), facing = tx >= sx ? 1 : -1;
      for (let index = 0; index < cue.spec.count; index++) {
        const point = projectilePoint(cue.spec, [sx + facing * 18, sy - 55], [tx, ty - 35], presentationMs - cue.at_ms, index);
        if (point) { drawProjectile(context, cue.spec, point); this.frameStats.projectiles.push({ source: source.actor_id, target: target.actor_id, shape: cue.spec.shape }); }
      }
    }
    this.impacts = this.impacts.filter(cue => presentationMs - cue.at + cue.config.start_ms <= effectLength(cue.asset));
    if (this.motion) for (const cue of this.impacts) {
      // Effect clock reads start_ms at the impact and runs from lead_ms before it.
      const clock = cue.config.start_ms + presentationMs - cue.at, target = view.actors.find(actor => actor.actor_id === cue.target_id);
      if (clock < cue.config.start_ms - cue.config.lead_ms || !target) continue;
      const [tx, ty] = this.point(target); this.drawnLayers += drawEffect(context, cue.asset, Math.max(0, clock), tx, ty - cue.config.lift, cue.config.scale);
      this.frameStats.impacts.push({ target: target.actor_id, meta: cue.config.meta });
    }
    this.cues = this.cues.filter(cue => presentationMs - cue.event.at_ms < cue.duration);
    for (const cue of this.cues) {
      const event = cue.event, elapsed = presentationMs - event.at_ms - (this.motion ? cue.delay : 0); if (elapsed < 0) continue;
      const actor = view.actors.find(row => row.actor_id === (event.target_id ?? event.actor_id)); if (!actor) continue;
      const [x, y] = this.point(actor);
      if (event.type === 'heal' && (event.amount ?? 0) > 0) {
        context.save(); context.globalAlpha = Math.max(0, 1 - elapsed / 1100); this.numbers?.draw(context, event.amount!, false, x, y - 110 - (this.motion ? elapsed / 30 : 0), this.motion ? elapsed : 140, true); context.restore(); continue;
      }
      if (event.type === 'damage') {
        // Outgoing numbers follow the focused actor; any hit a party member takes shows in red on that member.
        const focused = isFocusedDamage(event, this.selected), incoming = !focused && actor.team === 'player' && (event.amount ?? 0) > 0;
        if (!focused && !incoming) continue;
        const critical = event.detail === 'critical', flight = this.motion ? numberFlight(elapsed, event.sequence % 2 ? 1 : -1) : { dx: 0, dy: 0, size: 1, alpha: 1 };
        context.save(); context.globalAlpha = flight.alpha;
        this.numbers?.draw(context, event.amount!, critical, x + flight.dx, y - (actor.cast ? 105 : 100) - (event.hit_index ?? 0) % 3 * 22 + flight.dy, this.motion ? elapsed : 140, incoming ? 'incoming' : 'damage', flight.size * (incoming ? .8 : 1));
        context.restore();
        if (focused) this.frameStats.damage.push({ source: event.actor_id, target: actor.actor_id, amount: event.amount!, critical, sequence: event.sequence, at_ms: event.at_ms + (this.motion ? cue.delay : 0) });
        else this.frameStats.incoming.push({ source: event.actor_id, target: actor.actor_id, amount: event.amount!, sequence: event.sequence });
        continue;
      }
      if (event.type === 'cast_resolve' && event.skill_id && this.motion) {
        const visual = this.pack.visuals.get(event.skill_id); if (!visual || this.pack.impacts.has(event.skill_id)) continue;
        // Target effects are positioned from actual resulting hit/heal/status events.
        for (const id of cue.targets) {
          const target = view.actors.find(row => row.actor_id === id); if (!target) continue; const [tx, ty] = this.point(target);
          if (visual.native) drawEffect(context, visual.native, elapsed, tx, ty, .7); else { context.save(); context.translate(tx, ty); context.scale(.65, .65); drawProcedural(context, visual.recipe, elapsed, 0, 0); context.restore(); }
        }
        continue;
      }
      let text = '', color = '#fff7dc';

      if (event.type === 'miss' && event.actor_id === this.selected) text = 'หลบ';
      if (event.type === 'cast_interrupt') { text = 'ขัดร่าย!'; color = '#ffc3a3'; }
      if (event.type === 'status_applied' && event.detail?.startsWith('stun:')) { text = 'STUN'; color = '#e7c9ff'; }
      if (!text) continue;
      context.save(); context.globalAlpha = Math.max(0, 1 - elapsed / cue.duration); context.font = 'bold 20px ROThai, sans-serif'; context.textAlign = 'center'; context.lineWidth = 4; context.strokeStyle = '#26352f'; const yy = y - (event.type === 'cast_interrupt' || event.type === 'status_applied' ? 135 : 100 + event.sequence % 3 * 18) - (this.motion ? elapsed / 24 : 0); context.strokeText(text, x + (event.sequence % 3 - 1) * 20, yy); context.fillStyle = color; context.fillText(text, x + (event.sequence % 3 - 1) * 20, yy); context.restore();
    }
    for (const actor of view.actors) { if (actor.summon_of) continue; const [x, y] = this.point(actor); this.label(context, actor, x, y, presentationMs); }
    context.restore();
  }
  private lastView: BattleRenderView | null = null;
  /** Presentation-only sprout for summoned plants; colour by catalog kind, gentle pulse, no gameplay data. */
  private drawSummon(context: CanvasRenderingContext2D, actor: ActorRenderView, now: number): void {
    const [x, y] = this.point(actor), colour = actor.summon_kind === 'healing_plant' ? '#5fcf86' : '#a674e0', pulse = 1 + .08 * Math.sin(now / 180 + x);
    context.save(); context.translate(x, y); context.scale(pulse, pulse);
    const glow = context.createRadialGradient(0, -14, 2, 0, -14, 26); glow.addColorStop(0, `${colour}aa`); glow.addColorStop(1, `${colour}00`);
    context.fillStyle = glow; context.beginPath(); context.arc(0, -14, 26, 0, Math.PI * 2); context.fill();
    context.fillStyle = 'rgba(40,30,20,.35)'; context.beginPath(); context.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#3f6b35'; context.lineWidth = 3; context.lineCap = 'round'; context.beginPath(); context.moveTo(0, 0); context.quadraticCurveTo(-3, -12, 0, -24); context.stroke();
    context.fillStyle = colour; context.strokeStyle = '#2f4a2a'; context.lineWidth = 1.5;
    for (const side of [-1, 1]) { context.beginPath(); context.ellipse(side * 8, -16, 8, 4, side * -.6, 0, Math.PI * 2); context.fill(); context.stroke(); }
    context.beginPath(); context.arc(0, -27, 5, 0, Math.PI * 2); context.fill(); context.stroke();
    context.restore();
  }
  private label(context: CanvasRenderingContext2D, actor: ActorRenderView, x: number, y: number, now: number): void {
    context.save(); context.textAlign = 'center'; context.font = '16px ROThai, sans-serif';
    const showName = actor.actor_id === this.selected;
    if (showName) {
      const nameWidth = Math.max(95, Math.min(200, context.measureText(actor.name).width + 16));
      context.fillStyle = 'rgba(25,38,32,.8)'; context.fillRect(x - nameWidth / 2, y + 13, nameWidth, 23); context.fillStyle = '#fff2d2'; context.fillText(actor.name, x, y + 30);
    }
    const barY = y + (showName ? 41 : 17);
    context.fillStyle = '#213e31'; context.fillRect(x - 38, barY, 76, 5); context.fillStyle = actor.team === 'player' ? '#afd3a1' : '#e5a187'; context.fillRect(x - 38, barY, 76 * Math.max(0, actor.hp / actor.max_hp), 5);
    const statuses = actor.statuses ?? [], shown = statuses.slice(0, 4), badgeY = barY + 11;
    for (const [index, status] of shown.entries()) {
      const left = x - shown.length * 12 + index * 24;
      context.fillStyle = status.polarity === 'buff' ? '#274e70dd' : '#722e43dd'; context.fillRect(left, badgeY, 22, 22);
      context.strokeStyle = status.polarity === 'buff' ? '#91c8ff' : '#ff93ad'; context.lineWidth = 1; context.strokeRect(left, badgeY, 22, 22);
      const id = status.icon_skill_id;
      if (id && !this.statusImages.has(id)) {
        this.statusImages.set(id, null);
        try { void this.pack.iconUrl(locateSkillVisual(this.pack.index, id).icon.id).then(async url => { const image = new Image(); image.src = url; await image.decode(); this.statusImages.set(id, image); }).catch(() => {}); } catch { /* Unknown icons keep a visible polarity marker. */ }
      }
      const image = id ? this.statusImages.get(id) : null;
      if (image) context.drawImage(image, left + 2, badgeY + 2, 18, 18);
      else { context.fillStyle = '#eef6ff'; context.font = 'bold 18px sans-serif'; context.fillText(status.polarity === 'buff' ? '+' : '−', left + 11, badgeY + 17); }
      if (status.stacks > 1) { context.fillStyle = '#fff'; context.font = 'bold 12px sans-serif'; context.strokeStyle = '#15243b'; context.lineWidth = 3; context.strokeText(String(status.stacks), left + 19, badgeY + 22); context.fillText(String(status.stacks), left + 19, badgeY + 22); }
    }
    if (statuses.length > shown.length) { context.font = '12px sans-serif'; context.fillStyle = '#fff'; context.fillText(`+${statuses.length - shown.length}`, x + shown.length * 12 + 10, badgeY + 17); }
    const castY = y - (actor.team === 'player' ? 132 : 112);
    if (actor.cast) {
      const fraction = Math.min(1, Math.max(0, (now - actor.phase_started_at) / Math.max(1, actor.phase_duration_ms)));
      context.fillStyle = '#243e48'; context.fillRect(x - 70, castY, 140, 9); context.fillStyle = actor.cast.interruptible ? '#e9cb83' : '#c8a0ed'; context.fillRect(x - 70, castY, 140 * fraction, 9);
      if (actor.team === 'enemy') { context.font = '14px ROThai, sans-serif'; context.fillStyle = '#fff4df'; context.strokeStyle = '#27352d'; context.lineWidth = 4; const flag = actor.cast.interruptible ? 'ขัดร่ายได้' : 'ขัดร่ายไม่ได้'; context.strokeText(flag, x, castY + 26); context.fillText(flag, x, castY + 26); }
    }
    const shout = this.shouts.get(actor.actor_id);
    if (shout && now >= shout.at && now < shout.until && actor.hp > 0) this.shout(context, actor, shout, x, castY - 14, now);
    context.restore();
  }
  /** RO-style "Skill!!" call-out: pops in, holds long enough to read, fades; one per actor, newest wins. */
  private shout(context: CanvasRenderingContext2D, actor: ActorRenderView, shout: { skill: string; at: number; until: number }, x: number, y: number, now: number): void {
    const text = `${this.scene.skill_labels[shout.skill] ?? shout.skill}!!`, age = now - shout.at;
    const pop = this.motion ? 1 + .25 * Math.max(0, 1 - age / 120) : 1;
    context.save(); context.globalAlpha = Math.max(0, Math.min(1, (shout.until - now) / 300)); context.translate(x, y); context.scale(pop, pop);
    context.font = 'bold 15px ROThai, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
    const width = context.measureText(text).width + 18, height = 22;
    context.fillStyle = 'rgba(255,255,255,.93)'; context.strokeStyle = actor.team === 'player' ? '#5b86b8' : '#c06a4c'; context.lineWidth = 2;
    context.beginPath(); context.roundRect(-width / 2, -height / 2, width, height, 10); context.fill(); context.stroke();
    context.fillStyle = '#1f2d3a'; context.fillText(text, 0, 1); context.restore();
    this.frameStats.shouts.push({ actor: actor.actor_id, skill: shout.skill });
  }
}

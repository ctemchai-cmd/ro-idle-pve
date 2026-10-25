import type { ActorRenderView, BattlePresentationEvent } from '../contracts/presentation.ts';

type Style = 'fist' | 'slash' | 'holy' | 'meteor' | 'earth' | 'arcane' | 'volley' | 'blast';
interface Profile { style: Style; color: string; shake: number; priority: number; hold: number; title?: string }
/** Titles and subtle camera emphasis only; skill imagery comes from actual native assets. */
export const FINISHER_PROFILES: Readonly<Record<string, Profile>> = {
  monk_asura: { style: 'fist', color: '#ffd56a', shake: 5, priority: 3, hold: 1000, title: 'ASURA STRIKE' },
  champion_chain_crush_combo:{style:'fist',color:'#ffad69',shake:4,priority:3,hold:950,title:'GATE OF HELL'},
  champion_palm_strike:{style:'fist',color:'#ffe0aa',shake:2.5,priority:2,hold:850,title:'DRAGON TIGER COMBO'},
  lord_knight_spiral_pierce:{style:'volley',color:'#a7d9ff',shake:2.5,priority:2,hold:800},
  paladin_shield_chain:{style:'holy',color:'#fff0b7',shake:2.5,priority:2,hold:800},
  stalker_full_strip:{style:'slash',color:'#cf9dff',shake:2,priority:1,hold:750},
  monk_finger_offensive: { style: 'fist', color: '#ffe9a1', shake: 2.5, priority: 1, hold: 750 },
  knight_brandish: { style: 'slash', color: '#99d8ff', shake: 3, priority: 1, hold: 750 },
  crusader_grand_cross: { style: 'holy', color: '#fff0a9', shake: 3, priority: 2, hold: 850 },
  wizard_meteor: { style: 'meteor', color: '#ffad69', shake: 4, priority: 2, hold: 850 },
  wizard_jupitel: { style: 'arcane', color: '#d7b5ff', shake: 2.5, priority: 1, hold: 750 },
  wizard_heavens_drive: { style: 'earth', color: '#e0c39b', shake: 3.5, priority: 1, hold: 750 },
  sage_psychic_bolt: { style: 'arcane', color: '#c8a6ff', shake: 2, priority: 1, hold: 750 },
  hunter_rapid_fire: { style: 'volley', color: '#aeefb5', shake: 2, priority: 1, hold: 750 },
  hunter_claymore: { style: 'blast', color: '#ffc77c', shake: 3.5, priority: 1, hold: 750 },
  assassin_sonic_blow: { style: 'slash', color: '#e8abff', shake: 3, priority: 2, hold: 850 },
  assassin_detonate: { style: 'slash', color: '#c28bff', shake: 3, priority: 1, hold: 750 },
  rogue_raid: { style: 'slash', color: '#b3b9ff', shake: 2, priority: 1, hold: 750 },
  blacksmith_cart_crash: { style: 'slash', color: '#ffc76b', shake: 4, priority: 2, hold: 850 },
  alchemist_acid_terror: { style: 'blast', color: '#bded81', shake: 2.5, priority: 1, hold: 750 },
};
interface Cue { key: string; skill: string; source: string; target: string; at: number; profile: Profile; started?: number; titleY?: number }
export interface FinisherFrame { skill: string; source: string; target: string; at_ms: number; age_ms: number; title: boolean; titleY?:number }
export const FINISHER_LIMITS = { pending: 12, active: 3, seen: 1024, staleGameMs: 1600, impactMs: 420, shakeMs: 180 } as const;
/** Below the upper HUD, closer to the combatants on a portrait battlefield. */
export const FINISHER_TITLE_Y = .4;

/** Both clocks are injected. Wall time only keeps the overlay readable at1×/2×/4×. */
export class FinisherEffects {
  private pending: Cue[] = [];
  private active: Cue[] = [];
  private seen = new Set<string>();
  queue(event: BattlePresentationEvent, impactAt: number): void {
    const profile = Object.hasOwn(FINISHER_PROFILES, event.skill_id ?? '') ? FINISHER_PROFILES[event.skill_id!] : null;
    if (!profile || event.type !== 'damage' || !event.target_id || !((event.amount ?? 0) + (event.absorbed ?? 0) > 0) || (event.origin && event.origin !== 'skill')) return;
    const key = `${event.actor_id}:${event.action_id ?? `${event.skill_id}:${event.at_ms}`}`;
    if (this.seen.has(key)) return;
    this.seen.add(key); if (this.seen.size > FINISHER_LIMITS.seen) this.seen.delete(this.seen.values().next().value!);
    this.pending.push({ key, skill: event.skill_id!, source: event.actor_id, target: event.target_id, at: Math.max(event.at_ms, impactAt), profile });
    this.pending = this.pending.slice(-FINISHER_LIMITS.pending);
  }
  advance(gameMs: number, wallMs: number): void {
    this.active = this.active.filter(c => wallMs - c.started! >= 0 && wallMs - c.started! < c.profile.hold);
    for (const cue of this.pending) if (cue.at <= gameMs && gameMs - cue.at <= FINISHER_LIMITS.staleGameMs) this.active.push({ ...cue, started: wallMs });
    this.pending = this.pending.filter(c => c.at > gameMs);
    this.active.sort((a,b) => b.profile.priority - a.profile.priority || b.started! - a.started! || b.at - a.at);
    this.active = this.active.slice(0, FINISHER_LIMITS.active);
  }
  buffers() { return { pending: this.pending.length, active: this.active.length, seen: this.seen.size }; }
  shake(wallMs: number, motion: boolean): readonly [number, number] {
    if (!motion) return [0,0];
    const cue = this.active.find(c => wallMs - c.started! < FINISHER_LIMITS.shakeMs); if (!cue) return [0,0];
    const age = wallMs - cue.started!, power = cue.profile.shake * (1 - age / FINISHER_LIMITS.shakeMs) ** 2;
    return [Math.sin(age * .19) * power, Math.sin(age * .27 + 1) * power * .65];
  }
  frames(wallMs: number, motion: boolean, titles = true): FinisherFrame[] {
    return this.active.flatMap((c,i) => (i === 0 && titles) || (i < 2 && motion && wallMs - c.started! < FINISHER_LIMITS.impactMs) ? [{ skill:c.skill,source:c.source,target:c.target,at_ms:c.at,age_ms:wallMs-c.started!,title:i===0&&titles,titleY:c.titleY }] : []);
  }
  drawTitle(ctx: CanvasRenderingContext2D, width: number, height: number, labels: Readonly<Record<string,string>>, actors: readonly ActorRenderView[], wallMs: number, motion: boolean, avoid:readonly{top:number;bottom:number}[]=[]): void {
    const cue=this.active[0];if(!cue)return;
    const age=wallMs-cue.started!,text=cue.profile.title??(labels[cue.skill]??cue.skill).toUpperCase(),name=actors.find(a=>a.actor_id===cue.source)?.name.split(' · ')[0]??'';
    const alpha=Math.min(1,(cue.profile.hold-age)/180),scale=motion?1+Math.max(0,1-age/130)*.07:1;
    // Choose once per banner; large native digits keep their band and the title stays still.
    cue.titleY??=[FINISHER_TITLE_Y,.58,.72,.84].find(y=>!avoid.some(r=>r.top<y+45/height&&r.bottom>y-35/height))??.84;
    ctx.save();ctx.translate(width/2,height*cue.titleY);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';
    const max=width*.86;ctx.font='900 42px ROThai, sans-serif';const measured=ctx.measureText(text).width;if(measured>max)ctx.font=`900 ${42*max/measured}px ROThai, sans-serif`;
    const w=Math.min(max+32,ctx.measureText(text).width+50);const shade=ctx.createLinearGradient(-w/2,0,w/2,0);shade.addColorStop(0,'#12243d00');shade.addColorStop(.25,'#12243dbb');shade.addColorStop(.75,'#12243dbb');shade.addColorStop(1,'#12243d00');ctx.fillStyle=shade;ctx.fillRect(-w/2,-29,w,70);
    ctx.lineJoin='round';ctx.lineWidth=7;ctx.strokeStyle='#192637';ctx.strokeText(text,0,0);ctx.lineWidth=1.5;ctx.strokeStyle='#fff8e4';ctx.fillStyle=cue.profile.color;ctx.fillText(text,0,0);ctx.strokeText(text,0,0);
    ctx.font='bold 16px ROThai, sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#152337';ctx.strokeText(name,0,31);ctx.fillStyle='#f4f7ff';ctx.fillText(name,0,31);ctx.restore();
  }
}

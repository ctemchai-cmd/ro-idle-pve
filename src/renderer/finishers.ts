import type { ActorRenderView, BattlePresentationEvent } from '../contracts/presentation.ts';

type Style = 'fist' | 'slash' | 'holy' | 'meteor' | 'earth' | 'arcane' | 'volley' | 'blast';
interface Profile { style: Style; color: string; shake: number; priority: number; hold: number; title?: string }
/** Authored RO-inspired emphasis layered over the native effects; no damage or skill rules. */
export const FINISHER_PROFILES: Readonly<Record<string, Profile>> = {
  monk_asura: { style: 'fist', color: '#ffd56a', shake: 5, priority: 3, hold: 1000, title: 'ASURA STRIKE' },
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
  assassin_detonate: { style: 'blast', color: '#b7eb83', shake: 3, priority: 1, hold: 750 },
  rogue_raid: { style: 'slash', color: '#b3b9ff', shake: 2, priority: 1, hold: 750 },
  blacksmith_cart_crash: { style: 'blast', color: '#ffc76b', shake: 4, priority: 2, hold: 850 },
  alchemist_acid_terror: { style: 'blast', color: '#bded81', shake: 2.5, priority: 1, hold: 750 },
};
interface Cue { key: string; skill: string; source: string; target: string; at: number; profile: Profile; started?: number }
export interface FinisherFrame { skill: string; source: string; target: string; at_ms: number; age_ms: number; title: boolean }
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
    return this.active.flatMap((c,i) => (i === 0 && titles) || (i < 2 && motion && wallMs - c.started! < FINISHER_LIMITS.impactMs) ? [{ skill:c.skill,source:c.source,target:c.target,at_ms:c.at,age_ms:wallMs-c.started!,title:i===0&&titles }] : []);
  }
  drawImpacts(ctx: CanvasRenderingContext2D, actors: readonly ActorRenderView[], point: (actor: ActorRenderView) => readonly [number,number], wallMs: number, motion: boolean): void {
    if (!motion) return;
    for (const cue of this.active.slice(0,2)) {
      const age=wallMs-cue.started!; if (age>=FINISHER_LIMITS.impactMs) continue;
      const target=actors.find(a=>a.actor_id===cue.target),source=actors.find(a=>a.actor_id===cue.source); if(!target||!source)continue;
      const [tx,ty]=point(target),[sx,sy]=point(source),p=age/FINISHER_LIMITS.impactMs,r=30+130*p,alpha=(1-p)**1.5;
      ctx.save();ctx.translate(tx,ty);ctx.globalAlpha=alpha;ctx.lineCap='round';
      ctx.save();ctx.scale(1,.3);ctx.strokeStyle=cue.profile.color;ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.stroke();ctx.restore();
      ctx.translate(0,-40);ctx.globalCompositeOperation='screen';
      const glow=ctx.createRadialGradient(0,0,2,0,0,r*.8);glow.addColorStop(0,'#fffbe9bb');glow.addColorStop(.25,cue.profile.color+'85');glow.addColorStop(1,cue.profile.color+'00');ctx.fillStyle=glow;ctx.fillRect(-r,-r,r*2,r*2);
      ctx.strokeStyle=cue.profile.color;ctx.fillStyle=cue.profile.color;ctx.lineWidth=3;
      const style=cue.profile.style;
      if(style==='fist'){
        // Lens-like radial streaks echo the local MO_EXTREMITYFIST mapping, without claiming native reconstruction.
        for(let i=0;i<16;i++){const a=i*Math.PI/8+.12,inner=15+45*p,outer=inner+25+(i%3)*18+40*(1-p);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
        ctx.save();ctx.globalAlpha*=Math.max(0,1-age/160);ctx.strokeStyle='#ffc45a';ctx.lineWidth=18*(1-p)+1;ctx.beginPath();ctx.moveTo(sx-tx,sy-ty);ctx.lineTo(0,0);ctx.stroke();ctx.strokeStyle='#fffbea';ctx.lineWidth=8*(1-p)+1;ctx.stroke();ctx.restore();ctx.globalCompositeOperation='source-over';ctx.fillStyle='#fffce6';ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?12+10*p:65*(1-p)+20;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
      }else if(style==='slash'){
        ctx.lineWidth=9*(1-p)+2;for(const sign of[-1,1]){ctx.beginPath();ctx.moveTo(-75*(1+p),sign*45);ctx.quadraticCurveTo(0,-sign*35,75*(1+p),-sign*45);ctx.stroke();}
      }else if(style==='holy'){
        ctx.fillRect(-8,-105,16,190);ctx.fillRect(-65,-40,130,13);for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*45,Math.sin(a)*45);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}
      }else if(style==='earth'){
        ctx.globalCompositeOperation='source-over';for(let i=0;i<7;i++){const x=(i-3)*25,y=-18-Math.sin(i*1.7)*22-45*Math.sin(p*Math.PI);ctx.fillStyle=i%2?'#8d7056':cue.profile.color;ctx.beginPath();ctx.moveTo(x-13,40);ctx.lineTo(x-9,y);ctx.lineTo(x+5,y-16);ctx.lineTo(x+15,40);ctx.closePath();ctx.fill();}
      }else if(style==='arcane'){
        for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3+p*.8);ctx.beginPath();ctx.ellipse(0,0,r*.8,r*.24,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
      }else if(style==='volley'){
        for(let i=0;i<7;i++){const x=(i-3)*18;ctx.beginPath();ctx.moveTo(x-32,-75-30*p);ctx.lineTo(x+10,25);ctx.lineTo(x,18);ctx.moveTo(x+10,25);ctx.lineTo(x+13,14);ctx.stroke();}
      }else{
        for(let i=0;i<12;i++){const a=i*2.399963,radius=30+100*p;ctx.save();ctx.translate(Math.cos(a)*radius,Math.sin(a)*radius);ctx.rotate(a+p);ctx.fillRect(-4,-9,8,18);ctx.restore();}if(style==='meteor'){ctx.strokeStyle='#fff3c2';ctx.lineWidth=8*(1-p)+1;ctx.beginPath();ctx.moveTo(-60,-125);ctx.lineTo(10,15);ctx.stroke();}
      }
      ctx.restore();
    }
  }
  drawTitle(ctx: CanvasRenderingContext2D, width: number, height: number, labels: Readonly<Record<string,string>>, actors: readonly ActorRenderView[], wallMs: number, motion: boolean): void {
    const cue=this.active[0];if(!cue)return;
    const age=wallMs-cue.started!,text=cue.profile.title??(labels[cue.skill]??cue.skill).toUpperCase(),name=actors.find(a=>a.actor_id===cue.source)?.name.split(' · ')[0]??'';
    const alpha=Math.min(1,(cue.profile.hold-age)/180),scale=motion?1+Math.max(0,1-age/130)*.07:1;
    ctx.save();ctx.translate(width/2,height*FINISHER_TITLE_Y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';
    const max=width*.86;ctx.font='900 42px ROThai, sans-serif';const measured=ctx.measureText(text).width;if(measured>max)ctx.font=`900 ${42*max/measured}px ROThai, sans-serif`;
    const w=Math.min(max+32,ctx.measureText(text).width+50);const shade=ctx.createLinearGradient(-w/2,0,w/2,0);shade.addColorStop(0,'#12243d00');shade.addColorStop(.25,'#12243dbb');shade.addColorStop(.75,'#12243dbb');shade.addColorStop(1,'#12243d00');ctx.fillStyle=shade;ctx.fillRect(-w/2,-29,w,70);
    ctx.lineJoin='round';ctx.lineWidth=7;ctx.strokeStyle='#192637';ctx.strokeText(text,0,0);ctx.lineWidth=1.5;ctx.strokeStyle='#fff8e4';ctx.fillStyle=cue.profile.color;ctx.fillText(text,0,0);ctx.strokeText(text,0,0);
    ctx.font='bold 16px ROThai, sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#152337';ctx.strokeText(name,0,31);ctx.fillStyle='#f4f7ff';ctx.fillText(name,0,31);ctx.restore();
  }
}

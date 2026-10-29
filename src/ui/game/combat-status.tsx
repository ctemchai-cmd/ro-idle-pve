import { useEffect, useState } from 'react';
import type { ActorRenderView, StatusRenderGroup } from '../../contracts/presentation.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { locateSkillVisual } from '../../renderer/asset-locator.ts';
import { Icon } from '../icon.tsx';
import { Sheet } from './kit.tsx';

const percentFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
const percentNumber = (ratio: number) => percentFormat.format(ratio * 100);
const timeLeft = (expires: number, now: number) => `${Math.max(0, (expires - now) / 1000).toFixed(1)}s`;
function SkillIcon({ skillId, polarity = 'buff', pack }: { skillId: string | null; polarity?: 'buff' | 'debuff'; pack: AssetPack | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setUrl(null);
    if (pack && skillId) try { void pack.iconUrl(locateSkillVisual(pack.index, skillId).icon.id).then(url => { if (active) setUrl(url); }).catch(() => {}); } catch { /* Unknown source still has a polarity icon and readable label. */ }
    return () => { active = false; };
  }, [skillId, pack]);
  return url ? <img src={url} alt="" data-skill-icon={skillId} /> : <Icon name={polarity === 'buff' ? 'shield' : 'warning'} />;
}
const StatusIcon = ({ group, pack }: { group: StatusRenderGroup; pack: AssetPack | null }) => <SkillIcon skillId={group.icon_skill_id} polarity={group.polarity} pack={pack} />;
const SphereIcon = ({ pack }: { pack: AssetPack | null }) => <SkillIcon skillId="monk_call_spirits" pack={pack} />;

/** Compact signals inside each party card; the card selects whose full status strip is shown. */
export function StatusSignals({ actor, pack }: { actor: ActorRenderView; pack: AssetPack | null }) {
  const groups = actor.statuses ?? [];
  return <span className="status-signals">
    {actor.spirit_spheres !== undefined && <span className="sphere-signal" aria-label={`Spirit Sphere ${actor.spirit_spheres} ลูก`}><SphereIcon pack={pack} />{actor.spirit_spheres}</span>}
    {groups.slice(0, 3).map(g => <span key={g.id} className={`status-signal ${g.polarity}`} title={`${g.name} ×${g.stacks}`}><StatusIcon group={g} pack={pack} />{g.stacks > 1 && <b>{g.stacks}</b>}</span>)}
    {groups.length > 3 && <small>+{groups.length - 3}</small>}
  </span>;
}

export function CombatStatusStrip({ actor, actors, pack, now, focus = false }: { actor: ActorRenderView; actors: readonly ActorRenderView[]; pack: AssetPack | null; now: number; focus?: boolean }) {
  const [open, setOpen] = useState<string | null>(null), groups = actor.statuses ?? [], selected = groups.find(g => g.id === open);
  if (!groups.length && actor.spirit_spheres === undefined && !open) return null;
  return <div className={`combat-status-strip ${focus ? 'focused' : ''}`} data-status-actor={actor.actor_id}>
    {focus && <span className="status-owner">{actor.name.split(' · ')[0]}</span>}
    {actor.spirit_spheres !== undefined && <button className="sphere-counter" aria-label={`Spirit Sphere ${actor.spirit_spheres} จาก ${actor.spirit_sphere_capacity} ลูก P.ATK เพิ่ม ${percentNumber(actor.spirit_attack_bonus ?? 0)} เปอร์เซ็นต์`} onClick={() => setOpen('spirit_spheres')}>
      <SphereIcon pack={pack} /><b>{actor.spirit_spheres}<small>/{actor.spirit_sphere_capacity}</small></b>
    </button>}
    <div className="status-icons" role="group" aria-label={`Buff และ Debuff ของ ${actor.name}`}>
      {groups.map(g => <button key={g.id} className={`combat-status ${g.polarity}`} data-status-id={g.id} aria-label={`${g.polarity === 'buff' ? 'บัฟ' : 'ดีบัฟ'} ${g.name} ${g.stacks} ชั้น เหลือ ${timeLeft(g.next_expiry_at, now)}`} onClick={() => setOpen(g.id)}>
        <StatusIcon group={g} pack={pack} />{g.stacks > 1 && <b className="status-stacks">{g.stacks}</b>}<small>{timeLeft(g.next_expiry_at, now)}</small>
      </button>)}
    </div>
    {open && <Sheet title={open === 'spirit_spheres' ? 'Spirit Spheres' : selected?.name ?? 'สถานะสิ้นสุดแล้ว'} onClose={() => setOpen(null)} className="combat-status-details">
      {open === 'spirit_spheres' ? <><div className="sphere-detail"><SphereIcon pack={pack} /><b>{actor.spirit_spheres} / {actor.spirit_sphere_capacity} ลูก</b><strong>P.ATK +{percentNumber(actor.spirit_attack_bonus ?? 0)}%</strong></div><p>บอลแต่ละลูกที่ถืออยู่เพิ่ม P.ATK {percentNumber(actor.spirit_attack_per_sphere ?? 0)}% · ใช้บอลแล้วโบนัสลดทันทีตามจำนวนที่เหลือ</p><p>Call Spirits เติมบอล และ Spirit Combo มีโอกาสเพิ่มบอลจากการตีปกติ · ถูกขัดร่ายจะไม่คืนบอลที่ใช้ไป</p></>
        : selected ? <><p className="status-detail-summary">{selected.polarity === 'buff' ? 'บัฟ' : 'ดีบัฟ'} · {selected.stacks} ชั้น · ชั้นถัดไปหมดใน {timeLeft(selected.next_expiry_at, now)}</p><div className="status-instance-list">{selected.instances.map(i => <div key={i.instance_id} className="status-instance"><b>{i.name}<time>{timeLeft(i.expires_at, now)}</time></b><p>{i.description}</p><small>จาก {actors.find(a => a.actor_id === i.source_actor_id)?.name.split(' · ')[0] ?? i.source_actor_id}</small></div>)}</div><p className="hint">แต่ละชั้นหมดเวลาของตัวเอง · จำนวนชั้นนับการใช้ซ้ำ ไม่ได้นับจำนวนผลของสกิล</p></> : <p>สถานะนี้หมดเวลา ถูกล้าง หรือถูกใช้หมดแล้ว</p>}
    </Sheet>}
  </div>;
}

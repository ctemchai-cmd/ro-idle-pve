import { preparedWeaponElement } from '../../client/store.ts';
import { Icon } from '../icon.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { characterSkillOptions, placeSkill, removeSkill, type SkillOption,skillAwakeningEnabled } from '../../client/skills.ts';
import { previewStorySession, storyOptions } from '../../client/story.ts';
import { SkillTimeline } from '../skill-timeline.tsx';
import { SkillIcon } from '../skill-icon.tsx';
import { SkillCatalogSheet } from './skill-catalog.tsx';
import type { GameContext } from './shell.tsx';
import { CostChips, PageHeader, Sheet, canPay, friendNames, jobNames, seconds,compact,ResIcon } from './kit.tsx';
import { CharacterNav } from './character-nav.tsx';
import { SkillElements } from '../element-badge.tsx';
import { SkillGrowth } from '../skill-growth.tsx';
import {ShardExchangeSheet} from './shard-exchange.tsx';

const ordinal = ['1st', '2nd', '3rd', '4th'];
const tagText = (s: SkillOption) => {
  const effects = (s.definition.kind === 'active' ? [...s.definition.start_effects, ...s.definition.effects] : []) as unknown as { type: string; status_id?: string }[], tags: string[] = [];
  if (effects.some(e => e.type === 'damage')) tags.push('ดาเมจ'); if (effects.some(e => e.type === 'heal')) tags.push('ฮีล'); if (effects.some(e => e.type === 'shield')) tags.push('โล่');
  if (effects.some(e => e.type === 'apply_status' && ['stun', 'freeze', 'stone', 'sleep', 'silence', 'provoke'].includes(e.status_id ?? ''))) tags.push('ควบคุม'); else if (effects.some(e => e.type === 'apply_status')) tags.push('สถานะ');
  if (s.kind === 'passive') tags.push('ติดตัว');
  return tags.slice(0, 2);
};

export function SkillsPage({ context }: { context: GameContext }) {
  const { state, pack, submit, locked, characterId, go } = context, actor = state.roster.find(a => a.character_id === characterId)!;
  const options = useMemo(() => characterSkillOptions(actor, state), [actor, state]);
  const [catalog,setCatalog]=useState(false),[exchange,setExchange]=useState(false);
  // Skill-first flow (user request, 21 Oct 2026): tap a skill → สวมใส่ → tap the slot. Each placement saves at once;
  // `draft` only shows it optimistically until the receipt arrives (and snaps back if the command is refused).
  const [draft, setDraft] = useState(actor.active_slots), [picking, setPicking] = useState<string | null>(null), [selected, setSelected] = useState<string | null>(actor.active_slots.find(Boolean) ?? null);
  useEffect(() => { setDraft(structuredClone(actor.active_slots)); setPicking(null); setSelected(s => options.skills.some(o => o.id === s) ? s : actor.active_slots.find(Boolean) ?? options.skills[0]?.id ?? null); }, [actor.character_id, actor.job_id, JSON.stringify(actor.active_slots)]);
  const skill = options.skills.find(s => s.id === selected) ?? options.skills[0]!, equippedAt = draft.indexOf(skill.id);
  const save = (next: typeof draft) => { setPicking(null); if (JSON.stringify(next) === JSON.stringify(actor.active_slots)) return; setDraft(next); void submit('skill.set_loadout', { character_id: actor.character_id, skill_ids: next }).then(ok => { if (!ok) setDraft(structuredClone(actor.active_slots)); }); };
  const strip = useRef<HTMLElement>(null);
  useEffect(() => { if (picking) strip.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [picking]);
  const placeAt = (id: string, slot: number) => save(placeSkill(draft, id, slot));
  const list = [...options.skills.filter(s => s.kind === 'active'), ...options.skills.filter(s => s.kind === 'passive')];
  // Draft rotation preview: the same engine projection as the battle Timeline, against the next boss, before saving.
  const [timelineOpen, setTimelineOpen] = useState(false), clock = useRef(0), inTeam = state.team.some(p => p.character_id === actor.character_id);
  const stageRows = storyOptions(state), stageId = stageRows.find(o => o.available && !o.cleared)?.id ?? stageRows.filter(o => o.cleared).at(-1)?.id ?? '1-1';
  const preview = useMemo(() => {
    if (!timelineOpen) return null;
    try { const clone = structuredClone(state); clone.roster.find(a => a.character_id === actor.character_id)!.active_slots = structuredClone(draft); return previewStorySession(clone, stageId); } catch { return null; }
  }, [timelineOpen, state, JSON.stringify(draft), actor.character_id, stageId]);
  useEffect(() => { if (preview && pack) void pack.prepareIcons(preview.view().actors.flatMap(a => a.slots.filter((id): id is string => id !== null))); }, [preview, pack]);
  return <div className="page skills-page">
    <PageHeader title={`สกิล · ${friendNames[actor.character_id]}`} sub={`${jobNames[actor.job_id]} · Lv.${actor.level} · คิว ${seconds(options.intervalMs)}`} onBack={() => go('buddy', actor.character_id)} right={<div className="character-skill-actions"><button className="icon-btn" title="สมุดสกิลทุกอาชีพ" aria-label="สมุดสกิลทุกอาชีพ" onClick={()=>setCatalog(true)}><Icon name="book"/></button><CharacterNav context={context} /></div>} />
    {skillAwakeningEnabled&&<div className="awakening-tools"><span><ResIcon pack={pack} k="awakening_shard"/>{compact(state.wallet.awakening_shard)}</span><button className="btn ghost" onClick={()=>setExchange(true)}>แลกเศษ</button></div>}
    <div className="skill-split">
      <ul className="skill-list" aria-label="รายการสกิล">{list.map(s => { const at = draft.indexOf(s.id); return <li key={s.id}><button className={`skill-row ${skill.id === s.id ? 'on' : ''} ${s.locked ? 'locked' : ''}`} aria-pressed={skill.id === s.id} onClick={() => { setSelected(s.id); setPicking(null); }}>
        <span className="skill-icon-wrap"><SkillIcon id={s.id} pack={pack} awakened={s.awakened} />{s.level > 0 && <i className="lv-badge">{s.level}</i>}</span>
        <span className="row-main"><b>{s.name}</b><small>{s.locked ? `ปลดที่ Lv.${s.unlock}` : s.kind === 'passive' ? 'Passive' : s.level ? `Lv.${s.level}/${s.cap}` : 'ยังไม่เรียน'}</small><span className="tag-row">{tagText(s).map(t => <em key={t} className="tag">{t}</em>)}</span></span>
        {at >= 0 && <em className="equip-ribbon">{ordinal[at]}</em>}
      </button></li>; })}</ul>
      <section className="skill-detail" aria-label="รายละเอียดสกิล">
        <header><SkillIcon id={skill.id} pack={pack} awakened={skill.awakened} /><div><h2>{skill.name}{skill.awakened&&<span className="awaken-badge">Awaken</span>}</h2><small>{skill.kind === 'active' ? 'Active' : 'Passive'} · {skill.targetNote}</small></div></header>
        <SkillElements pack={pack} definition={skill.definition} weaponElement={preparedWeaponElement(state, actor.character_id)} />
        <div className="level-line"><span>Level</span><b>{skill.level || '—'}</b><small>เพดาน {skill.cap} / {skill.max} · เต็มที่ Lv.{skill.fullAt}</small></div>
        {skill.kind === 'active' && <div className="timing"><span>ร่าย <b>{seconds(skill.castMs)}</b></span><span>พัก <b>{seconds(skill.afterCastMs)}</b></span><span>SP <b>{Number.isFinite(skill.sp) ? skill.sp : 'ทั้งหมด'}</b></span></div>}
        <div className="effect-block"><h3>{skill.level ? `ตอนนี้ Lv.${skill.level}` : 'เมื่อเรียน Lv.1'}</h3>{(skill.level ? skill.effects : skill.nextEffects.length ? skill.nextEffects : skill.effects).map((t, i) => <p key={i}>{t}</p>)}</div>
        <SkillGrowth skill={skill} />
        {skill.awakenPrice&&<div className="awaken-box"><details><summary>Awaken · Lv.1</summary>{skill.awakenEffects?.map((text,i)=><p key={i}>{text}</p>)}</details><CostChips cost={skill.awakenPrice} wallet={state.wallet} pack={pack}/><button className="btn primary wide" disabled={locked||!canPay(state.wallet,skill.awakenPrice)} onClick={()=>void submit('skill.awaken',{character_id:actor.character_id,skill_id:skill.id})}><SkillIcon id={skill.id} pack={pack} awakened/>Awaken · Lv.1</button></div>}
        {skill.locked ? <p className="hint warn">ต้องเป็น Lv.{skill.unlock} เพื่อเรียน</p> : skill.price ? <div className="upgrade-box"><CostChips cost={skill.price} wallet={state.wallet} pack={pack} /><button className="btn primary wide" disabled={locked || !canPay(state.wallet, skill.price)} onClick={() => void submit('skill.upgrade', { character_id: actor.character_id, skill_id: skill.id, target_level: skill.level + 1 })}>{skill.level ? 'อัปเกรด' : 'เรียนสกิล'}</button></div> : <p className="hint">{skill.level >= skill.max ? 'ระดับสูงสุดแล้ว' : `ระดับถัดไปที่ Lv.${skill.nextRankAt}`}</p>}
        {skill.kind === 'active' && skill.level > 0 && (picking === skill.id
          ? <button className="btn wide" onClick={() => setPicking(null)}>ยกเลิก · ยังไม่เลือกช่อง</button>
          : <div className="row equip-actions"><button className="btn primary" disabled={locked} onClick={() => setPicking(skill.id)}>{equippedAt >= 0 ? 'ย้ายช่อง' : 'สวมใส่'}</button>{equippedAt >= 0 && <button className="btn ghost" disabled={locked} onClick={() => save(removeSkill(draft, skill.id))}>ถอดออก</button>}</div>)}
        {skill.kind === 'passive' && skill.level > 0 && <p className="hint">ทำงานอัตโนมัติ · ไม่ใช้ช่อง</p>}
      </section>
    </div>
    <section ref={strip} className={`loadout ${picking ? 'picking' : ''}`} aria-label="คิวสกิลสี่ช่อง">
      {picking && <p className="loadout-hint" role="status">จัดช่อง · {options.skills.find(s => s.id === picking)?.name}</p>}
      <div className="loadout-slots">{draft.map((id, i) => <button key={i} className={`loadout-slot ${!picking && id === skill.id ? 'on' : ''} ${picking ? 'target' : ''}`} aria-label={`ช่องสกิล ${i + 1}`} disabled={!!picking && locked} onClick={() => { if (picking) placeAt(picking, i); else if (id) setSelected(id); }}><small>{ordinal[i]}</small>{id ? <SkillIcon id={id} pack={pack} awakened={actor.awakened_skills.includes(id)} /> : <span className="empty">+</span>}</button>)}</div>
    </section>
    <button className="loadout-timeline" aria-haspopup="dialog" onClick={() => setTimelineOpen(true)}><span>Timeline เทียบเพื่อน</span><small>ดูจังหวะสกิล ›</small></button>
    {timelineOpen && <Sheet title={`Timeline · ด่าน ${stageId}`} onClose={() => setTimelineOpen(false)} className="tall skill-preview">{!inTeam ? <p className="hint">ตัวละครนี้ไม่ได้อยู่ในทีม</p> : preview && pack ? <SkillTimeline key={JSON.stringify(draft)} session={preview} pack={pack} view={preview.view()} clock={clock} /> : <p className="hint">ยังจำลอง Timeline ไม่ได้</p>}</Sheet>}
    {exchange&&<ShardExchangeSheet context={context} onClose={()=>setExchange(false)}/>}
    {catalog&&<SkillCatalogSheet pack={pack} initialJob={actor.job_id} onClose={()=>setCatalog(false)}/>}
  </div>;
}

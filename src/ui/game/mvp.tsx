import{MonsterSizeBadge}from'../monster-size-badge.tsx';
import{SkillIcon}from'../skill-icon.tsx';
import {mvpView} from '../../client/artifacts.ts';
import type {GameContext} from './shell.tsx';
import {PageHeader,ResIcon,full,compact} from './kit.tsx';
import {ElementBadge} from '../element-badge.tsx';
import './artifacts.css';
export function MvpPage({context}:{context:GameContext}){
 const{state,pack,go,locked,challenge}=context,v=mvpView(state,Date.now());
 return <div className="page mvp-page"><PageHeader title="MVP Hunt" sub={`สัปดาห์ ${v.week} · เปลี่ยนวันจันทร์ 00:00`} onBack={()=>go('dungeon')}/>{!v.unlocked?<p className="hint">ผ่าน {v.unlock_after} และเลื่อน Hi-class เพื่อเปิด</p>:v.bosses.map(b=><section className="mvp-card" key={b.id}><h3>{b.id.replaceAll('_',' ')}<MonsterSizeBadge size={b.size}/><ElementBadge armor compact element={b.element as Parameters<typeof ElementBadge>[0]['element']} pack={pack}/></h3><small>ผ่านสูงสุดระดับ {b.best}/10 · ท้าระดับ {b.tier}</small><div className="mvp-facts"><span>HP {compact(b.stats.max_hp)}</span><span>P.ATK {full(b.stats.physical_attack)}</span><span>M.ATK {full(b.stats.magical_attack)}</span></div><div className="mvp-skills" aria-label="สกิลบอส">{b.skills.map(id=><SkillIcon key={id} id={id} pack={pack}/>)}</div><div className="mvp-facts"><span><ResIcon pack={pack} k="crystal"/>{b.reward.crystal-b.previous.crystal}</span><span>Essence {b.reward.essence-b.previous.essence}</span><span>ตั๋ว Artifact {b.reward.tickets-b.previous.tickets}</span></div><button className="btn primary" disabled={locked} onClick={()=>challenge({kind:'mvp',boss:b.id,tier:b.tier})}>{b.best===10?'ท้าซ้ำระดับ10':'ท้าทายระดับ '+b.tier}</button></section>)}</div>;
}

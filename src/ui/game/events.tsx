import {EventCurrency} from './event-currency.tsx';
import {useEffect,useRef,useState} from 'react';
import {eventsView} from '../../client/events.ts';
import {revealItems} from '../../client/store.ts';
import type {GameContext} from './shell.tsx';
import {PageHeader,ResIcon,compact,full,duration,friendNames,jobNames,Sheet,ItemIcon,iconUrl} from './kit.tsx';
import {ClassIcon} from './class-icon.tsx';
import {MonsterSizeBadge} from '../monster-size-badge.tsx';
import {ElementBadge} from '../element-badge.tsx';
import {SkillIcon} from '../skill-icon.tsx';
import {CardIcon} from './card-art.tsx';
import {Icon} from '../icon.tsx';
import './events.css';
function EventArt({context,kind}:{context:GameContext;kind:string}){
 const feature=kind==='mvp_card'?'shop_cards':kind==='weapon'?'shop_equipment':null;
 const url=feature?iconUrl(context.pack,'feature_icons',feature):null;
 return url?<img src={url} alt=""/>:<ResIcon pack={context.pack} k={kind==='artifact'?'artifact_ticket':kind}/>;
}
export function EventsPage({context}:{context:GameContext}){
 const{state,pack,go,locked,submit}=context,[now,setNow]=useState(Date.now),[tab,setTab]=useState<'activity'|'shop'>('activity'),[usePrevious,setUsePrevious]=useState(false),[character,setCharacter]=useState(context.characterId),[busy,setBusy]=useState(false),gate=useRef(false),[received,setReceived]=useState<string[]>([]),[selectedTier,setSelectedTier]=useState<number|null>(null);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const v=eventsView(state,now),old=usePrevious?v.previous:null,period=old?.period??v.period,tokens=old?.tokens??v.tokens,results=revealItems(state,received);
 useEffect(()=>{setSelectedTier(null);setUsePrevious(false);},[v.period.period_id]);
 const boss=v.bosses.find(b=>b.tier===(selectedTier??Math.min(5,v.record.boss_best+1))),checked=v.record.checkins.includes(v.day),ready=v.missions.filter(m=>!m.claimed&&m.current>=m.target).length;
 const heroIcon=iconUrl(pack,'ui_icons',v.period.kind==='boss'?'mode_mvp':'mode_events');
 async function act(type:'event.checkin'|'event.claim'|'event.redeem',params:Record<string,unknown>){if(gate.current||locked)return;gate.current=true;setBusy(true);try{if(await submit(type,params)){if(type==='event.redeem'){setReceived(context.lastCreated());context.toast('แลกรางวัลแล้ว');}}}catch{context.toast('ทำรายการไม่สำเร็จ ลองเชื่อมต่อเซฟอีกครั้ง');}finally{gate.current=false;setBusy(false);}}
 const disabled=locked||busy;
 return <div className="page events-page"><PageHeader title="กิจกรรม" onBack={()=>go('dungeon')}/>
  <header className="event-hero"><div className="event-hero-art">{heroIcon&&<img src={heroIcon} alt=""/>}</div><div className="event-hero-copy"><small>{v.period.kind==='boss'?'บอสประจำสัปดาห์':'เทศกาลประจำสัปดาห์'}</small><h2>{v.period.name}</h2><p><Icon name="clock"/>เหลือ {duration(Math.max(0,v.period.end_ms-now))}</p></div><div className="event-token-balance"><EventCurrency amount={v.tokens} pack={pack}/></div></header>
  {!v.unlocked?<p className="hint">เปิดหลังผ่าน {v.unlock_after}</p>:<>
   <div className="seg event-tabs" role="tablist" aria-label="หน้ากิจกรรม"><button role="tab" aria-selected={tab==='activity'} onClick={()=>setTab('activity')}>ภารกิจ{ready>0&&<span className="event-ready-count">{ready}</span>}</button><button role="tab" aria-selected={tab==='shop'} onClick={()=>setTab('shop')}>แลกรางวัล</button></div>
   {tab==='activity'&&<>
    <section className={`event-checkin ${checked?'claimed':''}`}><span className="event-checkin-icon"><ResIcon k="event_token" pack={pack}/></span><div><b>เช็กอินประจำวัน</b><small className="event-checkin-reward"><EventCurrency amount={v.checkin_tokens} pack={pack}/>{!v.record.joined&&<span>ครั้งแรก +{v.participation_tokens}</span>}</small></div><button className="btn primary small" disabled={disabled||checked} onClick={()=>void act('event.checkin',{period_id:v.period.period_id})}>{checked?<><Icon name="check"/>รับแล้ว</>:'รับ'}</button></section>
    {boss&&<section className="event-bosses" aria-label="บอสกิจกรรม"><div className="event-section-title"><h3>{v.period.boss.replaceAll('_',' ')}</h3><span>ผ่าน {v.record.boss_best}/{v.bosses.length}</span></div><div className="event-tier-tabs" role="group" aria-label="ระดับบอสกิจกรรม">{v.bosses.map(b=><button key={b.tier} aria-pressed={boss.tier===b.tier} className={b.cleared?'cleared':''} onClick={()=>setSelectedTier(b.tier)}><small>ระดับ</small><b>{b.tier}</b>{b.cleared?<Icon name="check"/>:!b.unlocked?<Icon name="lock"/>:null}</button>)}</div>
     <article className="event-boss-detail"><header><b>ระดับ {boss.tier}</b><MonsterSizeBadge size={boss.size}/><ElementBadge element={boss.boss.element as Parameters<typeof ElementBadge>[0]['element']} armor compact pack={pack}/></header><div className="event-boss-stats"><span>HP <b>{compact(boss.boss.resolved_base.max_hp)}</b></span><span>P.ATK <b>{full(boss.boss.resolved_base.physical_attack)}</b></span></div><div className="event-boss-skills">{boss.boss.active_slots.filter((id):id is string=>id!==null).map((id,i)=><SkillIcon key={`${id}-${i}`} id={id} pack={pack}/>)}</div><footer><span>{boss.cleared?'รับรางวัลแล้ว':<EventCurrency amount={Math.max(0,boss.reward)} pack={pack}/>}</span><button className="btn primary" disabled={disabled||!boss.unlocked} onClick={()=>context.challenge({kind:'event',period:v.period.period_id,tier:boss.tier})}>{boss.cleared?'ท้าซ้ำ':boss.unlocked?'ท้าทาย':`ผ่าน ${boss.anchor}`}</button></footer></article>
    </section>}
    <section className="event-missions" aria-label="ภารกิจกิจกรรม"><div className="event-section-title"><h3>ภารกิจสะสม</h3><span>{v.missions.filter(m=>m.claimed).length}/{v.missions.length}</span></div>{[...v.missions].sort((a,b)=>Number(a.claimed)-Number(b.claimed)||Number(b.current>=b.target)-Number(a.current>=a.target)).map(m=><article key={m.id} className={`${m.claimed?'claimed':''} ${!m.claimed&&m.current>=m.target?'ready':''}`}><div><b>{m.name}</b><small className="event-mission-progress"><span>{compact(Math.min(m.current,m.target))} / {compact(m.target)}</span><EventCurrency amount={m.tokens} pack={pack}/></small><progress aria-label={m.name} max={m.target} value={Math.min(m.current,m.target)}/></div><button className={`btn small ${!m.claimed&&m.current>=m.target?'primary':''}`} disabled={disabled||m.claimed||m.current<m.target} onClick={()=>void act('event.claim',{period_id:v.period.period_id,mission_id:m.id})}>{m.claimed?<Icon name="check"/>:'รับ'}{m.claimed&&<span className="sr-only">รับแล้ว</span>}</button></article>)}</section>
   </>}
   {tab==='shop'&&<><div className="event-shop-head"><div><small>{old?'แต้มรอบก่อน':'แต้มที่มี'}</small><EventCurrency amount={tokens} pack={pack}/></div>{v.previous&&<button className="btn ghost small" onClick={()=>setUsePrevious(!usePrevious)}>{old?'รอบปัจจุบัน':'รอบก่อน'}</button>}</div>{old&&<p className="hint">{old.period.name} · แลกได้ถึงรอบนี้จบ</p>}
    <label className="event-character"><ClassIcon job={state.roster.find(a=>a.character_id===character)!.job_id} pack={pack}/><span>อาวุธสำหรับ</span><select aria-label="ตัวละครรับอาวุธกิจกรรม" value={character} onChange={e=>setCharacter(e.target.value)}>{state.roster.map(a=><option key={a.character_id} value={a.character_id}>{friendNames[a.character_id]} · {jobNames[a.job_id]}</option>)}</select></label>
    <section className="event-shop" aria-label="ร้านกิจกรรม">{v.offers(period.period_id).map(o=><article key={o.id} className={`${o.kind==='weapon'||o.kind==='mvp_card'?'premium':''} ${o.left<=0?'sold-out':''}`}><div className="event-offer-art"><EventArt context={context} kind={o.kind}/>{['weapon','mvp_card'].includes(o.kind)&&<span>Legendary</span>}</div><div className="event-offer-copy"><b>{o.name}</b><small>{o.kind==='weapon'?`Lv.${v.tier} · `:''}เหลือ {o.left}/{o.limit}</small></div><button className="btn primary small" disabled={disabled||!o.affordable||o.left<=0} aria-label={`แลก ${o.name} ${o.price} แต้มกิจกรรม`} onClick={()=>void act('event.redeem',{period_id:period.period_id,offer_id:o.id,character_id:character})}>{o.left<=0?'หมดแล้ว':<><span>แลก</span><EventCurrency amount={o.price} pack={pack}/></>}</button></article>)}</section>
   </>}
  </>}
  {results.length>0&&<Sheet title="ได้รับรางวัล" onClose={()=>setReceived([])}><div className="event-received">{results.map(r=><article key={r.item.instance_id}>{r.item.kind==='card'?<CardIcon card={r} pack={pack}/>:<ItemIcon id={r.iconId} pack={pack}/>}<b>{r.name}</b></article>)}</div><button className="btn primary wide" onClick={()=>setReceived([])}>เสร็จสิ้น</button></Sheet>}
 </div>;
}

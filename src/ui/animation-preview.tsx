import { useEffect, useRef, useState } from 'react';
import { AssetPack } from '../renderer/pack.ts';
import { NativeActorTween } from '../renderer/actor-tween.ts';
import { actorDuration, actorFrame, drawActor, type ActorParts } from '../renderer/native.mjs';
import { presetSwing } from '../renderer/actor-animation.ts';
import { actorPreviewLayout } from '../renderer/actor-preview.ts';
import './animation-preview.css';

/** A native-art comparison only: no account, Auth, simulation or persistence. */
export default function AnimationPreview() {
  const canvas=useRef<HTMLCanvasElement>(null),clock=useRef(0),running=useRef(true),scrub=useRef<HTMLInputElement>(null);
  const [pack,setPack]=useState<AssetPack|null>(null),[parts,setParts]=useState<(ActorParts&{previewJob:string;previewGender:string})|null>(null),[gender,setGender]=useState<'male'|'female'>('male'),[left,setLeft]=useState(false),[paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[error,setError]=useState('');
  const [jobId,setJobId]=useState('swordsman'),[swing,setSwing]=useState('attack');
  const jobs=pack?.index.actor_jobs??[],job=jobs.find(j=>j.job_id===jobId),preset=job?.presets.find(p=>p.gender===gender)??job?.presets[0];
  const swingStates=['attack',...(preset?.attack_variant_indices??[]).slice(1).map((_,i)=>'attack'+(i+2))];
  const label=(id:string)=>id.split('_').map(s=>s[0]!.toUpperCase()+s.slice(1)).join(' ');
  useEffect(()=>{let stopped=false;void AssetPack.open().then(p=>{if(stopped)p.dispose();else setPack(p);}).catch(()=>setError('โหลดภาพไม่สำเร็จ กรุณาโหลดใหม่'));return()=>{stopped=true;};},[]);
  useEffect(()=>()=>pack?.dispose(),[pack]);
  useEffect(()=>{if(!pack||!preset)return;let stopped=false;setParts(null);setError('');
    void Promise.all([pack.asset(preset.body.meta),preset.head?pack.asset(preset.head.meta):undefined,preset.weapon?pack.asset(preset.weapon.meta):undefined]).then(([body,head,weapon])=>{if(!stopped){clock.current=0;setParts({body,head,weapon,...presetSwing(preset),previewJob:jobId,previewGender:preset.gender});}}).catch(()=>{if(!stopped)setError('เตรียมตัวละครไม่สำเร็จ');});return()=>{stopped=true;};
  },[pack,preset]);
  useEffect(()=>{running.current=!paused;},[paused]);
  useEffect(()=>{clock.current=0;},[swing]);
  useEffect(()=>{const node=canvas.current;if(!node||!parts)return;const drawnCanvas=node,ctx=node.getContext('2d')!,tween=new NativeActorTween(),duration=actorDuration(parts,swing),cycle=duration+450,layout=actorPreviewLayout(parts,swing,left);let raf=0,last=performance.now();ctx.imageSmoothingEnabled=false;
    function draw(now:number){const delta=document.hidden?0:Math.min(100,Math.max(0,now-last));last=now;if(running.current)clock.current=(clock.current+delta)%cycle;
      const at=clock.current,state=at<duration?swing:'idle',elapsed=state==='idle'?0:at;
      ctx.clearRect(0,0,720,560);ctx.fillStyle='#f3f7fd';ctx.fillRect(0,0,720,560);
      for(const x of[180,540]){ctx.fillStyle='#d9e6f6';ctx.beginPath();ctx.ellipse(x+layout.xOffset,466,61,13,0,0,Math.PI*2);ctx.fill();}
      drawActor(ctx,parts!,state,elapsed,180+layout.xOffset,layout.y,left?'left':'right',layout.scale);
      tween.draw(ctx,parts!,state,elapsed,540+layout.xOffset,layout.y,left?'left':'right',layout.scale,!matchMedia('(prefers-reduced-motion: reduce)').matches);
      if(scrub.current){scrub.current.max=String(cycle);scrub.current.value=String(Math.round(at));}
      drawnCanvas.dataset.time=String(at);drawnCanvas.dataset.state=state;drawnCanvas.dataset.job=parts!.previewJob;drawnCanvas.dataset.gender=parts!.previewGender;drawnCanvas.dataset.swing=swing;drawnCanvas.dataset.sourceFrame=String(actorFrame(parts!,state,elapsed).index);raf=requestAnimationFrame(draw);
    }raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[parts,left,swing]);
  return <main className="animation-preview"><div className="animation-rotate" role="status">กรุณาหมุนหน้าจอเป็นแนวตั้ง</div>
    <header><a href="/play">กลับเกม</a><h1>ท่าโจมตีทุกอาชีพ</h1><p>ภาพเดิม + ท่าคั่นที่คำนวณจากจุดยึดเดิม</p></header>
    <div className="animation-selectors"><label>อาชีพ<select aria-label="อาชีพ" value={jobId} disabled={!pack} onChange={e=>{const id=e.target.value,next=jobs.find(j=>j.job_id===id)!;setJobId(id);setSwing('attack');setGender(g=>next.presets.some(p=>p.gender===g)?g:next.presets[0]!.gender==='female'?'female':'male');}}>{jobs.length?jobs.map(j=><option key={j.job_id} value={j.job_id}>{label(j.job_id)}</option>):<option value="swordsman">Swordsman</option>}</select></label>{swingStates.length>1&&<label>ท่าโจมตี<select aria-label="ท่าโจมตี" value={swing} onChange={e=>setSwing(e.target.value)}>{swingStates.map((s,i)=><option key={s} value={s}>ท่าที่ {i+1}</option>)}</select></label>}</div>
    <div className="animation-options"><button disabled={!job?.presets.some(p=>p.gender==='male')} aria-pressed={gender==='male'} onClick={()=>setGender('male')}>ชาย</button><button disabled={!job?.presets.some(p=>p.gender==='female')} aria-pressed={gender==='female'} onClick={()=>setGender('female')}>หญิง</button><button aria-pressed={left} onClick={()=>setLeft(v=>!v)}>หัน{left?'ซ้าย':'ขวา'}</button><button disabled={!parts} onClick={()=>setPaused(v=>!v)}>{paused?'เล่นต่อ':'หยุดภาพ'}</button></div>
    <div className="animation-labels"><b>ต้นฉบับ</b><b>ท่าคั่น + ผสาน</b></div>
    <div className="animation-stage"><canvas ref={canvas} width={720} height={560} aria-label="ซ้ายต้นฉบับ ขวาท่าคั่นและผสานเฟรม"/>{(!parts||error)&&<p role="status">{error||'กำลังเตรียมภาพ…'}</p>}</div>
    <label className="animation-scrub">เลื่อนดูท่า<input ref={scrub} type="range" min="0" max="1350" defaultValue="0" disabled={!parts} onChange={e=>{setPaused(true);clock.current=Number(e.target.value);}}/></label>
    <p className="animation-note">ใช้ภาพ RO ชุดเดิม · ท่าโจมตียังยาว {parts?(actorDuration(parts,swing)/1000).toFixed(1):'0.9'} วินาที<br/>ฝั่งขวาคำนวณตำแหน่งคั่นและผสานภาพช่วงสั้น ๆ ไม่ใช่สไปรต์วาดใหม่</p>
  </main>;
}

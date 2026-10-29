import { useEffect, useRef, useState } from 'react';
import { AssetPack } from '../renderer/pack.ts';
import { NativeActorTween } from '../renderer/actor-tween.ts';
import { actorDuration, actorFrame, drawActor, type ActorParts } from '../renderer/native.mjs';
import { presetSwing } from '../renderer/actor-animation.ts';
import './animation-preview.css';

/** A native-art comparison only: no account, Auth, simulation or persistence. */
export default function AnimationPreview() {
  const canvas=useRef<HTMLCanvasElement>(null),clock=useRef(0),running=useRef(true),scrub=useRef<HTMLInputElement>(null);
  const [pack,setPack]=useState<AssetPack|null>(null),[parts,setParts]=useState<ActorParts|null>(null),[gender,setGender]=useState<'male'|'female'>('male'),[left,setLeft]=useState(false),[paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[error,setError]=useState('');
  useEffect(()=>{let stopped=false;void AssetPack.open().then(p=>{if(stopped)p.dispose();else setPack(p);}).catch(()=>setError('โหลดภาพไม่สำเร็จ กรุณาโหลดใหม่'));return()=>{stopped=true;};},[]);
  useEffect(()=>()=>pack?.dispose(),[pack]);
  useEffect(()=>{if(!pack)return;let stopped=false;setParts(null);const preset=pack.index.actor_jobs.find(j=>j.job_id==='swordsman')!.presets.find(p=>p.gender===gender)!;
    void Promise.all([pack.asset(preset.body.meta),pack.asset(preset.head!.meta),pack.asset(preset.weapon!.meta)]).then(([body,head,weapon])=>{if(!stopped){clock.current=0;setParts({body,head,weapon,...presetSwing(preset)});}}).catch(()=>{if(!stopped)setError('เตรียมตัวละครไม่สำเร็จ');});return()=>{stopped=true;};
  },[pack,gender]);
  useEffect(()=>{running.current=!paused;},[paused]);
  useEffect(()=>{const node=canvas.current;if(!node||!parts)return;const drawnCanvas=node,ctx=node.getContext('2d')!,tween=new NativeActorTween(),duration=actorDuration(parts,'attack'),cycle=duration+450;let raf=0,last=performance.now();ctx.imageSmoothingEnabled=false;
    function draw(now:number){const delta=document.hidden?0:Math.min(100,Math.max(0,now-last));last=now;if(running.current)clock.current=(clock.current+delta)%cycle;
      const at=clock.current,state=at<duration?'attack':'idle',elapsed=state==='attack'?at:0;
      ctx.clearRect(0,0,720,560);ctx.fillStyle='#f3f7fd';ctx.fillRect(0,0,720,560);
      for(const x of[180,540]){ctx.fillStyle='#d9e6f6';ctx.beginPath();ctx.ellipse(x,466,61,13,0,0,Math.PI*2);ctx.fill();}
      drawActor(ctx,parts!,state,elapsed,180,460,left?'left':'right',2.1);
      tween.draw(ctx,parts!,state,elapsed,540,460,left?'left':'right',2.1,!matchMedia('(prefers-reduced-motion: reduce)').matches);
      if(scrub.current){scrub.current.max=String(cycle);scrub.current.value=String(Math.round(at));}
      drawnCanvas.dataset.time=String(at);drawnCanvas.dataset.state=state;drawnCanvas.dataset.sourceFrame=String(actorFrame(parts!,state,elapsed).index);raf=requestAnimationFrame(draw);
    }raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[parts,left]);
  return <main className="animation-preview"><div className="animation-rotate" role="status">กรุณาหมุนหน้าจอเป็นแนวตั้ง</div>
    <header><a href="/play">กลับเกม</a><h1>ท่าฟันนักดาบ</h1><p>ภาพเดิม + ท่าคั่นที่คำนวณจากจุดยึดเดิม</p></header>
    <div className="animation-options"><button aria-pressed={gender==='male'} onClick={()=>setGender('male')}>ชาย</button><button aria-pressed={gender==='female'} onClick={()=>setGender('female')}>หญิง</button><button aria-pressed={left} onClick={()=>setLeft(v=>!v)}>หัน{left?'ซ้าย':'ขวา'}</button><button disabled={!parts} onClick={()=>setPaused(v=>!v)}>{paused?'เล่นต่อ':'หยุดภาพ'}</button></div>
    <div className="animation-labels"><b>ต้นฉบับ</b><b>ท่าคั่น + ผสาน</b></div>
    <div className="animation-stage"><canvas ref={canvas} width={720} height={560} aria-label="นักดาบซ้ายต้นฉบับ ขวาท่าคั่นและผสานเฟรม"/>{(!parts||error)&&<p role="status">{error||'กำลังเตรียมภาพ…'}</p>}</div>
    <label className="animation-scrub">เลื่อนดูท่า<input ref={scrub} type="range" min="0" max="1350" defaultValue="0" disabled={!parts} onChange={e=>{setPaused(true);clock.current=Number(e.target.value);}}/></label>
    <p className="animation-note">ใช้ภาพ RO ชุดเดิม · ท่าฟันยังยาว {parts?(actorDuration(parts,'attack')/1000).toFixed(1):'0.9'} วินาที<br/>ฝั่งขวาคำนวณตำแหน่งคั่นและผสานภาพช่วงสั้น ๆ ไม่ใช่สไปรต์วาดใหม่</p>
  </main>;
}

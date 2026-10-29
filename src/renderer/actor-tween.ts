import { actorFrame, attachmentFrame, drawActor, drawParts, type ActorParts, type NativeAsset, type NativeFrame } from './native.mjs';

type Point = readonly [number,number];
type Segment = { asset:NativeAsset; frame:NativeFrame; offset:number[] };
export interface ActorTweenSample {
  from:ReturnType<typeof actorFrame>; to:ReturnType<typeof actorFrame>;
  amount:number; blend:number; anchor:Point;
}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const angle=(a:number,b:number,t:number)=>a+(((b-a+180)%360+360)%360-180)*t;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>n*n*(3-2*n);
const anchor=(f:NativeFrame|null):Point|null=>f?.anchor?.length===2&&f.anchor.every(Number.isFinite)&&f.anchor[1]! < -1 ? [f.anchor[0]!,f.anchor[1]!] : null;

/** Geometry is generated between native keys, never by changing their ACT clock. */
export function actorTweenSample(parts:ActorParts,state:string,elapsed:number):ActorTweenSample|null {
  if(!parts.head||!state.startsWith('attack')||!Number.isFinite(elapsed)||elapsed<0)return null;
  const from=actorFrame(parts,state,elapsed),delay=from.action?.frame_duration_ms??0;
  if(!from.frame||!from.action||delay<=0||elapsed>=from.action.frames.length*delay)return null;
  const amount=elapsed/delay-Math.floor(elapsed/delay);if(amount<1e-8)return null;
  const to=from.index===from.action.frames.length-1?actorFrame(parts,'idle',0):actorFrame(parts,state,(from.index+1)*delay),a=anchor(from.frame),b=anchor(to.frame);if(!a||!b)return null;
  const target:Point=[lerp(a[0],b[0],amount),lerp(a[1],b[1],amount)];
  for(const source of[a,b])if(Math.abs((target[0]-source[0])/source[1])>.5||target[1]/source[1]<.65||target[1]/source[1]>1.5)return null;
  return{from,to,amount,blend:smooth(clamp((amount-.38)/.24)),anchor:target};
}

function segments(parts:ActorParts,s:ActorTweenSample['from'],state:string,group:'lower'|'head'|'weapon'):Segment[]{
  if(!s.frame||!s.action)return[];
  const result:Segment[]=[];
  const add=(asset:NativeAsset|undefined,head=false)=>{if(!asset)return;const f=attachmentFrame(asset,s.action!,s.frame!,s.index,state);if(f)result.push({asset,frame:f.frame,offset:head?f.offset:[0,0]});};
  if(group==='lower'){add(parts.garment);add(parts.shield);result.push({asset:parts.body,frame:s.frame,offset:[0,0]});}
  if(group==='head'){add(parts.head,true);add(parts.headgear,true);}
  if(group==='weapon')add(parts.weapon);
  return result;
}
function matching(a:Segment[],b:Segment[]):boolean {
  return a.length===b.length&&a.every((s,i)=>s.asset===b[i]!.asset&&s.frame.layers.length===b[i]!.frame.layers.length&&s.frame.layers.every((l,j)=>l[2]===b[i]!.frame.layers[j]![2]&&l[3]===b[i]!.frame.layers[j]![3]));
}
function intermediate(a:Segment,b:Segment,t:number,chooseNext=false):NativeFrame {
  const chosen=chooseNext?b:a;
  return{layers:chosen.frame.layers.map((layer,i)=>{
    const l=a.frame.layers[i],r=b.frame.layers[i];if(!l||!r){const row=[...layer];row[0]=row[0]!+chosen.offset[0]!;row[1]=row[1]!+chosen.offset[1]!;return row;}
    const get=(v:number[]|undefined,n:number,def:number)=>v?.[n]??def;
    const row=[...layer];
    row[0]=lerp(l[0]!+a.offset[0]!,r[0]!+b.offset[0]!,t);
    row[1]=lerp(l[1]!+a.offset[1]!,r[1]!+b.offset[1]!,t);
    for(const n of[4,5,6,7])row[n]=lerp(get(l,n,255),get(r,n,255),t);
    row[8]=lerp(get(l,8,1),get(r,8,1),t);row[9]=lerp(get(l,9,1),get(r,9,1),t);
    row[10]=angle(get(l,10,0),get(r,10,0),t);return row;
  })};
}
function paint(ctx:CanvasRenderingContext2D,items:Segment[],source?:Point,target?:Point):number {
  ctx.save();if(source&&target)ctx.transform(1,0,(target[0]-source[0])/source[1],target[1]/source[1],0,0);
  let count=0;for(const s of items)count+=drawParts(ctx,s.asset,s.frame,s.offset);ctx.restore();return count;
}

/** Reusable scratch belongs to the renderer, not to every frame or actor. */
export class NativeActorTween {
  private surfaces:HTMLCanvasElement[]|null=null;
  get scratchBytes(){return this.surfaces?3*384*384*4:0;}
  private blend(ctx:CanvasRenderingContext2D,a:Segment[],b:Segment[],sample:ActorTweenSample,warp:boolean):number {
    const from=warp?anchor(sample.from.frame)!:undefined,to=warp?anchor(sample.to.frame)!:undefined;
    if(sample.blend===0)return paint(ctx,a,from,warp?sample.anchor:undefined);
    if(sample.blend===1)return paint(ctx,b,to,warp?sample.anchor:undefined);
    this.surfaces??=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=384;c.getContext('2d')!.imageSmoothingEnabled=false;return c;});
    let count=0;
    for(const[canvas,items,source]of [[this.surfaces[0]!,a,from],[this.surfaces[1]!,b,to]] as const){const c=canvas.getContext('2d')!;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,384,384);c.save();c.translate(192,300);count+=paint(c,items,source,warp?sample.anchor:undefined);c.restore();}
    const mix=this.surfaces[2]!,c=mix.getContext('2d')!;c.clearRect(0,0,384,384);c.globalCompositeOperation='source-over';c.globalAlpha=1-sample.blend;c.drawImage(this.surfaces[0]!,0,0);c.globalCompositeOperation='lighter';c.globalAlpha=sample.blend;c.drawImage(this.surfaces[1]!,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
    ctx.drawImage(mix,-192,-300);return count+3;
  }
  draw(ctx:CanvasRenderingContext2D,parts:ActorParts,state:string,elapsed:number,x:number,y:number,facing='right',scale=2.5,enabled=true):number {
    const sample=enabled?actorTweenSample(parts,state,elapsed):null;
    if(!sample)return drawActor(ctx,parts,state,elapsed,x,y,facing,scale);
    ctx.save();ctx.translate(x,y);ctx.scale(facing==='left'?-scale:scale,scale);let count=0;
    for(const group of['lower','head','weapon'] as const){
      const a=segments(parts,sample.from,state,group),b=segments(parts,sample.to,state,group);
      if(matching(a,b)){for(let i=0;i<a.length;i++)count+=drawParts(ctx,a[i]!.asset,intermediate(a[i]!,b[i]!,sample.amount));}
      // A face is never double exposed, even for an unusual headgear frame change.
      else if(group==='head'){
        for(const asset of new Set([...a,...b].map(s=>s.asset))){
          const first=a.find(s=>s.asset===asset),next=b.find(s=>s.asset===asset);
          if(first&&next)count+=drawParts(ctx,asset,intermediate(first,next,sample.amount,sample.amount>=.5));
          else {const single=first??next!;count+=drawParts(ctx,asset,single.frame,single.offset);}
        }
      }
      else count+=this.blend(ctx,a,b,sample,group==='lower');
    }
    ctx.restore();return count;
  }
}

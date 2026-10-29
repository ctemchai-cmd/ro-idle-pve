import { actorFrame, attachmentFrame, drawActor, drawParts, type ActorParts, type NativeAsset, type NativeFrame } from './native.mjs';
import { PoseCache, type PoseImage } from './pose-cache.ts';

type Point = readonly [number,number];
type Segment = { asset:NativeAsset; frame:NativeFrame; offset:number[] };
type Matrix = readonly [number,number,number,number];
type PartBounds = (asset:NativeAsset,frame:NativeFrame,offset:readonly number[],matrix?:Matrix)=>void;
const rigFields=['body','head','weapon','headgear','garment','shield','attackIndex','attackVariants','releaseFrame'] as const;
export const POSE_SAMPLE_MS=1000/60;
export interface ActorTweenSample {
  from:ReturnType<typeof actorFrame>; to:ReturnType<typeof actorFrame>;
  amount:number; blend:number; anchor:Point; rotate:boolean;
}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const angle=(a:number,b:number,t:number)=>a+(((b-a+180)%360+360)%360-180)*t;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>n*n*(3-2*n);
const anchor=(f:NativeFrame|null):Point|null=>f?.anchor?.length===2&&f.anchor.every(Number.isFinite)&&f.anchor[1]! < -1 ? [f.anchor[0]!,f.anchor[1]!] : null;

/** Keeps root at0 and neck attached. Large bends rotate rather than stretch a torso. */
export function rootNeckTransform(source:Point,target:Point,rotate=true):readonly [number,number,number,number] {
  const shear=(target[0]-source[0])/source[1],vertical=target[1]/source[1];
  if(!rotate)return[1,0,shear,vertical];
  const square=source[0]**2+source[1]**2;
  const a=(source[0]*target[0]+source[1]*target[1])/square,b=(source[0]*target[1]-source[1]*target[0])/square;
  return[a,b,-b,a];
}

/** Geometry is generated between native keys, never by changing their ACT clock. */
export function actorTweenSample(parts:ActorParts,state:string,elapsed:number):ActorTweenSample|null {
  if(!parts.head||!state.startsWith('attack')||!Number.isFinite(elapsed)||elapsed<0)return null;
  const from=actorFrame(parts,state,elapsed),delay=from.action?.frame_duration_ms??0;
  if(!from.frame||!from.action||delay<=0||elapsed>=from.action.frames.length*delay)return null;
  const amount=elapsed/delay-Math.floor(elapsed/delay);if(amount<1e-8)return null;
  const to=from.index===from.action.frames.length-1?actorFrame(parts,'idle',0):actorFrame(parts,state,(from.index+1)*delay),a=anchor(from.frame),b=anchor(to.frame);if(!a||!b)return null;
  const target:Point=[lerp(a[0],b[0],amount),lerp(a[1],b[1],amount)];
  for(const source of[a,b]){const ratio=Math.hypot(...target)/Math.hypot(...source);if(ratio<.5||ratio>2)return null;}
  // Choose for the whole source pair, so no transform mode switches mid-interval.
  const rotate=[[a,b],[b,a]].some(([s,t])=>Math.abs((t![0]-s![0])/s![1])>.5||t![1]/s![1]<.65||t![1]/s![1]>1.5);
  return{from,to,amount,blend:smooth(clamp((amount-.38)/.24)),anchor:target,rotate};
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
function paint(ctx:CanvasRenderingContext2D,items:Segment[],source?:Point,target?:Point,rotate=false,bounds?:PartBounds):number {
  ctx.save();let matrix:Matrix|undefined;
  if(source&&target){matrix=rootNeckTransform(source,target,rotate);ctx.transform(...matrix,0,0);}
  let count=0;for(const s of items){bounds?.(s.asset,s.frame,s.offset,matrix);count+=drawParts(ctx,s.asset,s.frame,s.offset);}ctx.restore();return count;
}

/** Reusable scratch belongs to the renderer, not to every frame or actor. */
export class NativeActorTween {
  private surfaces:HTMLCanvasElement[]|null=null;
  private rigSurface:HTMLCanvasElement|null=null;
  private readonly poses:PoseCache;
  private identities=new WeakMap<ActorParts,{parts:ActorParts;key:string}>();
  private assets=new WeakMap<NativeAsset,number>();
  private nextAsset=1;
  private compositions=0;
  private bounds=[Infinity,Infinity,-Infinity,-Infinity];
  constructor(options:{maxBytes?:number;maxFrames?:number}={}){this.poses=new PoseCache(options.maxBytes,options.maxFrames);}
  get scratchBytes(){return((this.surfaces?3:0)+(this.rigSurface?1:0))*384*384*4;}
  cacheStats(){return{...this.poses.stats(),compositions:this.compositions,scratch_bytes:this.scratchBytes};}
  dispose(){
    this.poses.clear();for(const c of[...(this.surfaces??[]),...(this.rigSurface?[this.rigSurface]:[])]){c.width=0;c.height=0;}
    this.surfaces=null;this.rigSurface=null;this.identities=new WeakMap();this.assets=new WeakMap();this.nextAsset=1;this.compositions=0;
  }
  private identity(parts:ActorParts):string {
    const known=this.identities.get(parts);
    if(known&&rigFields.every(k=>known.parts[k]===parts[k]))return known.key;
    const key=[parts.body,parts.head,parts.weapon,parts.headgear,parts.garment,parts.shield].map(asset=>{
      if(!asset)return 0;let id=this.assets.get(asset);if(!id){id=this.nextAsset++;this.assets.set(asset,id);}return id;
    }).join('.')+':'+parts.attackIndex+':'+(parts.attackVariants??[]).join(',')+':'+parts.releaseFrame;
    this.identities.set(parts,{parts:{...parts},key});return key;
  }
  private trackBounds:PartBounds=(asset,frame,offset,matrix=[1,0,0,1])=>{
    for(const layer of frame.layers){
      const rect=asset.meta.sprite_sheet?.frames[layer[2]!]!;if(!rect||(layer[7]??255)<=0)continue;
      const angle=(layer[10]??0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),sx=(layer[3]?-1:1)*(layer[8]??1),sy=layer[9]??1;
      for(const x of[-rect[2]!/2,rect[2]!/2])for(const y of[-rect[3]!/2,rect[3]!/2]){
        const px=layer[0]!+offset[0]!+cos*x*sx-sin*y*sy,py=layer[1]!+offset[1]!+sin*x*sx+cos*y*sy;
        const tx=matrix[0]*px+matrix[2]*py,ty=matrix[1]*px+matrix[3]*py;
        this.bounds[0]=Math.min(this.bounds[0]!,tx);this.bounds[1]=Math.min(this.bounds[1]!,ty);this.bounds[2]=Math.max(this.bounds[2]!,tx);this.bounds[3]=Math.max(this.bounds[3]!,ty);
      }
    }
  };
  private part(ctx:CanvasRenderingContext2D,asset:NativeAsset,frame:NativeFrame,offset:number[]=[0,0]):number {this.trackBounds(asset,frame,offset);return drawParts(ctx,asset,frame,offset);}
  private image(ctx:CanvasRenderingContext2D,frame:PoseImage,x:number,y:number,facing:string,scale:number){ctx.save();ctx.translate(x,y);ctx.scale(facing==='left'?-scale:scale,scale);ctx.drawImage(frame.image,frame.x,frame.y);ctx.restore();}
  private blend(ctx:CanvasRenderingContext2D,a:Segment[],b:Segment[],sample:ActorTweenSample,warp:boolean):number {
    const from=warp?anchor(sample.from.frame)!:undefined,to=warp?anchor(sample.to.frame)!:undefined;
    if(sample.blend===0)return paint(ctx,a,from,warp?sample.anchor:undefined,sample.rotate,this.trackBounds);
    if(sample.blend===1)return paint(ctx,b,to,warp?sample.anchor:undefined,sample.rotate,this.trackBounds);
    this.surfaces??=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=384;c.getContext('2d')!.imageSmoothingEnabled=false;return c;});
    let count=0;
    for(const[canvas,items,source]of [[this.surfaces[0]!,a,from],[this.surfaces[1]!,b,to]] as const){const c=canvas.getContext('2d')!;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,384,384);c.save();c.translate(192,300);count+=paint(c,items,source,warp?sample.anchor:undefined,sample.rotate,this.trackBounds);c.restore();}
    const mix=this.surfaces[2]!,c=mix.getContext('2d')!;c.clearRect(0,0,384,384);c.globalCompositeOperation='source-over';c.globalAlpha=1-sample.blend;c.drawImage(this.surfaces[0]!,0,0);c.globalCompositeOperation='lighter';c.globalAlpha=sample.blend;c.drawImage(this.surfaces[1]!,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
    ctx.drawImage(mix,-192,-300);return count+3;
  }
  draw(ctx:CanvasRenderingContext2D,parts:ActorParts,state:string,elapsed:number,x:number,y:number,facing='right',scale=2.5,enabled=true):number {
    const actual=enabled?actorTweenSample(parts,state,elapsed):null;
    if(!actual)return drawActor(ctx,parts,state,elapsed,x,y,facing,scale);
    const delay=actual.from.action!.frame_duration_ms,steps=Math.ceil(delay/POSE_SAMPLE_MS),phase=Math.min(steps-1,Math.floor(actual.amount*steps+1e-8));
    // Never advance a release pose early; exact ACT key times retain their native path.
    if(!phase)return drawActor(ctx,parts,state,elapsed,x,y,facing,scale);
    const at=(actual.from.index+phase/steps)*delay,sample=actorTweenSample(parts,state,at)!;
    const key=this.identity(parts)+':'+state+':'+actual.from.index+':'+phase;
    const cached=this.poses.get(key);if(cached){this.image(ctx,cached,x,y,facing,scale);return 1;}
    this.compositions++;this.bounds=[Infinity,Infinity,-Infinity,-Infinity];
    // Rasterize the complete intermediate rig once before flipping/scaling it.
    // This gives head, limbs and overlays the same pixel grid in both facings.
    this.rigSurface??=(()=>{const c=document.createElement('canvas');c.width=c.height=384;c.getContext('2d')!.imageSmoothingEnabled=false;return c;})();
    const rig=this.rigSurface.getContext('2d')!;rig.setTransform(1,0,0,1,0,0);rig.clearRect(0,0,384,384);rig.save();rig.translate(192,300);let count=0;
    for(const group of['lower','head','weapon'] as const){
      const a=segments(parts,sample.from,state,group),b=segments(parts,sample.to,state,group);
      if(matching(a,b)){for(let i=0;i<a.length;i++)count+=this.part(rig,a[i]!.asset,intermediate(a[i]!,b[i]!,sample.amount));}
      // A face is never double exposed, even for an unusual headgear frame change.
      else if(group==='head'){
        for(const asset of new Set([...a,...b].map(s=>s.asset))){
          const first=a.find(s=>s.asset===asset),next=b.find(s=>s.asset===asset);
          if(first&&next)count+=this.part(rig,asset,intermediate(first,next,sample.amount,sample.amount>=.5));
          else {const single=first??next!;count+=this.part(rig,asset,single.frame,single.offset);}
        }
      }
      else count+=this.blend(rig,a,b,sample,group==='lower');
    }
    rig.restore();
    const left=Math.max(-192,Math.floor(this.bounds[0]!)-2),top=Math.max(-300,Math.floor(this.bounds[1]!)-2),right=Math.min(192,Math.ceil(this.bounds[2]!)+2),bottom=Math.min(84,Math.ceil(this.bounds[3]!)+2),width=right-left,height=bottom-top;
    if(width<=0||height<=0)return count;
    const bytes=width*height*4;
    if(bytes<=this.poses.maxBytes&&this.poses.maxFrames>0){
      const image=document.createElement('canvas');image.width=width;image.height=height;image.getContext('2d')!.drawImage(this.rigSurface,left+192,top+300,width,height,0,0,width,height);
      const frame={image,x:left,y:top,bytes};this.poses.put(key,frame);this.image(ctx,frame,x,y,facing,scale);
    }else{ctx.save();ctx.translate(x,y);ctx.scale(facing==='left'?-scale:scale,scale);ctx.drawImage(this.rigSurface,left+192,top+300,width,height,left,top,width,height);ctx.restore();}
    return count+2;
  }
}

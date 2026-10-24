import type { ActorRenderView } from '../contracts/presentation.ts';
export interface StatusLink {source:string;target:string;color:string;from:readonly[number,number];to:readonly[number,number]}
/** Reads resolved status targets, never chooses a recipient or calculates power. */
export function statusLinks(actors:readonly ActorRenderView[],point:(actor:ActorRenderView)=>readonly[number,number],now:number):StatusLink[]{
 const seen=new Set<string>(),links:StatusLink[]=[];
 for(const target of actors){if(target.hp<=0)continue;
  for(const instance of target.statuses?.flatMap(g=>g.instances)??[]){
   if(!instance.link_color||instance.expires_at<=now||instance.applied_at!==null&&instance.applied_at>now)continue;
   const source=actors.find(a=>a.actor_id===instance.source_actor_id&&a.hp>0);if(!source||source===target)continue;
   const key=source.actor_id+':'+target.actor_id+':'+instance.link_color;if(seen.has(key))continue;seen.add(key);
   const a=point(source),b=point(target);links.push({source:source.actor_id,target:target.actor_id,color:instance.link_color,from:[a[0],a[1]-48],to:[b[0],b[1]-48]});
  }
 }
 return links;
}
export function drawStatusLinks(ctx:CanvasRenderingContext2D,links:readonly StatusLink[],gameMs:number,motion:boolean):void{
 ctx.save();ctx.lineWidth=2;ctx.globalAlpha=.7;
 for(const link of links){const[a,b]=[link.from,link.to],wave=motion?Math.sin(gameMs/420)*7:0;ctx.strokeStyle=link.color;ctx.shadowColor=link.color;ctx.shadowBlur=6;
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2+wave,b[0],b[1]);ctx.stroke();
  ctx.fillStyle=link.color;for(const p of[a,b]){ctx.beginPath();ctx.arc(p[0],p[1],3,0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
}
export function drawStatusFields(ctx:CanvasRenderingContext2D,actors:readonly ActorRenderView[],point:(actor:ActorRenderView)=>readonly[number,number],gameMs:number,motion:boolean):string[]{
 const drawn:string[]=[];ctx.save();
 for(const actor of actors){if(actor.hp<=0)continue;const colors=new Set((actor.statuses??[]).flatMap(g=>g.instances).filter(s=>s.field_color&&s.expires_at>gameMs&&(s.applied_at===null||s.applied_at<=gameMs)).map(s=>s.field_color!));
  if(!colors.size)continue;const[x,y]=point(actor);drawn.push(actor.actor_id);
  for(const color of colors){ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.shadowBlur=7;ctx.shadowColor=color;
   for(let i=0;i<3;i++){const phase=motion?(gameMs/1300+i/3)%1:i/3;ctx.globalAlpha=(1-phase)*.5;ctx.beginPath();ctx.ellipse(x,y,28+phase*28,10+phase*9,0,0,2*Math.PI);ctx.stroke();}
  }
 }
 ctx.restore();return drawn;
}

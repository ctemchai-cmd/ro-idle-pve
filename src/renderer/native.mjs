// Small Canvas player for the cached ACT/STR preparation metadata.
export const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
export const modulo = (v, length) => ((v % length) + length) % length;

export function actionFor(meta, state = 'idle') {
  return meta.animation?.actions.find(a => a.state === state)
    ?? meta.animation?.actions.find(a => a.state === 'idle')
    ?? meta.animation?.actions[0];
}

export function frameAt(action, elapsed, loop = true) {
  if (!action?.frames.length) return {index:0, frame:null};
  const count=action.frames.length, delay=Math.max(1,number(action.frame_duration_ms,100));
  const raw=Math.floor(Math.max(0,elapsed)/delay);
  const index=loop ? raw%count : Math.min(raw,count-1);
  return {index,frame:action.frames[index]};
}

// 'attack' is the preset swing; 'attack2', 'attack3'… pick the preset's further variants.
export function attackSourceIndex(parts, state) {
  const variant = /^attack(\d*)$/.exec(state);
  if (!variant) return null;
  return variant[1] ? parts.attackVariants?.[Number(variant[1]) - 1] ?? parts.attackIndex : parts.attackIndex;
}

export function actorAction(parts, state) {
  const index = attackSourceIndex(parts, state);
  return (index != null
    ? parts.body.meta.animation.actions.find(action => action.source_action_index === index)
    : null) ?? actionFor(parts.body.meta, state.startsWith('attack') ? 'attack' : state);
}

export function actorDuration(parts, state) {
  const action = actorAction(parts, state);
  return action ? action.frames.length * Math.max(1, number(action.frame_duration_ms, 100)) : 0;
}

export function actorFrame(parts, state, elapsed) {
  const action = actorAction(parts, state);
  // Player idle/sit frames are alternate head poses, not a breathing cycle.
  // Select body AND attachments from that pose; monsters still animate idle.
  const fixedPose = parts.head && (state === 'idle' || state === 'sit');
  const loop = state === 'idle' || state === 'walk' || state === 'standby';
  return { action, ...frameAt(action, fixedPose ? 0 : elapsed, loop) };
}

export function attachmentFrame(asset, bodyAction, bodyFrame, index, state) {
  if (!asset) return null;
  const action = asset.meta.animation?.actions.find(value => value.source_action_index === bodyAction.source_action_index) ?? actionFor(asset.meta, state);
  if (!action?.frames.length) return null;
  // Attachments share the body's frame clock. A short overlay holds its last
  // pose; modulo would jump back to a different pose in the middle of a swing.
  const frame = action.frames[Math.min(index, action.frames.length - 1)];
  const base = bodyFrame.anchor ?? [0, 0], own = frame.anchor ?? base;
  return { frame, offset: [base[0] - own[0], base[1] - own[1]] };
}

const textures=new WeakMap();
const tints=new WeakMap();
function tint(image,color){
  const rgb=color.map(v=>Math.max(0,Math.min(255,Math.round(number(v,255)))));
  if(rgb.every(v=>v===255))return image;
  let cache=tints.get(image);if(!cache){cache=new Map();tints.set(image,cache)}
  const key=rgb.join(',');if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');
  x.drawImage(image,0,0);x.globalCompositeOperation='multiply';x.fillStyle=`rgb(${rgb})`;x.fillRect(0,0,c.width,c.height);
  x.globalCompositeOperation='destination-in';x.drawImage(image,0,0);cache.set(key,c);if(cache.size>64)cache.delete(cache.keys().next().value);return c;
}
function part(image, rect) {
  let cache=textures.get(image); if(!cache){cache=new Map();textures.set(image,cache)}
  const key=rect.join(','); if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];
  c.getContext('2d').drawImage(image,...rect,0,0,c.width,c.height);cache.set(key,c);return c;
}

export function drawParts(ctx, asset, frame, offset=[0,0]) {
  if(!asset || !frame)return 0;
  let drawn=0;
  for(const layer of frame.layers){
    const rect=asset.meta.sprite_sheet.frames[layer[2]];if(!rect)throw Error('Unknown ACT frame');
    const image=layer.length>4?tint(part(asset.image,rect),layer.slice(4,7)):part(asset.image,rect);
    ctx.save();ctx.translate(layer[0]+offset[0],layer[1]+offset[1]);
    ctx.rotate(number(layer[10])*Math.PI/180);
    ctx.scale((layer[3]?-1:1)*(layer.length>4?number(layer[8],1):1),layer.length>4?number(layer[9],1):1);
    ctx.globalAlpha=layer.length>4?number(layer[7],255)/255:1;
    ctx.drawImage(image,-rect[2]/2,-rect[3]/2);ctx.restore();drawn++;
  }
  return drawn;
}

export function drawActor(ctx, parts, state, elapsed, x, y, facing='right', scale=2.5) {
  const current=actorFrame(parts,state,elapsed),bodyAction=current.action;
  if(!current.frame)return 0;
  ctx.save();ctx.translate(x,y);ctx.scale(facing==='left'?-scale:scale,scale);
  let count=0;
  const draw=(asset,anchor=false)=>{
    if(!asset)return;
    const selected=attachmentFrame(asset,bodyAction,current.frame,current.index,state);if(!selected)return;
    count+=drawParts(ctx,asset,selected.frame,anchor?selected.offset:[0,0]);
  };
  draw(parts.garment);draw(parts.shield);count+=drawParts(ctx,parts.body,current.frame);
  draw(parts.head,true);draw(parts.headgear,true);draw(parts.weapon);
  ctx.restore();return count;
}

export function resolveLayer(layer, time) {
  let bi=-1,mi=-1;
  layer.keys.forEach((k,i)=>{if(k[0]<=time){if(k[1]===0)bi=i;else if(k[1]===1)mi=i}});
  if(bi<0 || !layer.tex.length)return null;
  const b=layer.keys[bi],m=mi>bi?layer.keys[mi]:null,delta=m?time-b[0]:0;
  const value=i=>number(b[i])+number(m?.[i])*delta;
  let tex=number(b[12]);
  if(m){
    const mode=m[13],delay=Number(m[14]);
    if(mode===1)tex+=Number(m[12])*delta;
    else if(mode===2)tex=Math.min(tex+delay*delta,layer.tex.length-1);
    else if(mode===3)tex=modulo(tex+delay*delta,layer.tex.length);
    else if(mode===4)tex=modulo(tex-delay*delta,layer.tex.length);
  }
  tex=Math.max(0,Math.min(layer.tex.length-1,Math.trunc(number(tex))));
  const angle=value(15)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const points=Array.from({length:4},(_,i)=>{const x=value(4+i),y=value(8+i);return [x*c-y*s+value(2)-320,x*s+y*c+value(3)-320]});
  return {texture:layer.tex[tex],points,color:[16,17,18,19].map(i=>Math.max(0,Math.min(255,value(i)))),blend:b[20]};
}

function triangle(ctx,image,from,to){
  const [p0,p1,p2]=from,[q0,q1,q2]=to;
  const det=(p1[0]-p0[0])*(p2[1]-p0[1])-(p2[0]-p0[0])*(p1[1]-p0[1]);if(!det)return;
  const a=((q1[0]-q0[0])*(p2[1]-p0[1])-(q2[0]-q0[0])*(p1[1]-p0[1]))/det;
  const c=((q2[0]-q0[0])*(p1[0]-p0[0])-(q1[0]-q0[0])*(p2[0]-p0[0]))/det;
  const b=((q1[1]-q0[1])*(p2[1]-p0[1])-(q2[1]-q0[1])*(p1[1]-p0[1]))/det;
  const d=((q2[1]-q0[1])*(p1[0]-p0[0])-(q1[1]-q0[1])*(p2[1]-p0[1]))/det;
  if(![a,b,c,d].every(Number.isFinite))return;
  ctx.save();ctx.beginPath();ctx.moveTo(...q0);ctx.lineTo(...q1);ctx.lineTo(...q2);ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,d,q0[0]-a*p0[0]-c*p0[1],q0[1]-b*p0[0]-d*p0[1]);ctx.drawImage(image,0,0);ctx.restore();
}

export function drawEffect(ctx,asset,elapsed,x,y,scale=1){
  const e=asset.meta.effect,t=modulo(elapsed*e.fps/1000,Math.max(1,e.max_key));let count=0;
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  for(const layer of e.layers){
    const f=resolveLayer(layer,t);if(!f || f.color[3]===0)continue;
    const rect=e.textures[f.texture];if(!rect)throw Error('Unknown STR texture');
    const image=tint(part(asset.image,rect),f.color.slice(0,3)),uv=[[0,0],[rect[2],0],[rect[2],rect[3]],[0,rect[3]]];
    ctx.globalCompositeOperation=f.blend===0?'source-over':'lighter';ctx.globalAlpha=f.color[3]/255;
    triangle(ctx,image,[uv[0],uv[1],uv[2]],[f.points[0],f.points[1],f.points[2]]);
    triangle(ctx,image,[uv[0],uv[2],uv[3]],[f.points[0],f.points[2],f.points[3]]);count++;
  }
  ctx.restore();return count;
}

// Authored prototype visuals, separate from RO's original gameplay/effect logic.
export function drawProcedural(ctx,recipe,elapsed,x,y){
  const t=modulo(elapsed,recipe.duration_ms)/recipe.duration_ms,alpha=Math.sin(t*Math.PI);
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=recipe.color;ctx.fillStyle=recipe.color;
  ctx.shadowColor=recipe.color;ctx.shadowBlur=18;ctx.lineWidth=4;
  if(recipe.family==='bolt'){
    const yy=y-230+230*t;ctx.beginPath();ctx.moveTo(x-35,yy-90);ctx.lineTo(x+8,yy-45);ctx.lineTo(x-8,yy-35);ctx.lineTo(x,yy);ctx.stroke();
  }else if(recipe.family==='heal'){
    ctx.strokeStyle='#a5ffad';ctx.fillStyle='#baffbd';ctx.shadowColor='#70f5a2';ctx.lineWidth=3;
    for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(x,y-4-i*6,48+t*12-i*12,13+t*3-i*3,0,0,Math.PI*2);ctx.stroke()}
    for(let i=0;i<6;i++){const p=modulo(t+i/6,1),a=i*2.4+t*2,px=x+Math.cos(a)*(36-12*p),py=y-12-p*145;ctx.globalAlpha=alpha*Math.sin(p*Math.PI);ctx.fillRect(px-2,py-8,4,16);ctx.fillRect(px-7,py-2,14,4)}
  }else if(recipe.family==='buff'){
    for(let i=0;i<7;i++){const px=x+Math.sin(i*1.7)*55,py=y-modulo(t+i/7,1)*160;ctx.fillRect(px-2,py-10,4,20);ctx.fillRect(px-9,py-3,18,5)}
    ctx.beginPath();ctx.ellipse(x,y,70,16,0,0,Math.PI*2);ctx.stroke();
  }else if(recipe.family==='arrow'){
    const xx=x-260+260*t;ctx.beginPath();ctx.moveTo(xx-65,y-65);ctx.lineTo(xx,y-65);ctx.lineTo(xx-12,y-73);ctx.moveTo(xx,y-65);ctx.lineTo(xx-12,y-57);ctx.stroke();
  }else{
    for(let i=0;i<8;i++){const a=i*Math.PI/4,r=15+t*90;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.3,y-65+Math.sin(a)*r*.3);ctx.lineTo(x+Math.cos(a)*r,y-65+Math.sin(a)*r);ctx.stroke()}
  }
  ctx.restore();return 1;
}

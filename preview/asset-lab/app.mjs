import {drawActor,drawEffect,drawProcedural} from './renderer.mjs';
const root=new URL('../../assets/ro/',location.href),$=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const cache=new Map(),stats={errors:[],frames:0,layers:0};
const config={actor:'1-male',pose:'idle',facing:'right',hat:'',garment:'',shield:'',background:'prt_fild08',skill:89,weapon:true};
let data,parts={},background,enemy,effect,clock=0,castStart=-Infinity,paused=false,token=0;
const music=new Audio();music.loop=true;music.volume=.18;
async function json(url){const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);return response.json()}
async function asset(ref){
  if(!ref)return null;const path=ref.meta;
  if(!cache.has(path))cache.set(path,(async()=>{
    const meta=await json(new URL(path,root));
    const collection=path.split('/')[0],url=new URL(collection+'/'+meta.file.path,root);
    let image=null;if(['PNG','WEBP','APNG','ANIMATED_WEBP'].includes(meta.file.format)){image=new Image();image.src=url.href;await image.decode()}
    return {meta,image,url:url.href};
  })());
  return cache.get(path);
}
function options(id,rows,label,selected){
  $(id).replaceChildren(...rows.map(row=>{const o=document.createElement('option');o.value=row.id;o.textContent=label(row);o.selected=row.id===selected;return o}));
}
const hatNames={1:'Goggles',2:'Cat Ears',3:'Glasses',4:'Flower',5:'Flower Band',6:'Bandana',7:'Turban',8:'Mask',9:'Hair Band',11:'Biretta',12:'Sunglasses',13:'Eye Patch',15:'Bunny Band',16:'Hat',17:'Ribbon',18:'Circlet',19:'Tiara',20:'Santa Hat',28:'Big Ribbon',40:'Helm',44:'Wedding Veil',45:'Crown'};
function wardrobeOptions(){
  const actor=data.actors.find(a=>a.id===config.actor);
  const hats=data.classic_hats.filter(h=>h.gender===actor.gender);
  const garments=data.wardrobe.filter(g=>g.category==='garments'&&g.gender===actor.gender&&g.class_sprite===actor.class_sprite);
  const shields=data.wardrobe.filter(g=>g.category==='shields'&&g.gender===actor.gender&&g.class_sprite===actor.class_sprite);
  for(const [id,rows]of [['hat',hats],['garment',garments],['shield',shields]]){
    if(!rows.some(r=>r.id===config[id]))config[id]='';
    options(id,[{id:'',name:'ไม่สวม'},...rows],r=>r.id?(id==='hat'?hatNames[r.view_ids.find(v=>hatNames[v])]??r.resource:id==='garment'?r.garment_folder:r.resource):r.name,config[id]);
  }
}
async function apply(update={}){
  Object.assign(config,update);const revision=++token;
  for(const id of ['actor','pose','facing','background','skill'])$(id).value=String(config[id]);
  $('weapon').checked=config.weapon;wardrobeOptions();
  const actor=data.actors.find(a=>a.id===config.actor);
  const find=id=>data.wardrobe.find(w=>w.id===id);
  const scene=data.backgrounds.find(b=>b.map===config.background);
  const recipe=data.skill_recipes.find(s=>s.skill_id===Number(config.skill));
  const loaded=await Promise.all([asset(actor.body),asset(actor.head),asset(config.weapon?actor.weapon:null),asset(find(config.hat)),asset(find(config.garment)),asset(find(config.shield)),asset(scene),asset(data.monsters[0]),asset(recipe.native_effect)]);
  if(revision!==token)return;
  [parts.body,parts.head,parts.weapon,parts.headgear,parts.garment,parts.shield,background,enemy,effect]=loaded;
  parts.attackIndex=actor.attack_source_action_index;
  $('actor-name').textContent=actor.name;$('map-name').textContent=scene.name;$('message').textContent='ภาพและ metadata พร้อมใช้งาน';$('state').textContent='Local assets พร้อมแล้ว';
  if(!music.paused){const song=data.music.find(m=>m.map===config.background);const track=await asset(song);music.src=track.url;await music.play()}
  draw(clock);
  return {actor:actor.id,parts:Object.keys(parts).filter(k=>parts[k]),background:scene.name};
}
function draw(elapsed){
  if(!background || !parts.body)return;
  clock=elapsed;ctx.clearRect(0,0,1280,720);ctx.imageSmoothingEnabled=false;ctx.drawImage(background.image,0,0,1280,720);
  const scene=data.backgrounds.find(b=>b.map===config.background),stage=scene.stage;
  const x=stage.left_x,y=stage.floor_y,ex=stage.right_x;
  ctx.fillStyle='#14231c44';for(const xx of [x,ex]){ctx.beginPath();ctx.ellipse(xx,y+3,45,12,0,0,Math.PI*2);ctx.fill()}
  let layers=drawActor(ctx,parts,config.pose,elapsed,x,y,config.facing,3);
  if(enemy)layers+=drawActor(ctx,{body:enemy},'idle',elapsed,ex,y,'left',3);
  const recipe=data.skill_recipes.find(s=>s.skill_id===Number(config.skill));
  const age=elapsed-castStart;
  if(age>=0&&age<recipe.duration_ms){
    if(effect)layers+=drawEffect(ctx,effect,age,ex,y-30,.68);
    else layers+=drawProcedural(ctx,recipe,age,ex,y);
  }
  stats.frames++;stats.layers=layers;
}
async function cast(){
  castStart=clock;const recipe=data.skill_recipes.find(s=>s.skill_id===Number(config.skill));
  if(recipe.sounds[0]){const sound=await asset({meta:recipe.sounds[0]});const audio=new Audio(sound.url);audio.volume=.35;await audio.play().catch(()=>{})}
}
async function icons(){
  const recipes=data.skill_recipes;
  for(const id of ['skill-slots','equipment-slots']){
    const selected=id==='skill-slots'?recipes.slice(0,16):recipes.slice(16,24);
    for(const recipe of selected){const slot=document.createElement('button');slot.className='slot';slot.title=recipe.name;slot.type='button';
      const icon=await asset(recipe.icon);if(icon?.image){const im=new Image();im.src=icon.url;im.alt=recipe.name;slot.append(im)}
      slot.onclick=async()=>{config.skill=recipe.skill_id;$('skill').value=String(recipe.skill_id);await apply();await cast()};$(id).append(slot);
    }
  }
}
async function start(){
  data=await json(new URL('prepared/game-pack.json',root));
  options('actor',data.actors,a=>a.name,config.actor);
  options('background',data.backgrounds.map(b=>({...b,id:b.map})),b=>b.name,config.background);
  options('skill',data.skill_recipes.map(s=>({...s,id:String(s.skill_id)})),s=>s.name,String(config.skill));
  for(const id of ['actor','hat','garment','shield','background','skill'])$(id).onchange=()=>apply({[id]:id==='skill'?Number($(id).value):$(id).value}).catch(fail);
  for(const id of ['pose','facing'])$(id).onchange=()=>{config[id]=$(id).value;draw(clock)};
  $('weapon').onchange=()=>apply({weapon:$('weapon').checked}).catch(fail);
  $('cast').onclick=()=>cast().catch(fail);
  document.addEventListener('click',async event=>{if(event.target.closest('button:not(:disabled)')){const clip=await asset(data.audio_events.ui_confirm);const sound=new Audio(clip.url);sound.volume=.18;sound.play().catch(()=>{})}});
  $('music').onclick=async()=>{if(!music.paused){music.pause();$('music').textContent='เปิดเพลง';return}const track=await asset(data.music.find(m=>m.map===config.background));music.src=track.url;await music.play();$('music').textContent='ปิดเพลง'};
  await apply();await icons();await document.fonts.ready;
  window.assetLab={ready:true,data,config,stats,apply,asset,draw,cast,pause:value=>{paused=value},setCastStart:value=>{castStart=value},canvas};
  const start=performance.now();function tick(now){if(!paused)draw(now-start);requestAnimationFrame(tick)}requestAnimationFrame(tick);
}
function fail(error){stats.errors.push(error.message);$('state').textContent='ตรวจพบข้อผิดพลาด';$('message').textContent=error.message;$('message').classList.add('error');console.error(error)}
start().catch(fail);

"""D139 authored enemy programs/rotations. No runner or global balance changes."""
import json
from copy import deepcopy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'plan/data'

PROFILES={
 'poring':['enemy_bite','enemy_guard'],
 'fabre':['enemy_venom','enemy_armor_break'],
 'lunatic':['enemy_bite','enemy_enrage'],
 'wolf':['enemy_sonic_blow','enemy_enrage','enemy_bite'],
 'ork_warrior':['enemy_hammer_fall','enemy_armor_break','enemy_bite'],
 'golem':['enemy_guard','enemy_hammer_fall','enemy_quake'],
 'eddga':['enemy_enrage','enemy_firestorm','enemy_armor_break','enemy_bite'],
 'drake':['enemy_cold_bolt','enemy_armor_break','enemy_sonic_blow','enemy_guard'],
 'phreeoni':['enemy_quake','enemy_armor_break','enemy_hammer_fall','enemy_enrage'],
 'osiris':['enemy_venom','enemy_silence','enemy_mend','enemy_lightning_bolt'],
 'baphomet':['enemy_firestorm','enemy_lightning_bolt','enemy_enrage','enemy_sonic_blow'],
}
EXPANSION=json.loads((Path(__file__).with_name('story-expansion.json')).read_text())
PROFILES.update({actor['id']:actor['active_slots'] for actor in EXPANSION['enemies']})
# Ordinary stages gain identity-based2→4action rotations; chapter1 starts gently.
CYCLES={
 '1':[['enemy_bite'],['enemy_venom','enemy_bite'],['enemy_guard','enemy_bite']],
 '2':[['enemy_sonic_blow','enemy_bite'],['enemy_venom','enemy_armor_break','enemy_bite']],
 '3':[['enemy_enrage','enemy_bite','enemy_firestorm'],['enemy_hammer_fall','enemy_bite','enemy_guard']],
 '4':[['enemy_guard','enemy_armor_break','enemy_quake'],['enemy_silence','enemy_sonic_blow','enemy_venom']],
 '5':[['enemy_cold_bolt','enemy_guard','enemy_sonic_blow'],['enemy_lightning_bolt','enemy_armor_break','enemy_bite']],
 '6':[['enemy_quake','enemy_armor_break','enemy_hammer_fall','enemy_bite'],['enemy_enrage','enemy_sonic_blow','enemy_venom']],
 '7':[['enemy_venom','enemy_silence','enemy_mend','enemy_lightning_bolt'],['enemy_cold_bolt','enemy_armor_break','enemy_quake']],
 '8':[['enemy_firestorm','enemy_lightning_bolt','enemy_enrage','enemy_sonic_blow'],['enemy_guard','enemy_venom','enemy_silence','enemy_quake']],
}

def resolve(value,params):
 if isinstance(value,dict):
  if set(value)=={'level_param'}:return params[value['level_param']][0]
  return{k:resolve(v,params)for k,v in value.items()}
 if isinstance(value,list):return[resolve(v,params)for v in value]
 return value

def documents():
 skills={s['id']:s for p in(DATA/'skills').glob('*.json')for s in json.loads(p.read_text())['skills']}
 enemies=json.loads((DATA/'enemies.json').read_text());presentations=enemies['presentations']
 recipes={s['id']:s for s in enemies['skills']}
 # Ordinary magic uses the ordinary calibrated budget; only tagged heavy casts
 # read the special MATK column. Damage type/element/armor do not change.
 for s in recipes.values():
  if 'heavy_cast' not in s['tags']:
   for e in s.get('effects',[]):
    if e['type']=='damage' and e['formula']['id']=='magical_power':e['formula']['id']='physical_power'
 variants=[('enemy_cold_bolt','mage_cold_bolt',.3),('enemy_lightning_bolt','mage_lightning_bolt',.32),('enemy_sonic_blow','assassin_sonic_blow',.18),('enemy_armor_break','merchant_first_aid',None),('enemy_hammer_fall','blacksmith_hammer_fall',.45),('enemy_mend','acolyte_heal',.6)]
 for sid,source,power in variants:
  source=skills[source];s=resolve(deepcopy(source),source['level_parameters']);s.update(id=sid,class_id='enemy',max_level=1,unlock_level=1,level_parameters={},tags=['enemy','borrowed_program']);s['cost']={'sp':0,'spirit_spheres':0};s['timing']['cast_ms']=1000 if sid=='enemy_mend'else max(700,s['timing']['cast_ms']);s['timing']['after_cast_ms']=900
  # Magic damage/armor stays magical, but power uses ordinary enemy attack.
  # Heavy-cast MATK is separately calibrated and must never leak into these.
  for e in s['effects']:
   if e['type']in ['damage','heal']:
    e['formula']={'id':'physical_power','params':{'attack_ratio':power,'flat_power':0}}
    if e['type']=='damage':e['can_crit']=False;e['element']= 'neutral'if e['element']=='weapon'else e['element']
   if e['type']=='apply_status':
    if e['status_id']=='stun':e['duration_ms']=1000;e['chance']=.5
    if e['status_id']=='armor_break':e['duration_ms']=4500;e['params']['ratio']=.2
  recipes[sid]=s
  presentations[:]=[p for p in presentations if p['skill_id']!=sid]
  # The shared player presentation supplies the real icon/VFX/audio.
  presentations.append({'skill_id':sid,'telegraph_key':source['name_key'],'telegraph_text':{'enemy_cold_bolt':'ลูกน้ำแข็งต่อเนื่อง','enemy_lightning_bolt':'สายฟ้าต่อเนื่อง','enemy_sonic_blow':'โจมตีหลายครั้ง','enemy_armor_break':'ลดเกราะเป้าหมาย','enemy_hammer_fall':'ค้อนกระแทก มีโอกาสสตั้น','enemy_mend':'ฟื้นฟูพลังชีวิต'}[sid],'visual':{'recipe_skill_id':5,'basis':'D139 shared player presentation; ordinary enemy attack budget'},'duration_source':'skill cast_ms scaled by CastSpeed'})
 enemies['skills']=list(recipes.values())
 for source in EXPANSION['enemies']:
  definition={'id':source['id'],'kind':'enemy','presentation':source['presentation'],'stat_source':'encounter.resolved_base','targetable':True,'counts_for_victory':True,'normal_attack':True,'active_slots':source['active_slots']+[None]*(4-len(source['active_slots'])),'passives':[]}
  previous=next((i for i,a in enumerate(enemies['actors']) if a['id']==source['id']),None)
  if previous is None:enemies['actors'].append(definition)
  else:enemies['actors'][previous]=definition
 for a in enemies['actors']:a['active_slots']=PROFILES[a['id']]+[None]*(4-len(PROFILES[a['id']]))
 cards=json.loads((DATA/'cards.json').read_text())
 for source in EXPANSION['enemies']:
  cards['monster_traits'][source['id']]={k:source[k] for k in ('ro_monster_id','race','size')}
 spec_path=ROOT/'plan/generators/stages-spec.json';spec=json.loads(spec_path.read_text());spec['ordinary_skill_cycles']=CYCLES
 tower=json.loads((DATA/'tower.json').read_text());tower['generator']['skill_cycle']=[PROFILES[s]for s in tower['generator']['template_cycle']]
 daily=json.loads((DATA/'daily-bosses.json').read_text())
 for boss in daily['bosses']:boss['active_slots']=PROFILES[boss['enemy_definition_id']]+[None]*(4-len(PROFILES[boss['enemy_definition_id']]))
 return{DATA/'enemies.json':enemies,DATA/'cards.json':cards,spec_path:spec,DATA/'tower.json':tower,DATA/'daily-bosses.json':daily}

if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
 for p,d in documents().items():
  text=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
  if args.check:
   if p.read_text()!=text:raise ValueError('Stale enemy rotation: '+str(p))
  else:p.write_text(text)
 print(json.dumps({'passed':True,'variants':6,'profiles':len(PROFILES),'scope':'authored programs, no balance batch'}))

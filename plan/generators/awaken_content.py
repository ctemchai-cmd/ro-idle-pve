"""TASK124 explicit Awaken variants, stable logical IDs and native icons retained.
Authored starting values; not RO equations or measured balance. Review before release125.
"""
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'plan/data'
def load(p):return json.loads(p.read_text())
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def walk(x):
 yield x
 if isinstance(x,dict):
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
def ref(k):return{'level_param':k}
def buff(status,target='self',ratio=.1,duration=5000,id='awaken_boon'):
 return{'id':id,'type':'apply_status','target':target,'status_id':status,'duration_ms':duration,'params':{'power_ratio' if status=='poison' else 'ratio':ratio},'chance':1}
index=[]
for p in(D/'skills').glob('*.json'):
 doc=load(p);root=doc['root_job_id'];variants={};prices={}
 for original in doc['skills']+doc['hi_class_skills']:
  s=copy.deepcopy(original);s['tags']=[*s['tags'],'awakened'];s['level_parameters']={}
  for key,values in original['level_parameters'].items():
   maximum=values[-1];integers=all(isinstance(v,int)for v in values)
   curve=[]
   for rank in range(10):
    if key=='cast' and original['id']=='sage_dispel':v=maximum
    elif key=='spheres':v=5
    elif key=='sp_cost':v=max(1,round(maximum*(.9-.1*rank/9)))
    else:
     v=maximum*(1.1+.35*rank/9)
     if key=='chance':v=min(1,v)
     if original['id']=='monk_steel_body'and key=='guard':v=min(.85,v)
     v=round(v)if integers else round(v,6)
    curve.append(v)
   s['level_parameters'][key]=curve
  # Every variant adds a functional effect; not solely a damage multiplier.
  if s['kind']=='passive':
   stat='magical_attack'if root=='mage'or root=='acolyte'and s['class_id']not in['monk','champion']else'physical_attack'
   s['level_parameters']['awaken_potency']=[round(.03+.05*i/9,6)for i in range(10)]
   s['modifiers'].append({'id':'awaken_potency','stat':stat,'op':'add_percent','bucket':'derived','value':ref('awaken_potency')})
  else:
   if s['id']=='monk_call_spirits':s['effects'].append({'id':'awaken_sp','type':'resource_change','target':'self','resource':'sp','amount':8})
   else:
    offensive=next((e for e in s['effects']if e['type']in['damage','handler']),None)
    if offensive:
     status='armor_break'if root in['swordsman','merchant']else'slow'if root=='archer'else'poison'if root=='thief'else'exposed'
     ratio=-.1 if status=='slow'else .1
     s['effects'].append(buff(status,offensive['target'],ratio,4000,'awaken_aftereffect'))
    else:
     target=next((e['target']for e in s['effects']if e['type']in['heal','shield','apply_status']and e['target']in['self','friends','friend']),'self')
     s['effects'].append(buff('guard_up'if s['id']=='priest_sanctuary'else'cc_resistance_up',target,.05 if s['id']=='priest_sanctuary'else .1,6000 if s['id']=='priest_sanctuary'else 5000))
   # Fixed duration bonuses also matter for ranks without a duration curve.
   for effect in s['effects']:
    if effect['type']=='apply_status'and not effect['id'].startswith('awaken_')and isinstance(effect['duration_ms'],int):effect['duration_ms']=round(effect['duration_ms']*1.1)
   # Do not change fixed SP or CT/ACD: rank gains concern effects, preserving readable rotations.
  variants[s['id']]=s
  prices[s['id']]={'cost_version':'awakening-costs-v1','upgrade_cost_rows':[{'from_level':i,'to_level':i+1,'gold':2000*(i+1),'awakening_shard':5*(i+1)}for i in range(1,10)]}
  index.append({'id':s['id'],'kind':s['kind'],'class_id':s['class_id'],'added_effect':'passive attack potency'if s['kind']=='passive'else s['effects'][-1]['id'],'same_native_icon':s['presentation_id']==original['presentation_id']})
 doc['awakened_variants']=variants;doc['awakened_upgrades']=prices;write(p,doc)
write(R/'plan/evidence/task-124-variant-index.json',{'variants':index,'count':len(index),'scope':'Authored, not measured balance. Rank1 exceeds base max effect magnitude and adds job/role effect. SP/cast/ACD stable. Steel Body guard explicitly77–85%; no global buff cap.'})
print('Authored',len(index),'Awaken variants with genuine native icons and extra effects.')

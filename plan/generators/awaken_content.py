"""TASK124 explicit Awaken variants, stable logical IDs and native icons retained.
Authored starting values; not RO equations or measured balance. Review before release125.
"""
import copy,json,argparse
from pathlib import Path
from awaken_identity import identity
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
  gains=identity(s,original)
  if s['kind']=='active':
   # Fixed duration bonuses also matter for ranks without a duration curve.
   for effect in s['effects']:
    if effect['type']=='apply_status'and not effect['id'].startswith('awaken_')and isinstance(effect['duration_ms'],int):effect['duration_ms']=round(effect['duration_ms']*1.1)
   # Do not change fixed SP or CT/ACD: rank gains concern effects, preserving readable rotations.
  variants[s['id']]=s
  prices[s['id']]={'cost_version':'awakening-costs-v1','upgrade_cost_rows':[{'from_level':i,'to_level':i+1,'gold':2000*(i+1),'awakening_shard':5*(i+1)}for i in range(1,10)]}
  index.append({'id':s['id'],'kind':s['kind'],'class_id':s['class_id'],'gains':gains,'same_native_icon':s['presentation_id']==original['presentation_id']})
 doc['awakened_variants']=variants;doc['awakened_upgrades']=prices;write(p,doc)
from skill_distinctness import apply as apply_distinctness
apply_distinctness() # D168 roles override generic scaling after every regeneration.
roles=load(R/'plan/generators/skill-distinctness.json')['updates']
for entry in index:
 if entry['id'] in roles:entry['gains']=[{'type':'composed_role','role':roles[entry['id']]['role'],'definition_source':'plan/generators/skill-distinctness.json'}]
args=argparse.ArgumentParser();args.add_argument('--evidence-task',type=int);task=args.parse_args().evidence_task
# Historical review evidence is immutable during later balance regeneration.
if task:
 write(R/f'plan/evidence/task-{task}-variant-index.json',{'variants':index,'count':len(index),'scope':'D160 explicit identities; current authored base power. Extra hits use +20% TOTAL direct-power budget, not an extra multiplier per hit.'})
 if task==130:write(R/'tests/game/fixtures/awaken-identities-130.json',{'variants':index,'count':len(index)})
print('Authored',len(index),'Awaken variants with genuine native icons and extra effects.')

"""D192 explicit per-skill Hi-class progression. Apply after D169; no run-time job multipliers."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[2]
def apply():
 spec=json.loads((R/'plan/generators/hi-finisher-hierarchy.json').read_text());docs={}
 for id,patch in spec['entries'].items():
  root=patch['root'];p=R/f'plan/data/skills/{root}.json';d=docs.setdefault(p,json.loads(p.read_text()));base=next(s for s in d['hi_class_skills']if s['id']==id);aw=d['awakened_variants'][id]
  for skill,key in[(base,'base_parameters'),(aw,'awakened_parameters')]:
   skill['level_parameters'].update(copy.deepcopy(patch[key]))
   if patch.get('charge_skill_power'):
    for e in skill['effects']:
     if e.get('status_id')=='chase_charge':e['params']['skill_power']={'level_param':'skill_power'}
 for p,d in docs.items():p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 p=R/'plan/data/status-effects.json';d=json.loads(p.read_text());s=next(s for s in d['statuses']if s['id']=='chase_charge');s['parameter_schema']['properties']['skill_power']={'type':'number','minimum':0}
 if 'skill_power'not in s['parameter_schema']['required']:s['parameter_schema']['required'].append('skill_power')
 s['modifiers']=[{'id':'next_skill_power','stat':'skill_damage_bonus','op':'add_flat','bucket':'bonus','value':{'status_param':'skill_power'}}];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 return len(spec['entries'])
if __name__=='__main__':print('D192 applied',apply())

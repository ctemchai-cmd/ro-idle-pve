"""D192 independent raw-intent arithmetic; update affected rows of the existing78 cases."""
import json,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'plan/checks'));import composition as c
ids=set(json.loads((R/'plan/generators/hi-finisher-hierarchy.json').read_text())['entries']);ids.add('champion_chain_crush_combo')
skills={s['id']:s for p in(R/'plan/data/skills').glob('*.json')for s in json.loads(p.read_text())['hi_class_skills']}
p=R/'tests/game/fixtures/hi-skill-goldens.json';d=json.loads(p.read_text());changed=[]
def power(f):
 p=f['params'];return p['amount']if f['id']=='flat_power'else 1000*p['attack_ratio']+p['flat_power']
for row in d['cases']:
 if row['skill_id']not in ids:continue
 raw=skills[row['skill_id']];s=c.resolve(raw,{k:v[row['rank']-1]for k,v in raw['level_parameters'].items()});effects=[]
 for e in s['effects']:
  r={'effect_id':e['id'],'type':e['type'],'target':e['target']}
  if 'formula'in e:r.update(raw_power_at_1000=power(e['formula']),hits=e.get('hits',1))
  if e['type']=='sacrifice_damage':r['sacrifice_actual_hp_factor']=True
  if e['type']=='apply_status':r.update(status_id=e['status_id'],params={**e['params'],**{key:power(f)for key,f in e.get('parameter_formulas',{}).items()}},duration_ms=e['duration_ms'],chance=e['chance'])
  if e.get('when'):r['conditional']=True
  effects.append(r)
 row['effects']=effects;changed.append(row['skill_id']+':'+str(row['rank']))
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print('D192 independent golden intents updated',len(changed))

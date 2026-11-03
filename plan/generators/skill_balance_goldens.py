"""Independent Python raw-intent arithmetic for the explicitly reviewed refresh only."""
import json,runpy,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
ids=set(json.loads((R/'plan/generators/skill-balance-2026-11.json').read_text())['updates'])
p=R/'plan/data/skill-program-cases.json';old=json.loads(p.read_text())
sys.path.insert(0,str(R/'plan/checks'));import composition as c
runpy.run_path(str(R/'plan/checks/skill_oracles.py'))
new={row['id']:row for row in json.loads(p.read_text())['cases']}
for row in old['cases']:
 if row['skill_id']in ids:
  row['programs']=new[row['id']]['programs'];row['expected_modifiers']=new[row['id']]['expected_modifiers']
p.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
skills={s['id']:s for p in(R/'plan/data/skills').glob('*.json')for s in json.loads(p.read_text())['hi_class_skills']}
p=R/'tests/game/fixtures/hi-skill-goldens.json';d=json.loads(p.read_text())
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
 row['effects']=effects
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Reviewed skill raw-intent goldens refreshed; no battle simulation.')

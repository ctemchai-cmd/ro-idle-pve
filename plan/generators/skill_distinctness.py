"""D168 postprocessor: explicit composable skill identities; stable IDs and investment rows.

Run last after other class/Awaken generators. Never re-author frozen historical evidence.
The JSON spec is self-contained and does not need private saves or evidence files.
"""
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parents[2]
def load(p):return json.loads(p.read_text())
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def apply():
 spec=load(R/'plan/generators/skill-distinctness.json');seen=set()
 for p in (R/'plan/data/skills').glob('*.json'):
  doc=load(p);changed=False
  for skill in doc['skills']+doc.get('hi_class_skills',[]):
   patch=spec['updates'].get(skill['id'])
   if not patch:continue
   seen.add(skill['id']);skill.update(copy.deepcopy(patch['base']));doc['awakened_variants'][skill['id']].update(copy.deepcopy(patch['awakened']));changed=True
  if changed:write(p,doc)
 assert seen==set(spec['updates']),set(spec['updates'])-seen
 p=R/'plan/data/status-effects.json';doc=load(p);ids={s['id']for s in spec['statuses']};doc['statuses']=[s for s in doc['statuses']if s['id']not in ids]+copy.deepcopy(spec['statuses']);write(p,doc)
 p=R/'plan/data/strings.th.json';doc=load(p);doc['strings']['acolyte_increase_agi']='Ruwach';write(p,doc)
 return seen
if __name__=='__main__':print('D168 applied',len(apply()),'stable skill IDs')

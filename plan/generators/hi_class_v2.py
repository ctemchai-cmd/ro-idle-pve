"""D169 postprocessor: explicit local modern-v2 Hi skills, after D168/Awaken generators."""
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parents[2]
def apply():
 spec=json.loads((R/'plan/generators/hi-class-v2.json').read_text());seen=set()
 for p in (R/'plan/data/skills').glob('*.json'):
  d=json.loads(p.read_text());changed=False
  for s in d.get('hi_class_skills',[]):
   patch=spec['updates'].get(s['id'])
   if patch:
    s.update(copy.deepcopy(patch['base']));d['awakened_variants'][s['id']].update(copy.deepcopy(patch['awakened']));seen.add(s['id']);changed=True
  if changed:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 assert seen==set(spec['updates'])
 p=R/'plan/data/status-effects.json';d=json.loads(p.read_text());ids={s['id']for s in spec['statuses']};d['statuses']=[s for s in d['statuses']if s['id']not in ids]+copy.deepcopy(spec['statuses']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 p=R/'plan/data/strings.th.json';d=json.loads(p.read_text());d['strings'].update(spec['names']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 return seen
if __name__=='__main__':print('D169 explicit Hi v2 applied',len(apply()))

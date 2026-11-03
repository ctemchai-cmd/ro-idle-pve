"""Explicit reviewed per-skill overrides, applied last. No runtime class multipliers."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[2]
def apply():
 spec=json.loads((R/'plan/generators/skill-balance-2026-11.json').read_text());docs={}
 for sid,p in spec['updates'].items():
  path=R/('plan/data/skills/'+p['root']+'.json');d=docs.setdefault(path,json.loads(path.read_text()))
  base=next(s for s in d['skills']+d.get('hi_class_skills',[])if s['id']==sid)
  base.update(copy.deepcopy(p['base']));d['awakened_variants'][sid].update(copy.deepcopy(p['awakened']))
 for path,d in docs.items():path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 return len(spec['updates'])
if __name__=='__main__':print('Skills refreshed',apply())

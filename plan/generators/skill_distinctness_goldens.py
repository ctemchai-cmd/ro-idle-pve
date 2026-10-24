"""Refresh only D168's54 independently calculated Python raw-intent golden cases.

This is expected arithmetic, not measured engine evidence. Preserve old costs, inputs,
character-level examples and every case outside the selected18 IDs.
"""
import json,runpy,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
p=R/'plan/data/skill-program-cases.json';old=json.loads(p.read_text())
ids=set(json.loads((R/'plan/generators/skill-distinctness.json').read_text())['updates'])
sys.path.insert(0,str(R/'plan/checks'))
runpy.run_path(str(R/'plan/checks/skill_oracles.py'))
new={row['id']:row for row in json.loads(p.read_text())['cases']}
for row in old['cases']:
 if row['skill_id'] in ids:
  row['programs']=new[row['id']]['programs'];row['expected_modifiers']=new[row['id']]['expected_modifiers']
p.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
print('D168 updated54 raw-intent cases; no runtime measurements.')

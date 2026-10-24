"""D165: update authored example builds to legal ranks; no skill programs/prices change.
Old examples and all historical runtime/balance reports remain frozen in evidence.
"""
import json
from math import ceil
from pathlib import Path
from queue_estimates import apply
R=Path(__file__).resolve().parents[2]
for p in(R/'plan/data/skills').glob('*.json'):
 d=json.loads(p.read_text());skills={s['id']:s for s in d['skills']}
 for b in d['builds']:
  for sid,rank in b['skill_levels'].items():
   s=skills[sid]
   if 20<=s['unlock_level']<=40:
    cap=sum(s['unlock_level']+ceil(40*i/(s['max_level']-1))<=b['level']for i in range(s['max_level']))
    b['skill_levels'][sid]=min(rank,cap)
  b['paid_upgrade_budget']={k:sum(row[k]for sid,rank in b['skill_levels'].items()for row in d['upgrades'][sid]['upgrade_cost_rows']if row['to_level']<=rank)for k in ['gold','skill_manual']}
 apply(d,d['root_job_id']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

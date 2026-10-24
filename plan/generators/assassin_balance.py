"""D162: authored targeted power curves, not a job-wide damage multiplier.
Idempotent from frozen deployed131 source. Awaken policy is in awaken_identity.py.
"""
import json,gzip,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
frozen=json.loads(gzip.decompress((R/'plan/evidence/task-132/authored-before.json.gz').read_bytes()))
spec={'base_changes':{},'awaken_enchant_ratio':[.33,.36],'awaken_enchant_duration':[11000,12000],'target_dps':[9000,11000]}
for root,id,param,scale in [('thief','assassin_enchant_poison','ratio',.3/.4375),('merchant','whitesmith_cart_termination','power',1.1)]:
 p=R/f'plan/data/skills/{root}.json';doc=json.loads(p.read_text());old=json.loads(frozen[f'plan/data/skills/{root}.json'])
 original=next(s for s in old['skills']+old['hi_class_skills']if s['id']==id)
 s=next(s for s in doc['skills']+doc['hi_class_skills']if s['id']==id)
 s['level_parameters'][param]=[round(v*scale,6)for v in original['level_parameters'][param]]
 spec['base_changes'][id]={param:s['level_parameters'][param]}
 p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
(R/'tests/game/fixtures/assassin-balance-132.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
subprocess.run([sys.executable,str(R/'plan/generators/awaken_content.py'),'--evidence-task','132'],check=True)
print('Enchant Poison base14.4–30%; Awaken33–36%,11–12s; High Cart Termination power×1.10.')

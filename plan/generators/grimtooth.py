"""D166: explicit Grimtooth625% curve; idempotent, no price or queue changes."""
import json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];p=R/'plan/data/skills/thief.json';d=json.loads(p.read_text())
s=next(s for s in d['skills']if s['id']=='assassin_grimtooth');s['level_parameters']['power']=[round(3.75+2.5*i/9,6)for i in range(10)]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
subprocess.run([sys.executable,str(R/'plan/generators/awaken_content.py')],check=True)
print('Grimtooth375–625%/Aw687.5–906.25%; unchangedhit/focus/Expose/SP/queue/prices.')

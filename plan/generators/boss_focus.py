"""D161: idempotent authored trial, always derived from frozen deployed 9ae8 data.
Regenerate Awaken afterwards; do not overwrite historical TASK130 evidence.
"""
import json,gzip,copy,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
before=json.loads(gzip.decompress((R/'plan/evidence/task-131/content-before.json.gz').read_bytes()))
authored=json.loads(gzip.decompress((R/'plan/evidence/task-131/authored-before.json.gz').read_bytes()))
SCALES={
 'mage_fire_bolt':{'power':1.8},'mage_cold_bolt':{'power':1.8},'mage_lightning_bolt':{'power':1.8},'mage_soul_strike':{'power':1.8},
 'rogue_copy_mage_fire_bolt':{'power':1.8},
 'wizard_storm_gust':{'power':1.7},'wizard_jupitel':{'power':1.7},'wizard_meteor':{'power':1.7},'wizard_heavens_drive':{'power':1.7},
 'sage_psychic_bolt':{'power':1.9},'sage_magic_barrier':{'power':1.65},'sage_auto_bolt':{'power':1.5},
 'high_wizard_napalm_vulcan':{'power':1.7},
 'alchemist_acid_terror':{'power':1.65},'alchemist_demonstration':{'power':1.65,'burst':1.65},
 'creator_acid_demonstration':{'power':1.7},
}
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
statuses={s['id']:s for name in ['status-effects.json','class-status-effects.json'] for s in before['documents'][name]['statuses']}
rows=[]
for p in (R/'plan/data/skills').glob('*.json'):
 doc=json.loads(p.read_text());old=json.loads(authored['plan/data/skills/'+p.name])
 for group in ['skills','hi_class_skills']:
  for s in doc[group]:
   original=next(v for v in old[group] if v['id']==s['id'])
   s['level_parameters']=copy.deepcopy(original['level_parameters'])
   s.pop('single_target_damage_bonus',None)
   for key,scale in SCALES.get(s['id'],{}).items():
    s['level_parameters'][key]=[round(v*scale,6) for v in original['level_parameters'][key]]
   focused=False
   if s['kind']=='active':
    for e in s['effects']:
     selection=s['selectors'].get(e['target'],{})
     if selection.get('team')!='enemies' or selection.get('select')!='all':continue
     periodic=statuses.get(e.get('status_id'),{}).get('periodic') or {}
     if e['type']=='damage' or any(v['type']=='damage' for v in periodic.get('effects',[])):focused=True
   if focused:s['single_target_damage_bonus']=.35
   if focused or s['id'] in SCALES:rows.append({'id':s['id'],'focus_bonus':.35 if focused else 0,'power_scales':SCALES.get(s['id'],{})})
 write(p,doc)
# These helpers already hit one enemy. Strengthen only their damage coefficient;
# keep their heal, owner stats, inheritance and lifetimes unchanged.
p=R/'plan/data/summon-actors.json';summons=json.loads(authored['plan/data/summon-actors.json'])
for a in summons['actors']:
 scale={'hell_plant':1.75,'healing_plant':1.6}[a['id']]
 for e in a['action']['effects']:
  if e['type']=='damage':e['formula']['params']['attack_ratio']=round(e['formula']['params']['attack_ratio']*scale,6)
write(p,summons)
spec={'before_hash':before['manifest']['content_hash'],'focus_bonus':.35,'skills':rows,'summon_damage_scales':{'hell_plant':1.75,'healing_plant':1.6}}
write(R/'tests/game/fixtures/boss-focus-131.json',spec)
write(R/'plan/evidence/task-131/tuning.json',spec)
subprocess.run([sys.executable,str(R/'plan/generators/awaken_content.py'),'--evidence-task','131'],check=True)
print('Focused',sum(bool(r['focus_bonus'])for r in rows),'skills; tuned',len(SCALES),'power programs.')

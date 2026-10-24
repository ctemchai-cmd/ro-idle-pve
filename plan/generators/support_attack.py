"""D164: team attack buffs support both physical and magical builds.
Only mirror existing allied attack_up applications; keep original amounts/timing.
"""
import copy,json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
changed=[]
for p in (R/'plan/data/skills').glob('*.json'):
 doc=json.loads(p.read_text())
 for skill in doc['skills']+doc['hi_class_skills']:
  if skill['kind']!='active':continue
  for e in list(skill['effects']):
   if e.get('status_id')!='attack_up' or skill['selectors'].get(e['target'],{}).get('team')!='allies':continue
   if any(a.get('status_id')=='magic_up' and a['target']==e['target'] for a in skill['effects']):continue
   magic=copy.deepcopy(e);magic['id']='support_magic_up';magic['status_id']='magic_up';skill['effects'].insert(skill['effects'].index(e)+1,magic);changed.append(skill['id'])
 p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
subprocess.run([sys.executable,str(R/'plan/generators/awaken_content.py'),'--evidence-task','133'],check=True)
print('Added matching M.ATK buffs:',changed)
# Mirror the independently authored P.ATK golden intent verbatim for the M.ATK addition.
# Never recalculate a damage/heal oracle from runtime output.
ids=set('knight_battle_cry priest_impositio merchant_loud_voice blacksmith_weapon_perfection whitesmith_maximum_overthrust bard_battle_song'.split())
audit=[]
for p in [R/'plan/data/skill-program-cases.json',R/'tests/game/fixtures/hi-skill-goldens.json']:
 doc=json.loads(p.read_text())
 for row in doc['cases']:
  if row['skill_id'] not in ids:continue
  lists=[program['expected_intents'] for program in row['programs']] if 'programs'in row else [row['effects']]
  for effects in lists:
   existing=next((e for e in effects if e['effect_id']=='support_magic_up'),None)
   if existing:
    for modifier in existing.get('expected_modifiers',[]):
     if modifier['stat']=='physical_attack':modifier['stat']='magical_attack'
    audit.append({'file':str(p.relative_to(R)),'skill':row['skill_id'],'rank':row.get('skill_level',row.get('rank'))})
    continue
   old=next((e for e in effects if e.get('status_id')=='attack_up'),None)
   if old:
    magic=copy.deepcopy(old);magic['effect_id']='support_magic_up';magic['status_id']='magic_up'
    for modifier in magic.get('expected_modifiers',[]):
     if modifier['stat']=='physical_attack':modifier['stat']='magical_attack'
    effects.insert(effects.index(old)+1,magic);audit.append({'file':str(p.relative_to(R)),'skill':row['skill_id'],'rank':row.get('skill_level',row.get('rank'))})
 p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
(R/'plan/evidence/task-133-golden-authoring-audit.json').write_text(json.dumps({'new_intents':audit,'method':'Copy original independently authored attack_up oracle, changing effect_id, status_id and the modifier stat to magical_attack; preserve every old intent.'},ensure_ascii=False,indent=2)+'\n')

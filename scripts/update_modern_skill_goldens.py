"""Explicit D138 oracle migration from archived authored definitions, not runtime output.
Only skills changed by user notes are rewritten. Unaffected golden cases remain identical.
"""
import argparse,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'plan/checks'))
import composition as c
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--before',required=True);args=ap.parse_args()
 before=json.load(open(args.before));old={s['id']:s for path,doc in before.items()if '/skills/'in path for s in doc['skills']}
 new={s['id']:s for p in(ROOT/'plan/data/skills').glob('*.json')for s in json.load(open(p))['skills']}
 changed={id for id in new if new[id]!=old[id]}
 p=ROOT/'plan/data/skill-program-cases.json';d=json.loads(p.read_text());old_cases=json.loads(p.read_text())['cases'];changes=[]
 for row in d['cases']:
  if row['skill_id']not in changed:continue
  s=new[row['skill_id']];s=c.resolve(s,{k:v[row['skill_level']-1]for k,v in s['level_parameters'].items()});i=row['input']
  def raw(f):
   a=f['params'];kind=f['id']
   if kind in ['physical_power','magical_power','healing_power']:return i['source_physical_attack'if kind=='physical_power'else'source_magical_attack']*a['attack_ratio']+a['flat_power']
   if kind=='flat_power':return a['amount']
   if kind=='sp_burst_power':return i['source_physical_attack']*a['attack_ratio']+i['pre_cost_sp']*a['sp_ratio']
   if kind=='event_damage_power':return i['event_hp_damage']*a['ratio']
   raise ValueError(kind)
  def intent(e):
   v={'effect_id':e['id'],'type':e['type'],'target':e['target']}
   if'formula'in e:v['expected_raw_power']=raw(e['formula'])
   for k in ['status_id','duration_ms','chance','params','actor_definition_id','max_owned','power_scale','max_instances','critical_rule','crit_chance_bonus','crit_damage_bonus','damage_type','element','hit_rule','can_crit','hits','armor_rule']:
    if k in e:v[k]=e[k]
   if'when'in e:v['predicate']=e['when']
   if e['type']=='resource_change':v['requested_delta']=e['amount']
   if e['type']=='apply_status':
    status=c.resolve(c.STATUSES[e['status_id']],status_values=e['params']);v['expected_modifiers']=status['modifiers']
    if status['periodic']:
     t=status['periodic'];v['tick_times_ms']=list(range(0 if t['tick_on_apply']else t['interval_ms'],e['duration_ms'],t['interval_ms']));v['periodic_raw_intents']=[intent(a)for a in t['effects']]
   return v
  row['expected_modifiers']=s.get('modifiers',[])
  if s['kind']=='active':row['programs']=[{'phase':'cast_start','expected_intents':[intent(e)for e in s['start_effects']]},{'phase':'cast_resolve','expected_intents':[intent(e)for e in s['effects']]}]
  else:row['programs']=[{'phase':'trigger_'+t['event'],'trigger_id':t['id'],'chance':t['chance'],'expected_intents':[intent(e)for e in t['effects']]}for t in s['triggers']]
  changes.append(row['id'])
 for a,b in zip(old_cases,d['cases']):
  if b['skill_id']not in changed:assert a==b
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'plan/evidence/task-107-golden-authoring-audit.json').write_text(json.dumps({'changed_skills':sorted(changed),'updated_cases':changes,'unchanged_cases_verified':len(old_cases)-len(changes),'oracle':'Authored definitions and hand arithmetic, not combat-runner output. Independent D138 tests assert70/50 ratios, outcomes, crit isolation and speed parity.','new_assertions':'Damage policy/crit fields and dispel count now included in changed golden intents; old rollback and parity assertions retained.'},indent=2)+'\n')
if __name__=='__main__':main()

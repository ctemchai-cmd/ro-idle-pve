"""Generate independent raw-power/intent fixtures before the TS engine exists.

These are expected math inputs, not measured battles or executed skill tests.
"""
import json
from pathlib import Path
import composition as c
D=c.DATA
def raw(call):
 p=call['params'];fid=call['id']
 if fid in ['physical_power','magical_power','healing_power']:return 100*p['attack_ratio']+p['flat_power']
 if fid=='flat_power':return p['amount']
 if fid=='sp_burst_power':return 100*p['attack_ratio']+200*p['sp_ratio']+p['flat_power']
 if fid=='event_damage_power':return 100*p['ratio']
 raise ValueError(fid)
def intent(effect):
 result={'effect_id':effect['id'],'type':effect['type'],'target':effect['target']}
 if 'formula' in effect:result['expected_raw_power']=raw(effect['formula'])
 if effect['type']=='apply_status':
  result.update(status_id=effect['status_id'],duration_ms=effect['duration_ms'],chance=effect['chance'],params=effect['params'])
  definition=c.resolve(c.STATUSES[effect['status_id']],status_values=effect['params']);result['expected_modifiers']=definition['modifiers']
  if definition['periodic']:
   per=definition['periodic'];result['tick_times_ms']=list(range(0 if per['tick_on_apply'] else per['interval_ms'],effect['duration_ms'],per['interval_ms']));result['periodic_raw_intents']=[intent(e) for e in per['effects']]
 if effect['type']=='handler':result['own_statuses_consumed']=2;result['expected_raw_power']=2*(effect['params']['power_per_instance']+100*effect['params'].get('attack_ratio_per_instance',0));result['other_source_statuses_remaining']=1
 if effect['type']=='resource_change':result['requested_delta']=effect['amount']
 if effect['type']=='revive':result['expected_hp_after']=max(1,int(10000*effect['hp_ratio']));result['expected_sp_after']=int(1000*effect['sp_ratio'])
 if effect['type']=='summon':
  result.update(actor_definition_id=effect['actor_definition_id'],max_owned=effect['max_owned'],duration_ms=effect['duration_ms'])
  if 'power_scale' in effect:result['power_scale']=effect['power_scale']
 if effect.get('when'):result['predicate']=effect['when']
 return result
cases=[]
for path in sorted((D/'skills').glob('*.json')):
 data=json.loads(path.read_text())
 for skill in data['skills']:
  for level in [1,4,10]:
   s=c.resolve(skill,{k:v[level-1] for k,v in skill['level_parameters'].items()})
   programs=[{'phase':phase,'expected_intents':[intent(e) for e in s[key]]} for phase,key in [('cast_start','start_effects'),('cast_resolve','effects')] if key in s]
   programs += [{'phase':'trigger_'+t['event'],'trigger_id':t['id'],'chance':t['chance'],'expected_intents':[intent(e) for e in t['effects']]} for t in s.get('triggers',[])]
   sp=s.get('cost',{}).get('sp',0);cost=200 if isinstance(sp,dict) else sp
   cases.append({'id':s['id']+'_level_'+str(level),'skill_id':s['id'],'skill_level':level,'character_level':max(s['unlock_level'],1+5*(level-1)),
    'input':{'source_physical_attack':100,'source_magical_attack':100,'pre_cost_sp':200,'pre_cost_spheres':5,'event_hp_damage':100,'revive_target_max_hp':10000,'revive_target_max_sp':1000,'handler_target_statuses':{'own_source':2,'other_source':1}},
    'expected_cost':{'sp':cost,'spirit_spheres':s.get('cost',{}).get('spirit_spheres',0)},'expected_modifiers':s.get('modifiers',[]),'programs':programs,
    'limits':'raw formula/intent projection only; hit/crit/chance/armor/deaths/proc ordering use combat/composition cases and real runtime tests separately'})
out={'schema_version':1,'purpose':'Golden M0 expected raw-power/intent fixtures for implementation tests, not executed TS combat results','cases':cases}
(D/'skill-program-cases.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'golden_cases':len(cases),'skill_count':len({c['skill_id'] for c in cases}),'battle_tests_executed':0}))

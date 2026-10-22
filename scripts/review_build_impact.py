#!/usr/bin/env python3
"""Independent static arithmetic only. No combat engine, seed batch, journey or balance runner."""
from pathlib import Path
import subprocess
import json
import math

ROOT = Path(__file__).resolve().parents[1]
BASE = '79b3eaba6'
def load(name, old=False):
    file = 'plan/data/'+name
    return json.loads(subprocess.check_output(['git','show',BASE+':'+file],cwd=ROOT)) if old else json.loads((ROOT/file).read_text())
def bind(value, level, params, status=None):
    if isinstance(value, dict):
        if set(value)=={'level_param'}: return params[value['level_param']][level-1]
        if set(value)=={'status_param'}: return status[value['status_param']]
        return {k:bind(v,level,params,status) for k,v in value.items()}
    if isinstance(value,list):return [bind(v,level,params,status) for v in value]
    return value
def raw(formula, offense):
    p=formula['params'];f=formula['id']
    if f=='physical_power':return offense['atk']*p['attack_ratio']+p['flat_power']
    if f in ['magical_power','healing_power']:return offense['matk']*p['attack_ratio']+p['flat_power']
    if f=='flat_power':return p['amount']
    if f=='sp_burst_power':return offense['atk']*p['attack_ratio']+offense['sp']*p['sp_ratio']+p['flat_power']
    if f=='event_damage_power':return 100*p['ratio']
    raise ValueError(f)
def damage(effects, statuses, summons, offense):
    total=0
    for e in effects:
        if e['type']=='damage':total+=raw(e['formula'],offense)*e['hits']
        elif e['type']=='apply_status':
            s=bind(statuses[e['status_id']],1,{},e['params']);per=s.get('periodic')
            if per:
                ticks=len(range(0 if per['tick_on_apply'] else per['interval_ms'],e['duration_ms'],per['interval_ms']))
                total+=ticks*damage(per['effects'],statuses,summons,offense)
            for trigger in s.get('triggers',[]): total+=damage(trigger['effects'],statuses,summons,offense)
        elif e['type']=='handler':total+=2*(e['params']['power_per_instance']+offense['atk']*e['params'].get('attack_ratio_per_instance',0))
        elif e['type']=='summon':
            s=summons[e['actor_definition_id']];scaled={**offense,**{key:math.floor(offense[key]*s['derived_scale']*e.get('power_scale',1)) for key in ['atk','matk']}}
            ticks=len(range(s['action']['interval_ms'],e['duration_ms'],s['action']['interval_ms']))
            total+=ticks*damage(s['action']['effects'],statuses,summons,scaled)
    return total

docs={old:{root:load('skills/'+root+'.json',old) for root in ['swordsman','acolyte','archer','mage','thief','merchant']} for old in [True,False]}
skills={old:{s['id']:s for doc in tree.values() for s in doc['skills']} for old,tree in docs.items()}
statuses={old:{s['id']:s for file in ['status-effects.json','class-status-effects.json'] for s in load(file,old)['statuses']} for old in [True,False]}
summons={old:{s['id']:s for s in load('summon-actors.json',old)['actors']} for old in [True,False]}
rows=[];invariants=[]
for sid,s in skills[False].items():
    before=skills[True][sid]
    for key in ['kind','cost','timing','selectors','start_effects']:
        assert before.get(key)==s.get(key),(sid,key)
    invariants.append(sid)
    if before==s and sid!='alchemist_hell_plant':continue
    for level in [1,10]:
        a=bind(before,level,before['level_parameters']);b=bind(s,level,s['level_parameters'])
        powers=[damage(x.get('effects',[e for t in x.get('triggers',[]) for e in t['effects']]),statuses[old],summons[old],{'atk':100,'matk':100,'sp':200}) for x,old in [(a,True),(b,False)]]
        cast=b.get('timing',{}).get('cast_ms',0);acd=b.get('timing',{}).get('after_cast_ms',0)
        rows.append({'skill_id':sid,'kind':s['kind'],'level':level,'sp':b.get('cost',{}).get('sp',0),'spheres':b.get('cost',{}).get('spirit_spheres',0),'cast_ms':cast,'acd_ms':acd,'raw_before':round(powers[0],4),'raw_after':round(powers[1],4),'change_percent':round((powers[1]/powers[0]-1)*100,2) if powers[0] else None,'normal_clock_cast_opportunity':round(cast/1500,3),'normal_available_time_in_window_ms':3000+acd})
policy=json.loads((ROOT/'plan/generators/build-impact-spec.json').read_text())
for sid,params in policy['baseline_skill_power'].items():
    for key,base in params.items():
        current=skills[False][sid]['level_parameters']
        expected=[round(v*policy['power_multiplier']/(100 if sid=='assassin_detonate' else 1),6) for v in base]
        actual=current['detonate_ratio'] if sid=='assassin_detonate' else current[key]
        assert all(abs(x-y)<1e-8 for x,y in zip(expected,actual,strict=True)),(sid,key)
for filename in ['progression.json','economy.json','loot.json','gacha.json','slot-progress.json','stages.json','tower.json','daily-bosses.json']:
    assert load(filename)==load(filename,True),filename
before,after=load('cards.json',True),load('cards.json')
assert before['origins']==after['origins'] and before['presentations']==after['presentations']
assert [(x['id'],x['slot'],x['tier_level']) for x in before['definitions']]==[(x['id'],x['slot'],x['tier_level']) for x in after['definitions']]
for key in ['level_multipliers','rarities','level_cost_rows']:assert before[key]==after[key]
for old,new in zip(before['definitions'],after['definitions'],strict=True):
    for t0,t1 in zip(old['triggers'],new['triggers'],strict=True):
        assert {k:v for k,v in t0.items() if k!='effects'}=={k:v for k,v in t1.items() if k!='effects'}
        for e0,e1 in zip(t0['effects'],t1['effects'],strict=True):
            if e0['type']=='damage':
                for k,v in e0['formula']['params'].items():assert abs(e1['formula']['params'][k]-v*policy['power_multiplier'])<1e-8
            else:assert e0==e1
gear0,gear1=load('equipment.json',True),load('equipment.json')
for key in ['rarities','tier_upgrade','fusion','salvage','targeted_weapon_purchase']:assert gear0[key]==gear1[key]
report={'task_id':'TASK-077','passed':True,'baseline_commit':BASE,'scope':'Static raw-power arithmetic, never actual DPS or balance simulation','assumptions':['ATK=100, MATK=100, pre-costSP=200 are independent normalization units, not an actual character build','One target; all hits land; no crit/armor/buffs; all DoT/summon ticks land; no death/CC/SP skip','Detonate compares2 own poison instances; actual rotation may leave fewer and timing matters','Skill/normal clocks shareASPD but CT/ACD shareCSPD; report uses100ratings without proposing timing changes'],'invariants':{'skill_timing_cost_selectors_start':len(invariants),'economy_files_unchanged':5,'card_identity_art_slot_tier_quality_level_costs_unchanged':True,'gear_cost_rarity_tier_fusion_unchanged':True},'skills':rows,'balance_simulation':False,'owner_cloud_writes':False}
(ROOT/'plan/evidence/task-077-static-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':True,'static_skill_level_rows':len(rows),'invariant_skills':len(invariants),'balance_simulation':False}))

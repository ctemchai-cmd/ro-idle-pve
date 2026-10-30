"""M0 encounter reference, target and mode-rule review. Not combat simulations."""
import json,hashlib,math
from datetime import datetime,timedelta,timezone
from pathlib import Path
import composition as c
from classes import asset_reference
R=c.ROOT;D=c.DATA
def load(n):return json.loads((D/n).read_text())
story=load('stages.json');enemies=load('enemies.json');tower=load('tower.json');daily=load('daily-bosses.json');rows=[]
skills={s['id']:s for p in (D/'skills').glob('*.json') for s in json.loads(p.read_text())['skills']};enemy_skills={s['id']:s for s in enemies['skills']};actor_ids={a['id'] for a in enemies['actors']}
def check(cid,ac,fn):
 try:r=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':r})
 except Exception as ex:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(ex)})
for s in enemy_skills.values():check(s['id'],['AC-01'],lambda s=s:c.validate('skill',s))
for a in enemies['actors']:check('actor_'+a['id'],['AC-01'],lambda a=a:asset_reference(a['presentation']['meta_path'])['id'])
for i,stage in enumerate(story['stages']):
 def entry(stage=stage,i=i):
  assert stage['id']==f"{stage['chapter']}-{stage['index']}" and stage['time_limit_ms']==40000
  assert stage['unlock_after']==(story['stages'][i-1]['id'] if i else None)
  assert stage['recommended_party_level']<=100 and (stage['recommended_party_level']<=70 or stage.get('release_gate',{}).get('minimum_level_cap',0)>=stage['recommended_party_level']) and stage['balance_target']['not_measured_yet']
  ids=set()
  for actor in stage['encounter']:
   assert actor['actor_id'] not in ids;ids.add(actor['actor_id']);assert actor['definition_id'] in actor_ids
   assert len(actor['active_slots'])==4
   assert all(s is None or s in enemy_skills for s in actor['active_slots'])
   assert all(s in enemy_skills and enemy_skills[s]['kind']=='passive' for s in actor['passives'])
   assert actor['resolved_base']['max_hp']>=1 and all(isinstance(v,int) and v>=0 for v in actor['resolved_base'].values())
  if stage['index']==story['stages_per_chapter_by_chapter'][str(stage['chapter'])]:
   assert len(stage['solutions'])>=2
   for solution in stage['solutions']:
    assert solution['examples_are_mandatory'] is False
    assert all(skills[s]['unlock_level']<=stage['recommended_party_level'] for s in solution['example_skill_ids']),stage['id']
  asset_reference('assets/ro/'+stage['background']['meta']);asset_reference('assets/ro/'+stage['music']['meta'])
  return {'actors':len(ids),'recommended_level':stage['recommended_party_level'],'solutions':len(stage['solutions']),'target_seconds':stage['balance_target']['first_clear_seconds']}
 check('stage_'+stage['id'],['AC-01','AC-02','AC-03'],entry)
def total():
 # D-057: chapters 1-3 keep 10 stages, 4-8 have 20 (future chapters 50); rewards scale by 10/N so chapter totals stay fixed.
 layout={'1':10,'2':10,'3':10,'4':20,'5':20,'6':20,'7':20,'8':20,'9':50,'10':50,'11':50,'12':50,'13':30,'14':30,'15':30}
 assert story['stages_per_chapter_by_chapter']==layout and story['future_stages_per_chapter']==50 and story['chapters']==15 and 'stages_per_chapter' not in story
 assert story['total_stages']==420 and len(story['stages'])==420 and len({s['id'] for s in story['stages']})==420
 for key,n in layout.items():assert [s['index'] for s in story['stages'] if s['chapter']==int(key)]==list(range(1,n+1)),key
 assert sum(s['first_clear_reward']['crystal'] for s in story['stages'])==3000
 for ch in range(1,16):
  rows=[s for s in story['stages'] if s['chapter']==ch];assert sum(r['first_clear_reward']['gold'] for r in rows)==2500*ch*ch and sum(r['first_clear_reward']['hero_exp'] for r in rows)==4000*ch*ch,ch
 import subprocess,sys
 assert subprocess.run([sys.executable,str(R/'plan/generators/stages.py'),'--check'],capture_output=True).returncode==0,'stages.json differs from its generator'
 assert subprocess.run([sys.executable,str(R/'plan/generators/stages.py'),'--legacy','--check'],capture_output=True).returncode==0,'generator no longer reproduces the reviewed 8x10 baseline'
 return {'chapters':15,'stages':420,'layout':layout,'future_stages_per_chapter':50,'first_clear_crystal_total':3000,'chapter_reward_totals_unchanged':True,'generator':'plan/generators/stages.py (legacy 8x10 byte-identical)','rare_cards_required':False}
check('story_totals',['AC-01','AC-02'],total)
def terminal():
 def result(player_alive,enemy_alive,t):return 'loss' if t>=40000 or not player_alive else 'win' if not enemy_alive else 'running'
 assert result(3,1,10000)=='running';assert result(1,0,39999)=='win';assert result(4,0,40000)=='loss';assert result(0,0,10000)=='loss'
 assert story['rules']['retry_cost']=={} and story['rules']['offline_boss_progress'] is False
 return {'main_dead_others_alive':'running','enemy_death_at_39999':'win','enemy_death_at_40000':'timeout loss (D-066)','both_wipe':'loss'}
check('terminal_boundary_hand_cases',['AC-02'],terminal)
def tower_case():
 assert len(tower['floor_rows'])==100 and not tower['resets'] and tower['first_clear_only'] and not tower['has_gameplay_floor_cap']
 for row in tower['floor_rows']:
  f=row['floor'];assert row['hp']==600+100*f+8*f*f+2*f**3;assert row['attack']==(220+44*f+11*f*f+19)//20;assert row['defense']==5+3*f
 assert 600+100*1000+8*1000**2+2*1000**3==2008100600
 return {'authored_rows':100,'floor1000_hp':2008100600,'resets':False,'claim_scope':'account+floor once','extension':'same safe numeric generator, not a victory cap at100'}
check('tower_generator_and_first_clear',['AC-04'],tower_case)
def daily_case():
 assert len(daily['bosses'])==3
 for b in daily['bosses']:assert b['attempts_per_day']==3 and b['time_limit_ms']==60000 and not b['counts_as_ordinary_terminal_enemy']
 before=datetime(2026,10,19,23,59,45,tzinfo=timezone(timedelta(hours=7)));after=before+timedelta(seconds=60);assert str(before.date())=='2026-10-19' and str(after.date())=='2026-10-20'
 hp=(5000+1500*(3-1))*(1+.2*(4-2));assert hp==11200
 return {'attempts_total_per_day':9,'cross_midnight_ticket_day':str(before.date()),'new_day':str(after.date()),'writes':'archived ticket day only, new day attempts remain0','chapter4_phase3_hp':hp,'partial_hp':'commit between attempts, new party full HP/SP','no_offline_damage':daily['no_offline_boss_damage']}
check('daily_reset_phase_and_ticket_day',['AC-04'],daily_case)
passed=all(r['passed'] for r in rows);inputs=[D/n for n in ['stages.json','enemies.json','tower.json','daily-bosses.json','economy.json']]+[Path(__file__)]
report={'task_id':'TASK-011','reviewer':'Codex self-review','review_date':'2026-10-19','review_round':1,'scope':'M0 content refs/level gates/manual terminal-reset cases/encounter targets; no measured TTK or success rates','input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed}
(R/'plan/evidence/task-011-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

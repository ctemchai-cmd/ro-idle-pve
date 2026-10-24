"""M0 class/catalog/asset-reference review. Does not simulate real battles."""
import argparse
from copy import deepcopy
import hashlib
import json
from math import ceil,isclose
from pathlib import Path
import composition as c

R=c.ROOT;D=c.DATA
def load(p):return json.loads(p.read_text())
TASKS={'swordsman':'003','acolyte':'004','archer':'005','mage':'006','thief':'007','merchant':'008'}
TREE=load(D/'progression.json')['class_tree']

def stat_cost(v):return sum(1+(x-1)//10 for x in range(1,v))
def skill_cap(skill,l):
 if 20<=skill['unlock_level']<=40:return sum(skill['unlock_level']+ceil(40*i/(skill['max_level']-1))<=l for i in range(skill['max_level']))
 return min(skill['max_level'],1+(l-1)//5)
def cumulative(data,sid,lv):return {key:sum(r[key] for r in data['upgrades'][sid]['upgrade_cost_rows'] if r['to_level']<=lv) for key in ['gold','skill_manual']}
def asset_reference(path):
 p=R/path;assert p.exists(),path;m=load(p)
 base=R/'assets/ro/library' if path.startswith('assets/ro/library/') else R/'assets/ro/prepared' if path.startswith('assets/ro/prepared/') else R/'assets/ro'
 payload=base/m['file']['path'];assert payload.exists(),(path,m['file']['path']);assert m.get('status','exported') not in ['source_dependencies_missing','missing']
 assert hashlib.sha256(payload.read_bytes()).hexdigest()==m['file']['sha256'],path
 assert not m.get('missing_dependencies'),path
 return m

def review(root):
 path=D/f'skills/{root}.json';data=load(path);skills={s['id']:s for s in data['skills']};c.unique_ids(data['skills']);rows=[]
 actors=load(D/'summon-actors.json')['actors'] if (D/'summon-actors.json').exists() else []
 actor_ids=frozenset(a['id'] for a in actors)
 def check(cid,ac,fn):
  try: result=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':result})
  except Exception as e:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(e)})
 for s in skills.values():
  def validate(s=s):
   c.validate('skill',s,actor_ids);assert s['class_id'] in [root,*TREE[root]];assert s['unlock_level']>= (1 if s['class_id']==root else 20)
   snapshots=[c.resolve(s,{k:v[l] for k,v in s['level_parameters'].items()}) for l in range(s['max_level'])]
   for a,b in zip(snapshots,snapshots[1:]):
    for d in [a,b]:d.pop('level_parameters',None)
    assert a!=b,(s['id'],'paid upgrade has identical behavior')
   cost=data['upgrades'][s['id']]['upgrade_cost_rows'];assert len(cost)==s['max_level']-1
   for k,row in enumerate(cost,1):assert row['from_level']==k and row['to_level']==k+1 and all(row[r]>0 and isinstance(row[r],int) for r in ['gold','skill_manual'])
   for l in range(1,71):assert 0<=skill_cap(s,l)<=s['max_level']
   return {'levels_checked':s['max_level'],'character_cap_rows':70,'upgrade_to_max':cumulative(data,s['id'],s['max_level'])}
  check(s['id'],['AC-01','AC-04'],validate)
 for branch in TREE[root]:
  def branchbuild(branch=branch):
   bs=[b for b in data['builds'] if b['job_id']==branch];assert len(bs)>=2;assert len({tuple(b['active_slots']) for b in bs})>=2;return [b['id'] for b in bs]
  check('two_builds_'+branch,['AC-02','AC-03'],branchbuild)
 for b in data['builds']:
  def build(b=b):
   assert len(b['active_slots'])==4 and len(set(b['active_slots']))==4
   assert set(b['primary_stats'])=={'str','agi','vit','int','dex','luk'}
   points=sum(stat_cost(v) for v in b['primary_stats'].values());assert points==b['spent_status_points'] and points+b['unspent_status_points']==sum(3+l//5 for l in range(2,b['level']+1))  # D-057 budget
   budget={'gold':0,'skill_manual':0}
   for sid,lv in b['skill_levels'].items():
    s=skills[sid];assert s['class_id'] in [root,b['job_id']] and s['unlock_level']<=b['level'];assert 1<=lv<=skill_cap(s,b['level'])
    for k,v in cumulative(data,sid,lv).items():budget[k]+=v
   assert budget==b['paid_upgrade_budget'];assert set(b['automatic_passives'])=={s['id'] for s in skills.values() if s['class_id'] in [root,b['job_id']] and s['kind']=='passive' and s['unlock_level']<=b['level']}
   for sid in b['active_slots']:assert skills[sid]['kind']=='active' and sid in b['skill_levels']
   if root=='thief':assert sum(s.startswith('rogue_copy_') for s in b['active_slots'])<=1
   bonus=load(D/'progression.json')['status_allocation']['job_bonus_by_root'][root];st={k:v+bonus.get(k,0) for k,v in b['primary_stats'].items()}  # D-061 job bonus
   aspd=100+(st['agi']-1)+.25*(st['dex']-1);cs=100+1.5*(st['dex']-1)+.25*(st['int']-1)
   permanent=[c.resolve(skills[sid],{k:v[b['skill_levels'][sid]-1] for k,v in skills[sid]['level_parameters'].items()}) for sid in b['automatic_passives']]
   def timing_stat(base,key):
    mods=[m for p in permanent for m in p['modifiers'] if m['stat']==key];return max(1,(base+sum(m['value'] for m in mods if m['op']=='add_flat'))*(1+sum(m['value'] for m in mods if m['op']=='add_percent')))
   aspd=timing_stat(aspd,'attack_speed');cs=timing_stat(cs,'cast_speed');si=ceil(150000/aspd);at=0;sp=0
   for sid,expected in zip(b['active_slots'],b['queue_estimate']['starts']):
    raw=skills[sid];s=c.resolve(raw,{k:v[b['skill_levels'][sid]-1] for k,v in raw['level_parameters'].items()});at+=si;ct=ceil(s['timing']['cast_ms']*100/cs);acd=ceil(s['timing']['after_cast_ms']*100/cs)
    assert expected=={'skill_id':sid,'start_ms':at,'resolve_ms':at+ct,'acd_end_ms':at+ct+acd};at+=ct+acd
    if isinstance(s['cost']['sp'],(int,float)):sp+=s['cost']['sp']
   assert at==b['queue_estimate']['cycle_ms'] and sp==b['queue_estimate']['fixed_sp_per_cycle']
   return {'spent_status_points':points,'unspent':b['unspent_status_points'],'upgrade_budget':budget,'unbuffed_cycle_ms':at,'warning':'analytical schedule only; SP/sphere stalls/procs wait for engine'}
  check(b['id'],['AC-02','AC-03'],build)
 pres=load(D/f'presentations/{root}.json')['presentations'];pm={p['id']:p for p in pres}
 if root=='thief':
  for p in (D/'presentations').glob('*.json'):
   pm.update({x['id']:x for x in load(p)['presentations']})
 rec={x['skill_id']:x for x in load(R/'assets/ro/prepared/skill-recipes.json')['recipes']}
 for s in skills.values():
  def assets(s=s):
   p=pm[s['presentation_id']];m=asset_reference(p['icon_meta_path']);assert m['id']==p['icon_asset_id'];recipe=rec[p['visual']['reference_skill_id']];assert recipe['ready']
   refs=['assets/ro/'+recipe['icon']['meta'],*p['sound_meta_paths']]+(['assets/ro/'+recipe['native_effect']['meta']] if recipe['native_effect'] else [])
   for path in refs:asset_reference(path)
   return {'icon':m['id'],'vfx_recipe':recipe['skill_id'],'media_references':len(refs),'scope':'metadata-only selection; no new image/animation visual review'}
  check('presentation_'+s['id'],['AC-04'],assets)
 def starters():
  first=[s for s in skills.values() if s['class_id']==root and s['kind']=='active' and s['unlock_level']==1];assert len(first)==2;return [s['id'] for s in first]
 check('starter_two_skills',['AC-01','AC-02'],starters)
 if root=='archer':
  def performances():
   bard={s['id'][5:]:s for s in skills.values() if s['class_id']=='bard'};dancer={s['id'][7:]:s for s in skills.values() if s['class_id']=='dancer'};assert set(bard)==set(dancer)
   for suffix in bard:
    a=deepcopy(bard[suffix]);b=deepcopy(dancer[suffix])
    for d in [a,b]:
     for k in ['id','name_key','class_id','presentation_id','tags']:d.pop(k)
    if suffix in ['battle_song','dissonance']:assert a!=b,suffix
    else:assert a==b,suffix
   assert len(load(D/'progression.json')['initial_state']['npc_roster'])==6
   return {'equal_gameplay_pairs':len(bard)-2,'distinct_support_pairs':2,'archer_companion_count':1,'appearance_choice':'bard or dancer; same roster character'}
  check('bard_dancer_equal_gameplay_one_npc',['AC-03'],performances)
 if root=='acolyte':
  def healing_tank():
   heal=skills['acolyte_heal'];assert heal['selectors']['friend']['select']=='lowest_hp_percent' and heal['kind']=='active'
   steel=skills['monk_steel_body'];fx={e.get('status_id'):e for e in steel['effects']};assert fx['slow']['params']['ratio']==-.3 and 'provoke' in fx
   assert skills['monk_asura']['cost']=={'sp':{'mode':'all_current','minimum_sp':30},'spirit_spheres':5}
   return {'heal_at_full_hp':'cast and spend SP, effective=0, overheal=raw; no HP condition field',
           'steel_body_max_guard':steel['level_parameters']['guard'][-1],
           'si_at_100_rating_while_slow':ceil(150000/(100*(1-.3))), 'asura':'all SP and five spheres, no interrupt refund'}
  check('queued_heal_and_monk_tradeoff',['AC-03'],healing_tank)
 if root=='mage':
  def autobolt():
   t=skills['sage_auto_bolt']['triggers'][0];assert t['event']=='normal_attack_hit' and t['accepted_origins']==['normal'];assert all(e['type']=='damage' for e in t['effects']);assert t['reentry']=='deny_same_source_trigger_in_ancestry'
   example=next(b for b in data['builds'] if b['id']=='sage_auto_bolt');assert isclose(example['queue_estimate']['cast_speed_rating'],179.20000000000002);assert example['queue_estimate']['cycle_ms']==6866  # D-061 job bonus (was 164.64/7344)
   return {'proc':'normal hits only; proc origin does not retrigger it','cast_rule':'baseline15 pauses NA clock during CT; passive grants no exception','spell_breaker':'always in ordered slots, not boss-cast AI'}
  check('autobolt_no_free_cast_or_recursion',['AC-03'],autobolt)
 if root=='merchant':
  for a in actors:
   def actor(a=a):
    assert a['owner_required'] and not a['targetable'] and not a['counts_for_party_defeat'] and not a['counts_for_enemy_victory'];assert a['source_death']=='remove'
    assert a['action']['interval_ms']>0 and not a['action']['tick_on_spawn'];assert a['derived_scale']==.35
    c.program(a['action']['effects'],a['action']['selectors'],event='battle_start',phase='event',actor_ids=actor_ids)
    effect=next(e for s in skills.values() for e in s.get('effects',[]) if e.get('actor_definition_id')==a['id']);ticks=list(range(a['action']['interval_ms'],effect['duration_ms'],a['action']['interval_ms']));assert ticks==([1000,2000,3000,4000,5000,6000,7000,8000,9000] if a['id']=='hell_plant' else [1000,2000,3000,4000,5000,6000])
    return {'max_owned':effect['max_owned'],'tick_times_ms':ticks,'owner_death':'remove','bounded':'oldest replaced atomically; no hit-trigger actor spawning'}
   check('actor_'+a['id'],['AC-03','AC-04'],actor)
 if root=='thief':
  for cp in data['copy_whitelist']:
   def copied(cp=cp):
    source=next(s for s in load(D/f"skills/{cp['source_root']}.json")['skills'] if s['id']==cp['source_skill_id']);copy=skills[cp['skill_id']]
    assert copy['effects']==source['effects'] and copy['cost']['sp']==ceil(source['cost']['sp']*cp['sp_multiplier']);assert source['kind']=='active';assert not any(e['type'] in ['handler','summon'] for e in copy['effects']);assert not source['id'].startswith('rogue_copy_');return {'source':source['id'],'sp':copy['cost']['sp'],'one_slot':True}
   check('whitelist_'+cp['skill_id'],['AC-03'],copied)
 # Hand arithmetic for conserved routing is needed before engine implementation.
 if root=='swordsman':
  for cid,p,ratios,expected in [('redirect_30_percent',100,[.3],(30,70)),('redirect_overlap',100,[.6,.6],(100,0)),('redirect_rounding',7,[.3],(2,5))]:
   def route(p=p,ratios=ratios,expected=expected):
    moved=min(p,int(p*sum(ratios)));left=p-moved;assert (moved,left)==expected and moved+left==p;return {'transfer':moved,'original_target':left,'sum':p,'passes':1}
   check(cid,['AC-03','AC-04'],route)
 passed=all(r['passed'] for r in rows)
 inputs=[path,D/f'presentations/{root}.json',D/'class-status-effects.json',D/'combat-rules.json',Path(__file__)]
 if root=='merchant':inputs.append(D/'summon-actors.json')
 report={'task_id':'TASK-'+TASKS[root],'reviewer':'Codex self-review','review_round':2 if (R/f'plan/evidence/task-{TASKS[root]}-review-round1.json').exists() else 1,'review_date':'2026-10-19','scope':'M0 schemas/all skill levels/upgrade budgets/unbuffed queue estimates/local asset metadata; not battle simulation',
 'input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed,'skill_count':len(skills),'build_count':len(data['builds']),
 'manual_review':{'queue':'No per-slot hold conditions; start costs and snapshot follow baseline15/16. Four distinct active skills; passive triggers are not extra skill casts.','class_identity':'Build role labels and effects distinguish damage/support/control/guard; actual dominance waits for matched-seed runtime analysis.','assets':'Icon sidecars/payloads and selected prepared recipes resolve locally; visual adaptations explicitly labeled.','limits':'These are release selections, not every skill from the original RO client; no Hi-class prerequisite.'}}
 (R/f"plan/evidence/task-{TASKS[root]}-review.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 return {'root':root,'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--root',choices=TASKS);args=parser.parse_args();roots=[args.root] if args.root else [r for r in TASKS if (D/f'skills/{r}.json').exists()];results=[review(root) for root in roots];print(json.dumps(results,ensure_ascii=False,indent=2));raise SystemExit(0 if all(r['passed'] for r in results) else 1)

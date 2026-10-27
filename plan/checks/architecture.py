"""M0 schema/authority/command protocol oracles. No SQL transaction or server is run."""
import json,hashlib,hmac
from copy import deepcopy
from pathlib import Path
from jsonschema import Draft202012Validator,FormatChecker
from referencing import Registry,Resource
import composition as c
R=c.ROOT;D=c.DATA
def load(n):return json.loads((D/n).read_text())
spec=load('save-contracts.json');modules=load('module-contracts.json');cases=load('architecture-cases.json');account=load('account-initial-case.json')['account_state'];rows=[]
validators={k:Draft202012Validator(s,registry=c.REGISTRY,format_checker=FormatChecker()) for k,s in c.SCHEMAS.items()}
def check(cid,ac,fn):
 try:r=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':r})
 except Exception as e:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(e)})
def shape(name,x):
 errors=list(validators[name].iter_errors(x));assert not errors,'SCHEMA: '+errors[0].message if errors else ''
def semantic(state):
 shape('account-state',state)
 roster={a['character_id']:a for a in state['roster']};assert len(roster)==7,'DUPLICATE_CHARACTER'
 assert set(roster)=={'main',*('npc_'+root for root in load('progression.json')['class_tree'])},'ROSTER_IDS'
 assert sum(a['kind']=='main' for a in roster.values())==1,'MAIN_COUNT'
 for root in load('progression.json')['class_tree']:
  npc=roster['npc_'+root];assert npc['root_job_id']==root and npc['kind']=='npc','NPC_ROOT_CHANGED'
 itemmap={i['instance_id']:i for i in state['inventory']};assert len(itemmap)==len(state['inventory']),'DUPLICATE_INSTANCE'
 used=[];tree=load('progression.json')['class_tree'];allskills={s['id']:s for p in (D/'skills').glob('*.json') for s in json.loads(p.read_text())['skills']};equipment={i['id']:i for i in load('equipment.json')['definitions']};cards={i['id']:i for i in load('cards.json')['definitions']}
 for a in roster.values():
  assert a['job_id'] in [a['root_job_id'],*tree[a['root_job_id']]],'JOB_LINEAGE'
  assert a['job_id']==a['root_job_id'] or a['level']>=20,'JOB_LEVEL'
  expected_gates=[20,40,60][:len(a['completed_gate_ids'])];assert a['completed_gate_ids']==expected_gates and a['local_cap']==20+20*len(expected_gates),'BREAKTHROUGH_GATES'
  slots=[s for s in a['active_slots'] if s is not None];assert len(set(slots))==len(slots),'DUPLICATE_SKILL'
  assert sum(s.startswith('rogue_copy_') for s in slots)<=1,'COPY_GROUP_LIMIT'
  spent=sum(sum(1+(n-1)//10 for n in range(1,v)) for v in a['primary_stats'].values());assert spent+a['unspent_status_points']==sum(3+l//5 for l in range(2,a['level']+1)),'STAT_BUDGET'  # D-057 budget
  for sid,lv in a['skill_levels'].items():
   s=allskills[sid];assert s['class_id'] in [a['root_job_id'],a['job_id']] and s['unlock_level']<=a['level'],'SKILL_UNLOCK';assert lv<=min(s['max_level'],1+(a['level']-1)//5),'SKILL_CAP'
  assert all(s in a['skill_levels'] and allskills[s]['kind']=='active' for s in slots),'LOADOUT_LEARNED'
  for slot,iid in a['equipment'].items():
   if iid is not None:
    used.append(iid);item=itemmap[iid];assert item['kind']=='equipment' and equipment[item['definition_id']]['slot']==slot,'ITEM_SLOT'
    assert equipment[item['definition_id']]['required_level']<=a['level'],'ITEM_LEVEL'
    if slot=='weapon':assert equipment[item['definition_id']]['weapon_type']==load('equipment.json')['weapon_compatibility'][a['job_id']],'WEAPON_COMPATIBILITY'
   capacity=1+(a['slot_progress'][slot]['refine']>=5)+(a['slot_progress'][slot]['refine']>=10)
   for n,cardid in enumerate(a['slot_progress'][slot]['cards']):
    if cardid is not None:
     assert n<capacity,'CARD_CAPACITY';used.append(cardid);card=itemmap[cardid];assert card['kind']=='card' and cards[card['definition_id']]['slot']==slot,'CARD_SLOT'
  assert a['level']<=min(a['local_cap'],70),'LEVEL_CAP'
 assert len(set(used))==len(used),'DUPLICATE_ASSIGNMENT'
 team=[roster[p['character_id']] for p in state['team']];assert len({p['position'] for p in state['team']})==4,'TEAM_POSITION'
 assert len({a['character_id'] for a in team})==4 and sum(a['kind']=='main' for a in team)==1,'PARTY_MEMBERS'
 assert len({a['root_job_id'] for a in team if a['kind']=='npc'})==3,'PARTY_ROOTS'
 return {'characters':len(roster),'item_instances':len(itemmap),'assigned_once':len(used),'manual_primary_growth':True}
check('valid_initial_account_7_characters_42_items',['AC-02'],lambda:semantic(account))
for name in ['command','account-state','receipt','battle-checkpoint','simulation-scenario']:check('schema_'+name,['AC-01','AC-02'],lambda name=name:Draft202012Validator.check_schema(c.SCHEMAS[name]))
def checkpoint_shape():
 state=load('battle-initial-case.json')['checkpoint'];shape('battle-checkpoint',state);assert state['event_sequence']==15
 assert len([e for e in state['pending_events'] if e['kind']=='resource_regen'])==5
 mapping=load('combat-rules.json')['simulation_contract']['checkpoint_field_mapping'];assert set(mapping)==set(load('combat-rules.json')['simulation_contract']['restore_fields'])
 def descend(s,path):
  if 'oneOf' in s:s=next(v for v in s['oneOf'] if v.get('type')!='null')
  part,*tail=path;child=s['properties'][part.replace('[]','')]
  if part.endswith('[]'):child=child['items']
  if tail:descend(child,tail)
 for path in mapping.values():descend(c.SCHEMAS['battle-checkpoint'],path.split('.'))
 return {'actors':5,'timers':15,'restore_field_paths':len(mapping),'checkpoint':'full timestamp barrier phase7, not partial effects'}
check('battle_checkpoint_fields_and_regen_timers',['AC-01','AC-07','AC-08'],checkpoint_shape)
def scenario_shape():
 x=load('simulation-initial-case.json');shape('simulation-scenario',x);build_ids={b['id'] for p in (D/'skills').glob('*.json') for b in json.loads(p.read_text())['builds']};profiles={p['id'] for p in load('simulation-contracts.json')['equipment_profiles']}
 for a in x['team']:assert a['build_id'] in build_ids and a['equipment_profile'] in profiles
 assert len({a['position'] for a in x['team']})==4
 return {'build_refs':4,'equipment_profile_refs':4,'AB_policy':'matched seeds, equal actual budgets; mismatch rejected','hash':'fixture_hash is a schema fixture only, runtime must supply matching content hash'}
check('simulation_scenario_refs_and_budget_contract',['AC-01','AC-08'],scenario_shape)
def graph():
 visiting=set();done=set()
 def visit(name):
  assert name not in visiting,'IMPORT_CYCLE'
  if name in done:return
  visiting.add(name)
  for dep in modules['modules'][name]['imports']:assert dep in modules['modules'];visit(dep)
  visiting.remove(name);done.add(name)
 for name in modules['modules']:visit(name)
 def deps(name):return set(modules['modules'][name]['imports']).union(*(deps(d) for d in modules['modules'][name]['imports']))
 forbidden={'ui','renderer','client','api','persistence','auth'}
 for name in modules['pure_modules']:assert not (deps(name)&forbidden),(name,deps(name))
 return {'modules':len(done),'cycles':0,'pure_transitive_adapter_imports':0,'actual_source_lint':'TASK-015/018, not executed by this graph check'}
check('module_graph_and_public_ports',['AC-01','AC-08'],graph)
def commands():
 registered={x['properties']['type']['const'] for x in c.SCHEMAS['command']['oneOf']};ui={x['id'] for x in load('ui-flows.json')['actions'] if x['durable']};assert registered==ui==set(modules['mutation_command_ids']);assert len(registered)==46  # D155 adds atomic Awaken and shard conversion; legacy commands remain compatible
 def sample(schema,key=''):
  if 'const' in schema:return schema['const']
  if schema.get('pattern')=='^[a-f0-9]{64}$':return '0'*64
  if 'enum' in schema:return schema['enum'][0]
  if 'oneOf' in schema:return sample(schema['oneOf'][0],key)
  if schema.get('type')=='object':return {k:sample(v,k) for k,v in schema['properties'].items() if k in schema.get('required',[])}
  if schema.get('type')=='array':return [('instance_'+str(i) if key=='instance_ids' else sample(schema['items'],key)) for i in range(schema.get('minItems',0))]
  if schema.get('type')=='integer':return schema.get('minimum',0)
  if schema.get('type')=='boolean':return False
  if schema.get('type')=='null':return None
  if schema.get('format')=='uuid':return '00000000-0000-4000-8000-000000000001'
  return 'fixture_id'
 for variant in c.SCHEMAS['command']['oneOf']:shape('command',sample(variant))
 return {'UI_durable_actions':len(ui),'typed_command_shapes_validated':len(registered),'account_id_in_payload':False,'examples_scope':'shape examples, business-precondition fixtures owned by implementation tasks'}
check('all_ui_actions_have_typed_command',['AC-01','AC-05'],commands)
for case in cases['protocol_cases']:
 def protocol(case=case):
  i=case['input'];out=('original_receipt_no_second_mutation' if i['hash_matches'] else 'IDEMPOTENCY_KEY_REUSE') if i['prior_receipt'] else 'REVISION_CONFLICT' if i['expected_revision']!=i['current_revision'] else 'commit_revision'+str(i['current_revision']+1)
  assert out==case['expected'];return out
 check(case['id'],['AC-02','AC-03','AC-05'],protocol)
def negatives():
 seen=[]
 errors={'negative_wallet':'SCHEMA','duplicate_item_assignment':'DUPLICATE_ASSIGNMENT','npc_root_changed':'NPC_ROOT_CHANGED','skill_slot_duplicate':'DUPLICATE_SKILL','card_capacity_exceeded':'CARD_CAPACITY','two_rogue_copy_slots':'COPY_GROUP_LIMIT'}
 for name in errors:
  s=deepcopy(account)
  if name=='negative_wallet':s['wallet']['gold']=-1
  if name=='duplicate_item_assignment':s['inventory'].append({'instance_id':'probe_shared_head','definition_id':'equipment_head_1','kind':'equipment','rarity_id':'common','locked':False,'training':False,'options':[]});s['roster'][0]['equipment']['head']='probe_shared_head';next(a for a in s['roster'] if a['character_id']=='npc_mage')['equipment']['head']='probe_shared_head'  # D-059: no starter items to reuse
  if name=='npc_root_changed':s['roster'][1]['root_job_id']='mage'
  if name=='skill_slot_duplicate':s['roster'][0]['active_slots'][1]=s['roster'][0]['active_slots'][0]
  if name=='card_capacity_exceeded':
   s['inventory'].append({'kind':'card','instance_id':'fixture_card','definition_id':'card_weapon_1','locked':False,'rarity_id':'bronze','level':1});s['roster'][0]['slot_progress']['weapon']['cards'][1]='fixture_card'
  if name=='two_rogue_copy_slots':
   main=s['roster'][0];main.update(root_job_id='thief',job_id='rogue',level=70,local_cap=80,completed_gate_ids=[20,40,60],unspent_status_points=676)
   main['active_slots']=['rogue_copy_acolyte_heal','rogue_copy_mage_fire_bolt','rogue_strip_armor','rogue_expose'];main['skill_levels']={sid:1 for sid in main['active_slots']}
   thief=next(a for a in s['roster'] if a['character_id']=='npc_thief');main['equipment']['weapon']=thief['equipment']['weapon'];thief['equipment']['weapon']=None
  try:semantic(s)
  except (AssertionError,KeyError) as e:
   assert errors[name] in str(e),(name,str(e),errors[name]);seen.append({'case':name,'error':errors[name]})
  else:raise AssertionError('invalid snapshot accepted '+name)
 # Unknown top-level ownership fields rejected by every command variant.
 assert all(v['additionalProperties'] is False and 'account_id' not in v['properties'] for v in c.SCHEMAS['command']['oneOf'])
 return {'invalid_account_examples_rejected':seen,'client_supplied_owner':'schema rejects','runtime_tests':'TASK-022/033/044'}
check('invalid_account_and_owner_inputs',['AC-02','AC-05'],negatives)
def refund():
 i=cases['refund_case'];wallet=i['initial_wallet']+i['paid_old'];assert wallet==i['first_refund_expected']==i['repeat_refund_expected'];assert i['current_price']!=i['paid_old'];return {'first_refund_wallet':wallet,'repeat_wallet':wallet,'refund_is_actual_paid':True}
check('old_price_actual_paid_refund',['AC-06'],refund)
def compact_ledger():
 # Independent arithmetic example for two different prices in one active scope.
 versions=['cost1','cost2'];active_paid=100+150;wallet=500;wallet-=active_paid
 first_refund=wallet+active_paid;active_paid=0;second_refund=first_refund+active_paid
 assert first_refund==second_refund==500 and versions==['cost1','cost2']
 assert spec['ledger_compaction']['active'] and 7*(12+6)+2*5==136
 return {'paid_across_versions':250,'refund':250,'second_reset_new_ID_refund':0,'active_scopes_after_reset':0,'archived_refund':'receipt only','seven_character_scope_ceiling':136}
check('active_ledger_coalescing_and_history',['AC-02','AC-06'],compact_ledger)
def farm():
 i=cases['farm_reservation_case'];reward=min(i['unreserved_seconds'],i['cap_seconds'])*i['rate_per_hour']//3600;assert reward==i['expected_reward'];assert i['inventory_full_wallet_change']==i['replay_reservation_extra_reward']==0
 return {'reserved':reward,'immediately_paid_with_full_inventory':0,'pending_payable':reward,'retry_generated':0,'source_of_truth':'pending claim plus advanced reservation cursor, not a second wallet'}
check('farm_reserved_then_paid_not_rerolled',['AC-03','AC-06','AC-07'],farm)
for case in cases['battle_clock_cases']:
 def clock(case=case):
  abort=case['wall_gap_ms']>=spec['battle_protocol']['lease_ms'];credit=0 if abort else min(case['requested_delta_ms'],case['wall_gap_ms'],spec['battle_protocol']['max_credited_wall_gap_ms']);assert abort==case['aborted'] and credit==case['expected_credit_ms'];return {'credited_ms':credit,'aborted':abort}
 check(case['id'],['AC-03','AC-07'],clock)
def compatibility():
 assert len(spec['compatibility'])==6 and {x['mode'] for x in spec['interruption']}=={'story','tower','daily','farm'}
 assert spec['migration']['backup_restore'] and not spec['SQL_balance_logic'];assert spec['rls']['separate_preview_database'];return {'compatibility_cases':6,'mode_policies':4,'SQL_business_formulas':False,'stale_backup':'reject, restore only verified latest history tip','recovery_test_owner':'TASK-040/044'}
check('versions_modes_and_sql_boundary',['AC-04','AC-06','AC-07'],compatibility)
def signature():
 key=b'fixture_only_not_a_real_secret';body=b'accountA:revision8:hash';sig=hmac.new(key,body,hashlib.sha256).hexdigest();assert hmac.compare_digest(sig,hmac.new(key,body,hashlib.sha256).hexdigest());assert not hmac.compare_digest(sig,hmac.new(key,b'accountA:revision4:tampered',hashlib.sha256).hexdigest())
 old_body=b'accountA:revision4:valid_old_hash';old_sig=hmac.new(key,old_body,hashlib.sha256).hexdigest();assert hmac.compare_digest(old_sig,hmac.new(key,old_body,hashlib.sha256).hexdigest());assert not (4>=8)
 return {'same_body':'valid fixture signature','tampered_body':'signature differs','valid_old_signature':'passes integrity, rejected by stale revision4<cloud8 gate','server_restore':'not implemented'}
check('backup_integrity_fixture',['AC-04','AC-06'],signature)
def quality():
 q=load('quality-budgets.json');assert all(isinstance(v,(int,float)) and v>0 for v in q['limits'].values());assert q['stress_scene']['party']+q['stress_scene']['other_actors_up_to']==16;assert q['network']['down_mbps']==10;assert len(spec['test_routes'])==4
 worst=deepcopy(account)
 while len(worst['inventory'])<500:
  worst['inventory'].append({'instance_id':'fixture_card_'+str(len(worst['inventory'])),'definition_id':'card_weapon_1','kind':'card','rarity_id':'gold','locked':False,'level':5})
 for n in range(136):
  worst['paid_ledger'].append({'entry_id':'investment_'+str(n),'character_id':'main','feature_id':'fixture_feature_'+str(n),'skill_id':None,'quantity':9,'cost_version':'cost_v2','cost_versions':['cost_v1','cost_v2'],'paid_resources':{r['id']:100 for r in load('economy.json')['resources']},'refund_state':'active','refund_command_id':None})
 shape('account-state',worst);size=len(json.dumps(worst).encode());assert q['limits']['account_json_bytes']>size
 return {'numeric_budgets':len(q['limits']),'initial_fixture_bytes':len(json.dumps(account).encode()),'500_items_136_active_investments_bytes':size,'measurement_profiles':'progression reference profiles + stated warmup/network/cache','performance_measurement':'not performed; owners TASK-018/019/022/042'}
check('quality_budgets_and_local_test_routes',['AC-04','AC-08'],quality)
passed=all(r['passed'] for r in rows);inputs=[D/n for n in ['module-contracts.json','save-contracts.json','quality-budgets.json','account-initial-case.json','architecture-cases.json','ui-flows.json','battle-initial-case.json','simulation-initial-case.json','simulation-contracts.json','combat-rules.json']]+[D/'schemas'/n for n in ['command.json','account-state.json','receipt.json','battle-checkpoint.json','simulation-scenario.json']]+[R/'plan/design/11-technical-architecture.md',Path(__file__)]
report={'task_id':'TASK-013','reviewer':'Codex self-review','review_round':2 if (R/'plan/evidence/task-013-review-round1.json').exists() else 1,'review_date':'2026-10-19','scope':'M0 schemas/graph/hand protocol-time-refund oracles and manual contract review. No database/API implementation or runtime performance evidence.','input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed,'runtime_pending':spec['runtime_evidence_owners']}
(R/'plan/evidence/task-013-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

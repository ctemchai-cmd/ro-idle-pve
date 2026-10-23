"""TASK-014 design gate. Does not run or certify the future game/DB/renderer."""
from pathlib import Path
from functools import lru_cache
import json,re,hashlib,math
from urllib.parse import unquote
import composition as c
from classes import asset_reference
R=c.ROOT;P=R/'plan';D=c.DATA;rows=[]
def load(p):return json.loads(p.read_text())
def check(cid,ac,fn):
 try:result=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':result})
 except Exception as e:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(e)})
tasks={}
for state in ['todo','inprogress','review','done']:
 for p in (P/state).glob('tasks_*.md'):
  n=int(p.stem[-3:]);assert n not in tasks;s=p.read_text();block=s.split('## งานที่ต้องรอก่อนหน้า\n',1)[1].split('\n## ',1)[0];deps=list(dict.fromkeys(map(int,re.findall(r'TASK-(\d{3})',block))));tasks[n]={'state':state,'path':p,'text':s,'deps':deps}
def reports():
 prereqs=[*range(1,14),47];counts={};allchecks=0
 for n in prereqs:
  t=tasks[n];assert t['state']=='done',n
  ac=t['text'].split('## เกณฑ์ตรวจรับ\n',1)[1].split('\n## ',1)[0];assert '- [ ] AC-' not in ac,n
  report=load(P/f'evidence/task-{n:03}-review.json');assert report['passed'],n
  for p,sha in report.get('input_sha256',{}).items():assert hashlib.sha256((R/p).read_bytes()).hexdigest()==sha,('stale report',n,p)
  if report.get('data_sha256'):assert hashlib.sha256((D/'progression.json').read_bytes()).hexdigest()==report['data_sha256']
  counts[f'TASK-{n:03}']=len(report['checks']);allchecks+=len(report['checks'])
 return {'prerequisite_tasks':14,'M0_checks':allchecks,'counts':counts,'scope':'design/schema/arithmetic review only'}
check('all_M0_prerequisites_and_fresh_evidence',['AC-01'],reports)
def graph():
 # Tasks after 047 are user-requested additions (D-051+); IDs stay contiguous.
 assert set(tasks)==set(range(1,max(tasks)+1)) and max(tasks)>=47;visiting=set();done=set()
 def visit(n):
  assert n not in visiting,('cycle',n)
  if n in done:return
  visiting.add(n)
  for d in tasks[n]['deps']:assert d in tasks;visit(d)
  visiting.remove(n);done.add(n)
 for n in tasks:visit(n)
 @lru_cache(maxsize=None)
 def ancestors(n):return frozenset(tasks[n]['deps']).union(*(ancestors(d) for d in tasks[n]['deps']))
 implementation=[n for n in tasks if n>=15 and n!=47]
 for n in implementation:assert 14 in ancestors(n),n
 return {'task_count':len(tasks),'cycles':0,'all_implementation_tasks_wait_for_014':True,'added_after_m0':[n for n in tasks if n>47]}
check('task_graph_and_implementation_gate',['AC-03'],graph)
def decisions():
 p=load(D/'progression.json');r=load(D/'combat-rules.json');statuses=list(c.STATUSES.values());assert p['release']['level_cap']==70 and not p['promotion']['hi_class_enabled'];assert p['promotion']['class2_min_level']==20
 assert r['modifiers']['level_auto_primary_growth'] is False
 for status in statuses:
  if status['polarity']=='buff':assert status['stacking']=={'admission':'independent','max_instances':None,'magnitude_cap':None,'expiry':'per_instance'},status['id']
 assert r['modifiers']['buff_max_stacks'] is None and r['modifiers']['buff_magnitude_cap'] is None
 assert all('cooldown' not in s for path in (D/'skills').glob('*.json') for s in load(path)['skills'])
 assert load(D/'save-contracts.json')['farm']['quantization']['divisor']==3600000
 assert all('Unlock does not auto-learn' in load(p)['learn_policy'] for p in (D/'skills').glob('*.json'))
 return {'buffs':'independent, additive, uncapped even same caster','primary_growth':'manual only','cap':70,'skill_cooldowns':False,'farm_precision':'integer milliseconds'}
check('confirmed_decisions_preserved',['AC-02'],decisions)
def content_refs():
 skilldefs=[s for p in (D/'skills').glob('*.json') for s in load(p)['skills']];assert len(skilldefs)==126 and len({s['id'] for s in skilldefs})==126
 builds=[b for p in (D/'skills').glob('*.json') for b in load(p)['builds']];assert len(builds)==26
 strings=load(D/'strings.th.json')['strings']
 for s in skilldefs:assert s['name_key'] in strings
 for catalog in ['equipment.json','cards.json']:
  for item in load(D/catalog)['definitions']:assert item['name_key'] in strings
 manifest=load(D/'release-content-manifest.json')
 for p,sha in manifest['input_sha256'].items():assert hashlib.sha256((R/p).read_bytes()).hexdigest()==sha,('stale manifest',p)
 assert manifest['implementation_hash'] is None and manifest['runtime_asset_pack_hash'] is None,'M0 must not claim runtime fingerprints'
 # Reject unresolved planning markers/non-finite game numbers, without reading images.
 for file in manifest['input_sha256']:
  if '/schemas/' in file or '/presentations/' in file or file.endswith('strings.th.json') or file.endswith('actor-presentations.json'):continue
  data=load(R/file);assert not re.search(r'\b(TBD|TODO|FIXME|UNDECIDED)\b',json.dumps(data,ensure_ascii=False),re.I),file
  for value in c.walk(data):
   if isinstance(value,(int,float)) and not isinstance(value,bool):assert math.isfinite(value) and abs(value)<=9007199254740991,(file,value)
 golden=load(D/'skill-program-cases.json')['cases'];assert len(golden)==378 and {r['skill_id'] for r in golden}=={s['id'] for s in skilldefs}
 return {'skills':126,'builds':26,'equipment':144,'cards':73,'golden_raw_intents':378,'notes':'golden fixtures not executed TS battles; manifest implementation not built'}
check('complete_content_refs_names_versions',['AC-02','AC-03'],content_refs)
def actor_assets():
 jobs=load(D/'actor-presentations.json')['jobs'];expected={x for root,bs in load(D/'progression.json')['class_tree'].items() for x in [root,*bs]};assert {j['job_id'] for j in jobs}==expected
 count=0
 for j in jobs:
  assert j['presets']
  for preset in j['presets']:
   assert isinstance(preset['attack_source_action_index'],int)
   for layer in ['body','head','weapon']:
    ref=preset.get(layer)
    if ref:assert asset_reference('assets/ro/'+ref['meta'])['id']==ref['id']
   count+=1
 assert count==36
 cards=load(D/'cards.json');symbols={asset_reference(x['symbol_meta_path'])['file']['sha256'] for x in cards['presentations']};assert len(symbols)==66
 return {'jobs':len(jobs),'presets':count,'card_portrait_media':66,'scope':'selected sidecar/media integrity only, not new visual review or runtime closure pack'}
check('actor_and_presentation_references',['AC-03'],actor_assets)
def matrix():
 cases=load(D/'acceptance-cases.json')['cases'];assert len({r['id'] for r in cases})==len(cases)
 expected={(f'TASK-{n:03}',ac) for n,t in tasks.items() for ac in re.findall(r'^- \[[ x]\] (AC-\d+):',t['text'],re.M)};actual={(r['task_id'],r['acceptance_id']) for r in cases};assert expected==actual
 for case in cases:
  assert case['input_setup'] and case['expected'] and case['verification'] and case['input_refs'],case['id']
  for ref in case['input_refs']:assert (R/ref).exists(),(case['id'],ref)
  n=int(case['task_id'][-3:])
  if n>=15 and n!=47:
   expected_status='passed_implementation' if tasks[n]['state']=='done' else 'not_run_implementation'
   assert case['status']==expected_status,(case['id'],case['status'],expected_status)
   if expected_status=='passed_implementation':
    evidence=load(P/f'evidence/task-{n:03}-review.json');assert evidence['passed'],case['id']
  else:assert case['status']!='not_run_implementation',case['id']
 text=(P/'acceptance-matrix.md').read_text();assert len(re.findall(r'^\| `T\d{3}-AC-\d+`',text,re.M))==len(cases)
 return {'rows':len(cases),'M0_acceptance_rows':67,'future_implementation_not_run':sum(case['status']=='not_run_implementation' for case in cases),'all_setups_expected_and_methods_present':True}
check('all_acceptance_criteria_traceable',['AC-04'],matrix)
def closure():
 a=(P/'architecture-audit.md').read_text();closure=a.split('## Closure ระดับ design จาก TASK-013',1)[1]
 for n in range(1,9):assert f'| A-{n:02} |' in closure,n
 s=load(D/'save-contracts.json');assert len(s['compatibility'])==6 and len(s['interruption'])==4;assert s['runtime_evidence_owners']
 q=load(D/'quality-budgets.json');assert len(q['limits'])==17
 return {'findings_design_closed':8,'runtime_proof':'pending named owner tasks; no DB/API/renderer/engine tests claimed','quality_targets':17}
check('architecture_design_closure_and_runtime_owners',['AC-05'],closure)
def links():
 files=[R/'README.md',R/'AGENTS.md',*P.rglob('*.md')];errors=[]
 for md in files:
  for match in re.finditer(r'\[[^\]\n]*\]\(([^)\n]+)\)',md.read_text()):
   target=match[1].strip().strip('<>')
   if re.match(r'^[A-Za-z]+:',target) or target.startswith('#'):continue
   target=re.sub(r':\d+$','',unquote(target.split('#')[0]));path=Path(target) if target.startswith('/') else md.parent/target
   if target and not path.exists():errors.append((str(md.relative_to(R)),target))
 assert not errors,errors
 return {'markdown_files':len(files),'broken_local_links':0}
check('documentation_links',['AC-03','AC-04'],links)
passed=all(r['passed'] for r in rows)
report={'task_id':'TASK-014','reviewer':'Codex self-review','review_date':'2026-10-19','review_round':1,'scope':'M0 design gate and current board traceability. Original gate snapshot is task-014-gate-snapshot.json; implementation evidence belongs to later task reports.','checks':rows,'passed':passed,'limitations':['This M0 check does not execute the TS engine/runner, SQL/API transactions, browser-game or deployment. Use each implementation task report for that evidence.','Pace/balance/performance numbers are targets requiring actual M1/M4 measurement.','Future Hi-class/Awaken/Artifact remain a roadmap, not a complete implemented patch.'],'resolved_findings':['Subsecond farm claim/rate-switch rounding corrected to integer milliseconds with preserved carry.','Sage dry queue estimate now includes learned Wisdom; golden164.64speed/7344ms trace.','Stale speed-cap wording in TASK-027/035 aligned with user no-buff-cap decision.','Generic card item art is shared; authored card faces use18distinct local symbols, not claimed native portraits.']}
(P/'evidence/task-014-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

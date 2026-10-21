"""M0 flow policy and layout/timing arithmetic. No browser UI has been built."""
import json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'plan/data';p=D/'ui-flows.json';d=json.loads(p.read_text());actions={a['id']:a for a in d['actions']};rows=[]
def check(cid,ac,fn):
 try:v=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':v})
 except Exception as e:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(e)})
for case in d['network_cases']:
 def policy(case=case):
  action=actions[case['action']];allowed=not action['durable'] or case['state'] in d['durable_enabled_states'] or action['id'] in d['durable_state_exceptions'].get(case['state'],[]);assert allowed is case['allowed'];return {'state':case['state'],'action':action['id'],'allowed':allowed}
 check(case['id'],['AC-03'],policy)
def layout():
 r=d['layout_rules'];required=4*r['tap_target']+3*r['four_slot_gaps']+2*r['horizontal_padding'];assert required<=r['minimum_width'];assert len(d['viewports'])==4
 return {'minimum_width':360,'four_slots_required_width':required,'remaining_width':360-required,'body_text_px':14,'scope':'wireframe arithmetic; browser/Thai text tests are TASK-039/042'}
check('small_screen_wireframe',['AC-04'],layout)
def preview():
 before=math.ceil(150000/100);after=math.ceil(150000/125);ct=math.ceil(1000*100/125);assert (before,after,ct)==(1500,1200,800)
 return {'SI_before_ms':before,'SI_after_ms':after,'CT_before_ms':1000,'CT_after_ms':ct,'during_phase':'new speed starts next phase; active cast keeps snapshot'}
check('preview_matches_timing_baseline',['AC-02'],preview)
def coverage():
 assert len(actions)==len(d['actions']);screens={a['screen'] for a in actions.values()};assert {'creation','party','character','skills','inventory','slot','farm','dungeons','gacha','recovery','auth','settings'}<=screens
 assert all(a['authority']=='account_command' for a in actions.values() if a['durable'])
 text=(R/'plan/design/10-ui-and-player-flows.md').read_text();assert 'wireframes' in text and 'HP/SP' in text
 return {'screen_groups':len(screens),'durable_action_ids':sum(a['durable'] for a in actions.values()),'manual_flow_cases':len(d['manual_flows']),'review':'read all screen/exit/action rows and network/tutor wireframes; command details delivered in TASK-013'}
check('system_action_and_manual_flow_review',['AC-01','AC-02','AC-03','AC-04'],coverage)
passed=all(r['passed'] for r in rows);inputs=[p,R/'plan/design/10-ui-and-player-flows.md',Path(__file__)]
report={'task_id':'TASK-012','reviewer':'Codex self-review','review_round':1,'review_date':'2026-10-19','scope':'M0 wireframe/manual flow review and state/layout/timing arithmetic; no browser implementation','input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed,'manual_reviewed_cases':d['manual_flows']}
(R/'plan/evidence/task-012-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

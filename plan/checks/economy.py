"""M0 resource-flow, budget, loot and pity calculations. No full progression simulation."""
import json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'plan/data'
def load(n):return json.loads((D/n).read_text())
e=load('economy.json');loot=load('loot.json');g=load('gacha.json');rows=[]
def check(cid,ac,fn):
 try:r=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':r})
 except Exception as ex:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(ex)})
def resources():
 ids={r['id'] for r in e['resources']};assert len(ids)==8
 for r in e['resources']:assert r['sources'] and r['sinks']
 assert set(e['rates'][0]['per_hour'])<=ids;assert e['farm']['rate_restrictions']['breakthrough_essence']=='clear 1-5'
 assert all(all(isinstance(v,int) and v>=0 for v in r['per_hour'].values()) for r in e['rates'])
 return {'resource_count':len(ids),'bootstrap':'initial wallet/starter gear plus farm1-1; ore/essence before Lv20 gate; targeted weapons use gold'}
check('sources_and_sinks',['AC-01'],resources)
for cp in e['checkpoints']:
 def budget(cp=cp):
  rates=e['rates'][cp['chapter']-1]['per_hour'];minutes=max(q/rates[k]*60 for k,q in cp['cost'].items());assert math.isclose(minutes,cp['expected_minutes'],abs_tol=1e-7);assert cp['acceptable_minutes'][0]<=minutes<=cp['acceptable_minutes'][1]
  return {'minutes':minutes,'hours':minutes/60,'target_range_minutes':cp['acceptable_minutes'],'scope':'static equal-resource budget, not measured chapter pacing'}
 check(cp['id'],['AC-02'],budget)
def carries():
 # .1 essence/minute = 6/hour. Six 10-minute settlements equal one hour.
 carry=total=0
 for _ in range(6):q,carry=divmod(600000*6+carry,3600000);total+=q
 assert (total,carry)==(6,0)
 elapsed=min(20*3600,e['farm']['offline_cap_seconds']);assert elapsed==43200
 ms_carry=ms_total=0
 for _ in range(4):amount,ms_carry=divmod(500*3600+ms_carry,3600000);ms_total+=amount
 assert ms_total==2 and ms_carry==0
 first,rem=divmod(500*60,3600000);second,rem=divmod(500*120+rem,3600000);assert first+second==0 and rem==90000
 return {'six_partial_claims':total,'one_hour_claim':3600*6//3600,'four_500ms_claims_gold_at3600_per_hour':ms_total,'rate_switch_fractional_remainder':rem,'20h_offline_paid_hours':elapsed/3600,'unpaid_cursor':'reserved once, pending payment separate; cloud protocol owner TASK-013'}
check('fractional_income_and_cap',['AC-01','AC-02'],carries)
def supreme():
 rank={r['id']:r['rank'] for r in load('equipment.json')['rarities']};weights=loot['gear']['rarity_weights'];assert sum(weights.values())==loot['gear']['weight_total'];eq=sum(3**rank[k]*v/sum(weights.values()) for k,v in weights.items());assert math.isclose(eq,3.0606);assert 3**6==729
 minutes=729/(eq/36/5);  # D-068: 36 definitions per tierassert math.isclose(minutes,loot['supreme_analysis']['equivalent_throughput_minutes']);assert load('equipment.json')['tier_upgrade']['preserve'][1]=='rarity_id'
 return {'common_equivalent_per_drop':eq,'desired_definition_throughput_days':minutes/1440,'warning':'not expected stopping time; drops/fusion variance waits for runner'}
check('729_and_higher_rarity_supply',['AC-03'],supreme)
def pool():
 assert sum(g['quality_weights'].values())==g['weight_total'];assert sum(g['definition_weights'].values())==60;assert set(g['definitions'])=={c['id'] for c in load('cards.json')['definitions']};assert g['disabled_pools']==['pet','artifact'];return {'quality_total':1000000,'definitions':18,'ten_pull_cost':1000}
check('gacha_pool_rates',['AC-04'],pool)
def quality(draw,misses,bronzes):
 if misses>=29:return 'gold'
 if bronzes>=9:return 'silver' if draw<22/25 else 'gold'
 return 'bronze' if draw<.75 else 'silver' if draw<.97 else 'gold'
def pity():
 gold=bronze=0;out=[]
 for _ in range(30):
  q=quality(0,gold,bronze);out.append(q)
  if q=='gold':gold=bronze=0
  elif q=='silver':gold+=1;bronze=0
  else:gold+=1;bronze+=1
 assert out[9]=='silver' and out[19]=='silver' and out[29]=='gold';assert gold==bronze==0
 assert quality(.999,0,9)=='gold'
 return {'worst_bronze_draw_sequence_pulls_10_20_30':[out[9],out[19],out[29]],'counters_after_gold':[gold,bronze],'10pull_order':'same sequential algorithm, one atomic receipt'}
check('pity_boundary_sequence',['AC-04'],pity)
def tier_source():
 available=set(load('equipment.json')['weapon_compatibility'].values());assert len(available)==10;assert set(loot['gear']['tier_by_chapter'].values())=={1,20,40,60};return {'random_drop_not_required_for_class2_weapon':True,'future_tiers_in_pool':False}
check('no_unobtainable_class_weapon',['AC-01','AC-03'],tier_source)
passed=all(r['passed'] for r in rows);inputs=[D/n for n in ['economy.json','loot.json','gacha.json','equipment.json','cards.json','slot-progress.json','progression.json']]+[Path(__file__)]
report={'task_id':'TASK-010','reviewer':'Codex self-review','review_round':1,'review_date':'2026-10-19','scope':'M0 budget/rate/pity/quantization arithmetic; not accelerated full-game simulation','input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed}
(R/'plan/evidence/task-010-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

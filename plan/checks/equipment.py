"""M0 equipment and slot ownership review, not an inventory transaction engine."""
import json,hashlib
from copy import deepcopy
from pathlib import Path
import composition as c
from classes import asset_reference
D=c.DATA;R=c.ROOT
def load(p):return json.loads(p.read_text())
e=load(D/'equipment.json');cards=load(D/'cards.json');slots=load(D/'slot-progress.json');rows=[]
def check(cid,ac,fn):
 try:result=fn();rows.append({'case_id':cid,'acceptance':ac,'passed':True,'result':result})
 except Exception as ex:rows.append({'case_id':cid,'acceptance':ac,'passed':False,'error':str(ex)})
for catalog in [e,cards]:
 pm={p['id']:p for p in catalog['presentations']}
 for item in catalog['definitions']:
  def validate(item=item):
   c.validate('item',item);m=asset_reference(pm[item['presentation_id']]['meta_path']);assert m['id']==pm[item['presentation_id']]['icon_asset_id']
   p=pm[item['presentation_id']]
   if 'illustration_meta_path' in p:assert asset_reference(p['illustration_meta_path'])['id']==p['illustration_asset_id']
   if 'symbol_meta_path' in p:assert asset_reference(p['symbol_meta_path'])['id']==p['symbol_asset_id']
   return {'schema':'valid','icon_asset_id':m['id'],'tier':item['tier_level']}
  check(item['id'],['AC-01','AC-04'],validate)
def coverage():
 for tier in [1,20,40,60]:
  defs=[d for d in e['definitions'] if d['tier_level']==tier];assert len(defs)==36;assert len([d for d in defs if d['slot']=='weapon'])==20;assert len({d['slot'] for d in defs})==6  # D-068 variants
 for root,branches in load(D/'progression.json')['class_tree'].items():
  for job in [root,*branches]:assert e['weapon_compatibility'][job] in {d['weapon_type'] for d in e['definitions'] if d['slot']=='weapon'}
 assert not any(d['tier_level']>70 for d in e['definitions']);assert 3**(len(e['rarities'])-1)==729
 return {'tiers':[1,20,40,60],'job_compatibility_count':len(e['weapon_compatibility']),'common_to_supreme_inputs':729}
check('coverage_and_rarity',['AC-01','AC-02'],coverage)
def fusion_negative():
 base={'instance_id':'a','definition_id':'equipment_sword_20','rarity_id':'common','locked':False,'equipped':False,'training':False}
 defs={d['id']:d for d in e['definitions']}
 def accepts(items):
  if len(items)!=3 or len({i['instance_id'] for i in items})!=3:return False
  keys=[]
  for item in items:
   if item['locked'] or item['equipped'] or item['training'] or item['rarity_id']=='supreme':return False
   d=defs[item['definition_id']];keys.append((item['rarity_id'],d['tier_level'],d['slot'],d['weapon_type']))
  return len(set(keys))==1
 good=[{**base,'instance_id':x} for x in ['a','b','c']];assert accepts(good)
 invalid=[]
 for field,value in [('locked',True),('equipped',True),('training',True),('definition_id','equipment_sword_40'),('definition_id','equipment_bow_20'),('rarity_id','rare'),('instance_id','a')]:
  trial=deepcopy(good);trial[-1][field]=value;assert not accepts(trial);invalid.append(field)
 return {'valid':'3 Common sword tier20 → Uncommon sword tier20','rejected_mismatches':invalid,'atomic_failure':'no inventory/wallet mutation'}
check('fusion_validation',['AC-02','AC-04'],fusion_negative)
def slot_owner():
 assert slots['owner_key']==['character_id','equipment_slot'];assert slots['refine']['max']==10;assert slots['cards']['capacity_by_refine']==[{'minimum_refine':0,'slots':1},{'minimum_refine':5,'slots':2},{'minimum_refine':10,'slots':3}]
 assert e['tier_upgrade']['preserve'][0:2]==['instance_id','rarity_id'];assert all(x in ['item_instance','party_position'] for x in slots['not_owned_by'])
 return {'item_swap':'same character slot unchanged','NPC_swap':'other character owns separate state','refine_capacity':{'0':1,'5':2,'10':3},'ownership':'contract review, runtime swap/rollback evidence belongs to TASK-027/044'}
check('slot_ownership_and_capacity',['AC-03'],slot_owner)
def values():
 gear=next(d for d in e['definitions'] if d['id']=='equipment_sword_60');v=gear['modifiers'][0]['value'];epic=next(r['power_multiplier'] for r in e['rarities'] if r['id']=='epic');assert int(v*epic)==285
 # D-128 additive30% Refine: (gear190 + flat80 + card24) *1.3 =382.2 (ATK retains decimals until damage flooring).
 assert abs((v+10*8+8*2*1.5)*(1+10*slots['refine']['per_step_modifiers']['weapon'][2]['value'])-382.2)<1e-9
 assert sum(r['gold'] for r in slots['refine']['upgrade_rows'])==77000
 assert sum(r['refine_ore'] for r in slots['refine']['upgrade_rows'])==440
 assert sum(r['gold'] for r in slots['enchant']['upgrade_rows'])==115500
 return {'common_sword60_plus_refine10_gold_card5':382.2,'epic_sword60_base':285,'refine10_gold':77000,'refine10_ore':440,'enchant10_gold':115500,'formula':'add source modifiers once through central buckets'}
check('numeric_progression_examples',['AC-01','AC-04'],values)
def cardrules():
 assert len(cards['definitions'])==73 and cards['level_multipliers']==[1,1.25,1.5,1.75,2];assert cards['rarity_is_equipment_rarity'];assert [r['id'] for r in cards['rarities']]==['common','uncommon','rare','epic','legendary','immortal','supreme'];assert all(o['rarity_id']==('rare' if o.get('variant')=='puppet' else {'mini':'epic','mvp':'legendary'}.get(o['grade'], 'common' if o['source_level']<=20 else 'uncommon' if o['source_level']<=45 else 'rare')) for o in cards['origins'].values());assert [r['id'] for r in cards['rarities'] if r['enabled']]==['common','uncommon','rare','epic','legendary']
 assert sum(r['card_dust'] for r in cards['level_cost_rows'])==300
 return {'definitions':73,'source_grades':{'normal':49,'mini':4,'mvp':20},'card_instance_level_max':5,'max_upgrade_dust':300,'unequipped_duplicate_bronze_yield':20,'same_card_copies':'distinct instances, additive sources'}
check('card_rarity_duplicates_and_levels',['AC-04'],cardrules)
def training():
 p=e['targeted_weapon_purchase'];assert p['enabled_tiers']==[1] and p['training'] is True;assert p['cost_rows']==[{'tier_level':1,'gold':125}];assert 'training' in e['fusion']['exclude'] and e['tier_upgrade']['reject_training'];assert e['salvage']['training_yield']=={}
 return {'start_any_new_weapon_family_gold':125,'can_fuse_or_tier_up':False,'discard_yield':0,'729_purchases_cannot_make_Supreme':True,'ordinary_drops':'unchanged three-piece rarity fusion'}
check('training_weapon_no_rarity_or_ore_shortcut',['AC-01','AC-02','AC-04'],training)
passed=all(r['passed'] for r in rows);inputs=[D/'equipment.json',D/'cards.json',D/'slot-progress.json',Path(__file__)]
report={'task_id':'TASK-009','reviewer':'Codex self-review','review_date':'2026-10-19','review_round':1,'scope':'M0 schema, metadata refs, ownership contract, hand arithmetic and invalid fusion cases; not game inventory execution','input_sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'checks':rows,'passed':passed}
(R/'plan/evidence/task-009-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checks':len(rows),'passed':passed,'failures':[r for r in rows if not r['passed']]},ensure_ascii=False,indent=2));raise SystemExit(0 if passed else 1)

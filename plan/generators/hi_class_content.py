"""TASK123 authored Hi-class extension. Stable programs, no live enable flag or balance runner.
Existing skills/prices/presentations are retained. Native icons from decoded local skill records.
"""
from pathlib import Path
import json,copy
R=Path(__file__).resolve().parents[2];D=R/'plan/data';RO=R/'assets/ro'
def load(p):return json.loads(p.read_text())
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def curve(a,b):return [round(a+(b-a)*i/9,6) for i in range(10)]
def ref(k):return {'level_param':k}
def selector(team,select='all'):return {'team':team,'life':'living','select':select,'count':None,'phase':'cast_resolve','missing':'skip'}
def hit(id='hit',power='power',target='foe',magic=False,element='weapon',hits=1,crit=True):return {'id':id,'type':'damage','target':target,'formula':{'id':'magical_power' if magic else 'physical_power','params':{'attack_ratio':ref(power),'flat_power':0}},'damage_type':'magical' if magic else 'physical','element':element,'hit_rule':'always' if magic else 'physical_roll','can_crit':crit,'hits':hits,'armor_rule':'normal'}
def status(id,param='ratio',target='self',duration=8000,chance=1):return {'id':id,'type':'apply_status','target':target,'status_id':id,'duration_ms':duration,'params':{} if param is None else {'power_ratio' if id.endswith('regeneration') else 'ratio':ref(param)},'chance':chance}
def heal(power='power',target='friends',physical=False):return {'id':'heal','type':'heal','target':target,'formula':{'id':'physical_power' if physical else 'healing_power','params':{'attack_ratio':ref(power),'flat_power':0}}}
def shield(power='power',target='friends',duration=6000):return {'id':'shield','type':'shield','target':target,'formula':{'id':'healing_power','params':{'attack_ratio':ref(power),'flat_power':0}},'duration_ms':duration,'dispelable':True}
def cleanse(target='friends',tags=[]):return {'id':'cleanse','type':'remove_status','target':target,'polarity':'debuff','tags':tags,'max_instances':None,'permission':'cleanse'}
# root,job,source-id,name,rank-tier,curves,effects,reused VFX recipe,SP,CT,ACD,balls
specs=[
 ('swordsman','lord_knight',355,'Aura Blade',0,{'ratio':curve(.18,.35)},[status('attack_up')],5,45,350,850,0),
 ('swordsman','lord_knight',397,'Spiral Pierce',1,{'power':curve(1.1,1.9)},[hit(hits=5)],5,58,700,1200,0),
 ('swordsman','paladin',480,'Shield Chain',0,{'power':curve(1.05,1.8)},[hit(hits=5)],5,52,600,1100,0),
 ('swordsman','paladin',369,'Gospel',1,{'guard':curve(.1,.2),'power':curve(.25,.45)},[status('guard_up','guard','friends'),status('physical_regeneration','power','friends')],28,65,1100,1300,0),
 ('acolyte','high_priest',361,'Assumptio',0,{'ratio':curve(.14,.28)},[status('guard_up','ratio','friends',10000)],34,55,650,1050,0),
 ('acolyte','high_priest',362,'Basilica',1,{'power':curve(3.5,6),'guard':curve(.1,.18)},[shield(),status('guard_up','guard','friends',6000),cleanse()],73,75,1300,1500,0),
 ('acolyte','champion',370,'Palm Strike',0,{'power':curve(5.5,9),'stun':curve(1000,1800)},[hit(),status('stun',None,'foe',ref('stun'))],266,42,400,1050,1),
 ('acolyte','champion',372,'Chain Crush Combo',1,{'power':curve(1.5,2.6)},[hit(hits=5)],267,58,600,1300,3),
 ('archer','sniper',381,'Falcon Assault',0,{'power':curve(1.25,2)},[hit(hits=5,crit=False,element='neutral')],129,55,700,1200,0),
 ('archer','sniper',382,'Sharpshooting',1,{'power':curve(3.8,6.4)},[hit(target='foes',crit=True)],46,62,950,1250,0),
 ('archer','clown',394,'Arrow Vulcan',0,{'power':curve(.7,1.15)},[hit(hits=9)],46,58,900,1400,0),
 ('archer','clown',396,'Marionette Control',1,{'ratio':curve(.14,.28)},[status('attack_up','ratio','friends',10000),status('magic_up','ratio','friends',10000)],29,65,750,1150,0),
 ('archer','gypsy',489,'Tarot Card of Fate',0,{'power':curve(4.5,7.5),'ratio':curve(-.12,-.25)},[hit(element='neutral'),status('attack_down','ratio','foe',8000),status('silence',None,'foe',2000,.35),status('stun',None,'foe',1500,.35)],152,55,900,1250,0),
 ('archer','gypsy',395,'Moonlit Water Mill',1,{'power':curve(1.2,2),'guard':curve(.1,.2)},[heal(physical=True),status('guard_up','guard','friends',8000)],28,62,900,1300,0),
 ('mage','high_wizard',366,'Mystical Amplification',0,{'ratio':curve(.2,.4)},[status('magic_up',duration=10000)],29,48,500,1000,0),
 ('mage','high_wizard',400,'Napalm Vulcan',1,{'power':curve(.8,1.35)},[hit(magic=True,element='ghost',hits=5,target='foes',crit=False)],11,68,1200,1300,0),
 ('mage','professor',482,'Double Casting',0,{'power':curve(1.2,2),'chance':curve(.25,.45)},[{'id':'double_casting','type':'apply_status','target':'self','status_id':'double_casting','duration_ms':10000,'params':{'power_ratio':ref('power'),'chance':ref('chance')},'chance':1}],14,55,600,1000,0),
 ('mage','professor',374,'Soul Change',1,{'sp':curve(25,55),'ratio':curve(.12,.3)},[{'id':'restore_sp','type':'resource_change','target':'friends','resource':'sp','amount':ref('sp')},status('mana_regen_up','ratio','friends',10000)],35,65,1000,1300,0),
 ('thief','assassin_cross',379,'Soul Destroyer',0,{'power':curve(4.5,7.5),'magic':curve(1.5,2.5)},[hit(),hit('soul','magic',magic=True,element='neutral',crit=False)],136,55,650,1150,0),
 ('thief','assassin_cross',406,'Meteor Assault',1,{'power':curve(3.8,6.4)},[hit(target='foes'),status('stun',None,'foes',1600,.4)],136,65,850,1300,0),
 ('thief','stalker',389,'Chase Walk',0,{'guard':curve(.1,.2),'ratio':curve(.08,.18)},[status('guard_up','guard'),status('aspd_up')],50,48,350,1000,0),
 ('thief','stalker',476,'Full Strip',1,{'ratio':curve(.16,.3),'attack':curve(-.16,-.3)},[status('armor_break','ratio','foe',10000),status('attack_down','attack','foe',10000)],52,58,750,1250,0),
 ('merchant','whitesmith',485,'Cart Termination',0,{'power':curve(5.8,9.8)},[hit(),status('stun',None,'foe',1200,.3)],153,58,550,1200,0),
 ('merchant','whitesmith',486,'Maximum Overthrust',1,{'ratio':curve(.16,.32)},[status('attack_up','ratio','friends',10000)],155,62,800,1200,0),
 ('merchant','creator',490,'Acid Demonstration',0,{'power':curve(1.15,1.9),'ratio':curve(.1,.2)},[hit(hits=5,element='neutral'),status('armor_break','ratio','foe',8000)],229,65,1000,1300,0),
 ('merchant','creator',479,'Full Chemical Protection',1,{'ratio':curve(.25,.5),'guard':curve(.08,.16)},[cleanse(),status('cc_resistance_up','ratio','friends',10000),status('guard_up','guard','friends',10000)],230,68,1000,1400,0),
]
docs={root:load(D/f'skills/{root}.json') for root in ['swordsman','acolyte','archer','mage','thief','merchant']};presentations={r:load(D/f'presentations/{r}.json')for r in docs}
recipes=load(RO/'prepared/skill-recipes.json');recipe_ids={r['skill_id']for r in recipes['recipes']};fallbacks={11:19,5:5,34:28,73:28,266:5,267:5,129:46,152:52,14:29,35:28,136:52,50:52,52:52,153:5,155:5,229:52,230:28}
strings=load(D/'strings.th.json')
for root in docs:docs[root]['hi_class_skills']=[];docs[root]['hi_class_upgrades']={};presentations[root]['hi_class_presentations']=[]
index=[]
for root,job,native,name,slot,params,effects,recipe,sp,ct,acd,balls in specs:
 slug=name.lower().replace(' ','_');id=job+'_'+slug;record=load(RO/f'library/skill-assets/{native}.json');icon=next((x for x in record['icons'] if x['kind']=='skill_icon'),record['icons'][0]);s={'id':id,'name_key':id,'class_id':job,'max_level':10,'unlock_level':70+slot*10,'rank_unlock_levels':list(range(70,89,2)) if slot==0 else list(range(80,90)),'tags':[job,'hi_class'],'level_parameters':params,'presentation_id':'visual_'+id,'kind':'active','cost':{'sp':sp,'spirit_spheres':balls},'timing':{'cast_ms':ct,'after_cast_ms':acd,'interruptible':True},'selectors':{'foe':selector('enemies','front_first'),'foes':selector('enemies'),'friends':selector('allies')},'start_effects':[],'effects':effects}
 # Scalar integral SP/status timings are deliberately authored as integers at every rank.
 for key in ['stun','sp']:
  if key in s['level_parameters']:s['level_parameters'][key]=[round(v)for v in s['level_parameters'][key]]
 docs[root]['hi_class_skills'].append(s);docs[root]['hi_class_upgrades'][id]={'learn_level_one_cost':{'gold':2500,'skill_manual':100},'upgrade_cost_rows':[{'from_level':i,'to_level':i+1,'gold':1000*(i+1),'skill_manual':50*(i+1)}for i in range(1,10)]}
 recipe=recipe if recipe in recipe_ids else fallbacks[recipe];assert recipe in recipe_ids,(id,recipe)
 base=next(p for doc in presentations.values()for p in doc['presentations']if p['visual']['reference_skill_id']==recipe)
 p={'id':'visual_'+id,'icon_asset_id':icon['id'],'icon_meta_path':'assets/ro/library/'+icon['meta_path'],'visual':copy.deepcopy(base['visual']),'sound_meta_paths':copy.deepcopy(base['sound_meta_paths']),'provenance':{'source_skill_id':native,'source_constant':record['constants'][0],'icon_basis':'Exact local native Hi-class skill icon','vfx_basis':'Reused authored recipe; identity/effects are this game adaptation, not exact RO reproduction'}}
 presentations[root]['hi_class_presentations'].append(p);strings['strings'][id]=name;index.append({'id':id,'job':job,'source_skill_id':native,'root':root})
for root in docs:write(D/f'skills/{root}.json',docs[root]);write(D/f'presentations/{root}.json',presentations[root])
write(D/'strings.th.json',strings)
# This status is unused until its High skill is projected into the release.
p=D/'class-status-effects.json';d=load(p);d['statuses']=[s for s in d['statuses']if s['id']!='double_casting'];base=copy.deepcopy(next(s for s in load(D/'status-effects.json')['statuses']if s['id']=='attack_up'))
base.update(id='double_casting',tags=['skill_followup'],modifiers=[],parameter_schema={'type':'object','properties':{'power_ratio':{'type':'number','minimum':0},'chance':{'type':'number','minimum':0,'maximum':1}},'required':['power_ratio','chance'],'additionalProperties':False})
extra=hit('echo',magic=True,element='neutral',crit=False,target='event_target');extra['formula']['params']['attack_ratio']={'status_param':'power_ratio'}
base['triggers']=[{'id':'echo','event':'damage_dealt','chance':{'status_param':'chance'},'accepted_origins':['skill'],'limit_scope':'per_root_action','limit_count':1,'reentry':'deny_same_source_trigger_in_ancestry','selectors':{},'effects':[extra]}];d['statuses'].append(base);write(p,d)
write(R/'plan/evidence/task-123-authored-skill-index.json',{'skills':index,'scope':'26 inactive typed programs; coefficients assistant baseline; no team balance run'})
print('Authored26 inactive Hi-class skills, prices, native icon bindings and typed Double Casting status.')

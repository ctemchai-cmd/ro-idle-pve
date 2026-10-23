"""D-138 explicit, idempotent user-note changes, applied after immutable D-103 curves.
No balance runner. All coefficients are authored per-cast budgets, not equal-DPS claims.
"""
from copy import deepcopy

def curve(a,b,integer=False):
 return [round(a+(b-a)*i/9) if integer else round(a+(b-a)*i/9,6) for i in range(10)]
def ref(key):return {'level_param':key}
def status(id,target,status_id,ratio=None,duration=5500,chance=1):
 return {'id':id,'type':'apply_status','target':target,'status_id':status_id,'duration_ms':duration,'params':{}if ratio is None else{'ratio':ratio},'chance':chance}
def hit(id='hit',target='foe',kind='physical',element='weapon',power='power',hits=1):
 return {'id':id,'type':'damage','target':target,'formula':{'id':kind+'_power','params':{'attack_ratio':ref(power),'flat_power':0}},'damage_type':kind,'element':element,'hit_rule':'physical_roll'if kind=='physical'else'always','can_crit':kind=='physical','hits':hits,'armor_rule':'normal'}
def foe(team='enemies',select='front_first'):
 return {'team':team,'life':'living','select':select,'count':None,'phase':'cast_resolve','missing':'skip'}

def apply(skills):
 # Keep stable IDs, costs, unlocks, learned levels and loadouts. Names live in strings.
 finger=[v*5 for v in skills['monk_finger_offensive']['level_parameters']['power']]
 major={'knight_brandish':.5,'crusader_grand_cross':.5,'hunter_rapid_fire':.7,'hunter_claymore':.5,'wizard_storm_gust':.5,'wizard_jupitel':.7,'wizard_meteor':.5,'wizard_heavens_drive':.5,'sage_psychic_bolt':.7,'assassin_sonic_blow':.7,'rogue_raid':.5,'blacksmith_cart_crash':.5,'alchemist_acid_terror':.7}
 for sid,ratio in major.items():
  s=skills[sid];effect=next((e for e in s['effects']if e['type']=='damage'),None)
  if effect is None:
   if sid=='wizard_storm_gust':s['level_parameters']['power']=[round(v*.5/4,6)for v in finger]
   continue
  if sid=='blacksmith_cart_crash':effect['hits']=4
  crit=1.5 if sid=='sage_psychic_bolt'else 1
  s['level_parameters']['power']=[round(v*ratio/effect['hits']/crit,6) for v in finger]
 # A spinning single-target finisher replaces poison detonation, not a second skill/instance.
 s=skills['assassin_detonate'];s['effects']=[hit()];s['level_parameters']={'power':[round(v*.7,6)for v in finger],'critical':curve(.2,.5)};s['effects'][0]['crit_chance_bonus']=ref('critical')
 s=skills['assassin_grimtooth'];s['level_parameters']['power']=curve(2.625,4.375)
 s=skills['assassin_enchant_poison'];s['level_parameters']['duration']=curve(5000,10000,True);s['effects'][0]['duration_ms']=ref('duration')
 s=skills['rogue_raid'];s['level_parameters']['critical_damage']=curve(.1,.3);s['effects'][0]['crit_damage_bonus']=ref('critical_damage')
 for sid in ['rogue_strip_armor','rogue_strip_weapon']:
  s=skills[sid];s['effects']=[hit(),*[e for e in s['effects']if e['type']!='damage']];s['level_parameters']['power']=curve(1.2,2)
 s=skills['rogue_intimidate'];s['level_parameters']['duration']=curve(3000,6000,True);s['effects'][0]['duration_ms']=ref('duration')
 s=skills['rogue_dodge'];s['level_parameters']['cast_speed']=curve(.05,.15);s['modifiers']=[m for m in s['modifiers']if m['id']!='cast_speed'];s['modifiers'].append({'id':'cast_speed','stat':'cast_speed','op':'add_percent','bucket':'derived','value':ref('cast_speed')})
 s=skills['archer_vulture_eye'];s['level_parameters']['critical_damage']=curve(.05,.2);s['modifiers']=[m for m in s['modifiers']if m['id']!='critical_damage'];s['modifiers'].append({'id':'critical_damage','stat':'crit_damage_bonus','op':'add_flat','bucket':'bonus','value':ref('critical_damage')})
 # Bard and Dancer retain shared healing but now have different support identities.
 s=skills['bard_battle_song'];s['effects']=[e for e in s['effects']if e['id']!='attack_up'];s['effects'].append(status('attack_up','friends','attack_up',ref('attack')));s['level_parameters']['attack']=curve(.08,.2)
 s=skills['dancer_battle_song'];s['level_parameters']={'critical':curve(.1,.25),'critical_damage':curve(.15,.35)};s['effects']=[status('critical','friends','crit_up',ref('critical')),status('critical_damage','friends','crit_damage_up',ref('critical_damage'))]
 s=skills['dancer_dissonance'];s['selectors']={'friends':foe('allies','all')};s['level_parameters']={'defense':curve(.2,.45)};s['effects']=[status('defense','friends','defense_up',ref('defense')),status('magic_defense','friends','magic_defense_up',ref('defense'))]
 # Control spells use generic per-target successful-effect outcomes and local crit policy.
 s=skills['sage_spell_breaker'];s['timing']['cast_ms']=0;s['level_parameters']['power']=curve(10,15);s['effects']=[{'id':'interrupt','type':'interrupt','target':'foe'},hit('interrupt_hit',kind='magical',element='neutral')];s['effects'][1]['when']={'type':'effect_succeeded','effect_id':'interrupt','scope':'same_target'}
 s=skills['sage_dispel'];s['level_parameters']['cast']=curve(1000,0,True);s['level_parameters']['removed']=[1,1,1,2,2,2,3,3,3,4];s['timing']['cast_ms']=ref('cast');s['effects'][0]['max_instances']=ref('removed')
 s=skills['sage_psychic_bolt'];s['effects'][0]['can_crit']=True;s['effects'][0]['critical_rule']='always'
 s=skills['sage_magic_barrier'];s['selectors']={'foe':foe()};s['level_parameters']={'power':[round(v*.7,6)for v in finger],'duration':curve(5000,8000,True)};s['effects']=[hit(kind='magical',element='neutral'),status('silence','foe','silence',duration=ref('duration'))]
 s=skills['wizard_meteor'];s['level_parameters']['stun_duration']=curve(1000,2000,True);s['effects']=[e for e in s['effects']if e['id']!='stun'];e=status('stun','foes','stun',duration=ref('stun_duration'),chance=.3);e['when']={'type':'hit_landed','effect_id':'hit','scope':'same_target','hit_index':'any'};s['effects'].append(e)
 # Merchant's shared utility becomes armor break; copies of Cart Revolution stay coherent.
 s=skills['merchant_first_aid'];s['selectors']={'foe':foe()};s['level_parameters']={'break':curve(.2,.4),'duration':curve(5000,10000,True)};s['effects']=[status('armor_break','foe','armor_break',ref('break'),ref('duration'))]
 s=skills['merchant_loud_voice'];s['level_parameters']['ratio']=curve(.175,.4)
 s=skills['blacksmith_adrenaline'];s['level_parameters']['ratio']=curve(.2,.4)
 s=skills['blacksmith_weapon_perfection'];s['level_parameters']['critical']=curve(.08,.18);s['level_parameters']['critical_damage']=curve(.1,.3);s['effects']=[s['effects'][0],status('critical','friends','crit_up',ref('critical'),5000),status('critical_damage','friends','crit_damage_up',ref('critical_damage'),5000)]
 s=skills['blacksmith_meltdown'];s['level_parameters']['break']=curve(-.15,-.3);s['effects'][1]['id']='attack_down';s['effects'][1]['status_id']='attack_down'
 s=skills['blacksmith_hammer_fall'];s['level_parameters']['duration']=curve(1000,2000,True);s['effects'][1]['duration_ms']=ref('duration')
 s=skills['alchemist_potion_pitcher'];s['effects']=[e for e in s['effects']if e['id']!='regeneration'];s['effects'].append({'id':'regeneration','type':'apply_status','target':'friend','status_id':'regeneration','duration_ms':5001,'params':{'power_ratio':.8},'chance':1})
 s=skills['alchemist_hell_plant'];s['effects'][0]['duration_ms']=10000
 # Keep the old healing plant identity/visual while adding its requested offensive role.
 #6ticks, derived_scale.35, baseattack1; total offensive budget=.7Finger per cast.
 s=skills['alchemist_bio_cannibalize'];s['level_parameters']['plant_power']=[round(v*.7/(6*.35),6)for v in finger];s['effects'][0]['power_scale']=ref('plant_power')
 # Demonstration: half of AoE budget upfront, half in4ticks before5000ms expiry.
 s=skills['alchemist_demonstration'];s['level_parameters']['burst']=[round(v*.25,6)for v in finger];s['level_parameters']['power']=[round(v*.25/4,6)for v in finger];s['effects']=[hit('burst',target='foes',kind='magical',element='fire',power='burst'),*[e for e in s['effects']if e['type']=='apply_status']]
 # D139: rank must improve the action as well as SP efficiency. Fixed endpoints
 # avoid multiplying the previous generated data on each regeneration.
 for sid,start,end in [('swordsman_provoke',4500,7500),('hunter_ankle_snare',1200,2400),('bard_encore',1000,1800),('dancer_encore',1000,1800)]:
  s=skills[sid];s['level_parameters']['duration']=curve(start,end,True);s['effects'][0]['duration_ms']=ref('duration')
 s=skills['alchemist_hell_plant'];s['level_parameters']['plant_power']=curve(1.75,3.0625);s['effects'][0]['power_scale']=ref('plant_power')
 s=skills['priest_resurrection'];s['tags']=['priest','heal','party_heal'];s['selectors']={'friends':foe('allies','all')};s['level_parameters']={'power':curve(4.2,7)};s['effects']=[{'id':'heal','type':'heal','target':'friends','formula':{'id':'healing_power','params':{'attack_ratio':ref('power'),'flat_power':0}}}]
 return {'finger_total':finger,'major_ratios':major,'policy':'70%single/50%AoE per target before ordinary crits; Psychic includes baseline1.5 guaranteedcrit; utility/interrupt bonuses explicit'}

def supporting_documents(data):
 # New reusable crit damage buff, same independent additive lifecycle as existing buffs.
 statuses=data['status-effects.json']['statuses'];base=deepcopy(next(s for s in statuses if s['id']=='crit_up'));base['id']='crit_damage_up';base['modifiers'][0]['stat']='crit_damage_bonus'
 if not any(s['id']=='crit_damage_up'for s in statuses):statuses.append(base)
 # Bio adds an attack to the original small-heal actor. Both snapshot the owner once.
 actor=next(a for a in data['summon-actors.json']['actors']if a['id']=='healing_plant');actor['action']['selectors']['foe']={**foe(),'phase':'event'}
 actor['action']['effects']=[e for e in actor['action']['effects']if e['id']!='plant_hit'];e=hit('plant_hit',kind='magical',element='earth');e['formula']['params']['attack_ratio']=1;actor['action']['effects'].insert(0,e)

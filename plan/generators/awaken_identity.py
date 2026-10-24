"""D160/TASK130: authored Awaken bonuses by skill identity, not engine special cases.

Extra-hit skills receive +20% TOTAL direct power, divided among their new hits.
Existing base-max -> Awaken rank curves remain in awaken_content.py.
"""
import copy

def curve(a,b):return [round(a+(b-a)*i/9,6) for i in range(10)]
def ref(k):return {'level_param':k}
def assign(table,ids,value):
 for id in ids.split():
  assert id not in table,id
  table[id]=value

PASSIVES={}
assign(PASSIVES,'swordsman_sword_mastery blacksmith_weapon_research monk_iron_fist hunter_steel_crow assassin_poison_edge wizard_amplified_magic alchemist_chemical_expertise rogue_dirty_tricks wizard_frost_control',('skill_damage_bonus',.06,.12,'add_flat','bonus'))
assign(PASSIVES,'archer_vulture_eye assassin_katar_mastery',('crit_damage_bonus',.10,.20,'add_flat','bonus'))
assign(PASSIVES,'knight_weapon_drill',('crit_chance_bonus',.04,.08,'add_flat','bonus'))
assign(PASSIVES,'knight_veteran crusader_faith merchant_trading_stamina blacksmith_tempering',('guard_percent',.025,.05,'add_flat','bonus'))
assign(PASSIVES,'acolyte_meditation priest_spirit_recovery mage_sp_recovery bard_breathing dancer_breathing',('max_sp',.08,.16,'add_percent','derived'))
assign(PASSIVES,'priest_healing_art alchemist_learning_potion bard_music_lesson dancer_music_lesson',('magical_attack',.06,.12,'add_percent','derived'))
# Song healing is P.ATK, so Music Lesson strengthens that offense rather than MATK.
for id in ['bard_music_lesson','dancer_music_lesson']:PASSIVES[id]=('physical_attack',.06,.12,'add_percent','derived')
assign(PASSIVES,'thief_double_attack hunter_falcon monk_spirit_combo sage_auto_bolt',('penetration_percent',.08,.16,'add_flat','bonus'))
assign(PASSIVES,'crusader_reflect',('physical_defense',.10,.20,'add_percent','derived'))
assign(PASSIVES,'rogue_dodge',('normal_damage_bonus',.06,.12,'add_flat','bonus'))
assign(PASSIVES,'sage_wisdom',('skill_damage_bonus',.06,.12,'add_flat','bonus'))

# status, target, low/high magnitude, duration. These are explicit effect bonuses.
BOONS={}
assign(BOONS,'acolyte_blessing clown_marionette_control whitesmith_maximum_overthrust',('awaken_skill_power','friends',.08,.16,6000))
assign(BOONS,'priest_impositio blacksmith_weapon_perfection dancer_battle_song knight_battle_cry',('crit_damage_up','friends',.10,.20,6000))
assign(BOONS,'knight_twohand_quicken thief_quick_step stalker_chase_walk',('crit_up','self',.05,.10,5000))
assign(BOONS,'acolyte_increase_agi blacksmith_adrenaline bard_battle_song',('awaken_skill_power','friends',.06,.12,6000))
assign(BOONS,'archer_concentration',('crit_damage_up','self',.15,.30,6000))
assign(BOONS,'lord_knight_aura_blade assassin_enchant_poison high_wizard_mystical_amplification professor_double_casting',('awaken_penetration','self',.12,.24,6000))
assign(BOONS,'sage_fire_endow merchant_loud_voice',('awaken_skill_power','friends',.08,.16,6000))
assign(BOONS,'monk_call_spirits',('awaken_skill_power','self',.10,.20,6000))
assign(BOONS,'swordsman_provoke',('armor_break','foes',.10,.20,6000))
assign(BOONS,'swordsman_endure crusader_auto_guard monk_steel_body',('counter_stance','self',.40,.80,6000))
assign(BOONS,'knight_counter_stance',('awaken_penetration','self',.12,.24,6000))
assign(BOONS,'crusader_devotion',('guard_up','self',.06,.12,6000))
assign(BOONS,'crusader_defender dancer_dissonance',('awaken_skill_power','friends',.06,.12,6000))
assign(BOONS,'creator_full_chemical_protection',('awaken_skill_power','friends',.06,.12,6000))
assign(BOONS,'hunter_hunters_mark',('armor_break','foe',.10,.20,6000))
assign(BOONS,'hunter_ankle_snare rogue_intimidate',('exposed','foe',.10,.20,5000))
assign(BOONS,'bard_encore dancer_encore',('exposed','foes',.08,.16,5000))
assign(BOONS,'bard_dissonance sage_dispel wizard_quagmire',('exposed','foes',.08,.16,6000))
assign(BOONS,'merchant_first_aid stalker_full_strip',('exposed','foe',.08,.16,6000))
assign(BOONS,'priest_sanctuary',('awaken_healing_received','friends',.10,.20,6000))
assign(BOONS,'wizard_storm_gust',('awaken_penetration','self',.12,.24,6000))
assign(BOONS,'assassin_venom_dust',('armor_break','foes',.10,.20,6000))

# New hits carry a fixed +20% combined direct-power budget. Multi-effect Soul Destroyer
# retains its two distinct physical/magical components and uses penetration instead.
MULTI={}
assign(MULTI,'archer_double_strafe rogue_copy_archer_double_strafe monk_triple_attack monk_finger_offensive knight_pierce crusader_holy_cross hunter_blitz_beat hunter_rapid_fire sniper_falcon_assault lord_knight_spiral_pierce paladin_shield_chain champion_chain_crush_combo mage_fire_bolt mage_cold_bolt mage_lightning_bolt mage_soul_strike rogue_copy_mage_fire_bolt high_wizard_napalm_vulcan clown_arrow_vulcan',1)
assign(MULTI,'assassin_sonic_blow',2)

# Remaining direct damage keeps hit count and gains an offensive rider appropriate
# to its purpose. Armor shatter helps team follow-up; penetration helps the caster.
RIDERS={}
assign(RIDERS,'swordsman_bash swordsman_magnum_break knight_brandish merchant_cart_revolution blacksmith_hammer_fall blacksmith_cart_crash rogue_copy_swordsman_bash rogue_copy_merchant_cart_revolution hunter_claymore crusader_grand_cross whitesmith_cart_termination creator_acid_demonstration', 'armor_break')
assign(RIDERS,'thief_envenom thief_sand_attack thief_backstab assassin_grimtooth rogue_strip_armor rogue_strip_weapon rogue_expose rogue_raid assassin_cross_meteor_assault gypsy_tarot_card_of_fate archer_arrow_shower archer_crippling_shot', 'exposed')
assign(RIDERS,'monk_asura champion_palm_strike sage_psychic_bolt wizard_jupitel wizard_meteor wizard_heavens_drive alchemist_acid_terror alchemist_demonstration sage_magic_barrier sage_spell_breaker assassin_cross_soul_destroyer blacksmith_meltdown merchant_mammonite assassin_detonate bard_performance_strike dancer_performance_strike acolyte_holy_light sniper_sharpshooting', 'penetration')

HEALS={'acolyte_heal','rogue_copy_acolyte_heal','priest_resurrection','alchemist_potion_pitcher','bard_healing_song','dancer_healing_song','gypsy_moonlit_water_mill'}
SHIELDS={'priest_kyrie','high_priest_basilica','high_priest_assumptio','paladin_gospel'}
RECOVERY={'priest_magnificat','professor_soul_change'}
SUMMONS={'alchemist_hell_plant','alchemist_bio_cannibalize'}

def add_boon(s,status,target,low,high,duration,phase='effects',when=None):
 key='awaken_'+str(len(s['level_parameters']))
 s['level_parameters'][key]=curve(low,high)
 e={'id':key,'type':'apply_status','target':target,'status_id':status,'duration_ms':duration,'params':{'ratio':ref(key)},'chance':1}
 if when:e['when']=copy.deepcopy(when)
 s[phase].append(e)
 return {'type':'status','status':status,'target':target,'range':[low,high],'duration_ms':duration,'phase':phase}

def identity(s,original):
 id=s['id'];gains=[]
 if s['kind']=='passive':
  assert id in PASSIVES,('PASSIVE_WITHOUT_POLICY',id)
  stat,low,high,op,bucket=PASSIVES[id];s['level_parameters']['awaken_identity']=curve(low,high)
  s['modifiers'].append({'id':'awaken_identity','stat':stat,'op':op,'bucket':bucket,'value':ref('awaken_identity')})
  return [{'type':'permanent_modifier','stat':stat,'range':[low,high],'op':op}]
 if id in MULTI:
  hits=[e for e in s['effects'] if e['type']=='damage'];assert len(hits)==1,id
  e=hits[0];old=e['hits'];new=old+MULTI[id];e['hits']=new
  key=e['formula']['params']['attack_ratio']['level_param']
  s['level_parameters'][key]=[round(v*old/new*1.2,6) for v in s['level_parameters'][key]]
  gains.append({'type':'extra_hits','before':old,'after':new,'total_direct_power_multiplier':1.2,'per_hit_compensated':True})
 elif id in RIDERS:
  first=next(e for e in s['effects'] if e['type']=='damage');rider=RIDERS[id]
  if rider=='penetration':
   # Before the damage on resolve: benefits this cast, never grants a boon for an interrupted cast.
   # This new self boon is granted on resolve. Any original damage predicate
   # (e.g. Spell Breaker's successful interrupt) remains on that damage effect.
   before=len(s['effects']);gains.append(add_boon(s,'awaken_penetration','self',.12,.24,5000))
   bonus=s['effects'].pop();s['effects'].insert(s['effects'].index(first),bonus);assert len(s['effects'])==before+1
   # Cast offense is intentionally frozen at cast start. Scope the same new
   # penetration to this cast's damage effects without modifying that snapshot.
   for hit in s['effects']:
    if hit['type']=='damage':hit['penetration_bonus']=copy.deepcopy(bonus['params']['ratio'])
  else:
   when={'type':'hit_landed','effect_id':first['id'],'scope':'same_target','hit_index':'any'}
   gains.append(add_boon(s,rider,first['target'],.10,.20,6000,when=when))
 elif id in BOONS:gains.append(add_boon(s,*BOONS[id]))
 elif id in HEALS:
  heal=next(e for e in s['effects'] if e['type']=='heal');formula=copy.deepcopy(heal['formula'])
  source=heal['formula']['params']['attack_ratio'];base=original['level_parameters'][source['level_param']][-1]
  s['level_parameters']['awaken_barrier']=curve(round(base*.15,6),round(base*.25,6));formula['params']['attack_ratio']=ref('awaken_barrier');formula['params']['flat_power']=0
  s['effects'].append({'id':'awaken_barrier','type':'shield','target':heal['target'],'formula':formula,'duration_ms':5000,'dispelable':True})
  gains.append({'type':'shield','formula':formula['id'],'target':heal['target'],'range':s['level_parameters']['awaken_barrier'][::9],'duration_ms':5000})
 elif id in SHIELDS:
  # Assumptio/Kyrie/Basilica extend protection with a recovery layer; Gospel already has HoT.
  if id=='paladin_gospel':
   s['level_parameters']['awaken_barrier']=curve(.5,1)
   s['effects'].append({'id':'awaken_barrier','type':'shield','target':'friends','formula':{'id':'physical_power','params':{'attack_ratio':ref('awaken_barrier'),'flat_power':0}},'duration_ms':6000,'dispelable':True})
   gains.append({'type':'shield','formula':'physical_power','range':[.5,1],'target':'friends'})
  else:
   s['level_parameters']['awaken_recovery']=curve(.3,.6)
   s['effects'].append({'id':'awaken_recovery','type':'apply_status','target':'friends','status_id':'regeneration','duration_ms':5000,'params':{'power_ratio':ref('awaken_recovery')},'chance':1})
   gains.append({'type':'periodic_heal','range':[.3,.6],'target':'friends','duration_ms':5000})
 elif id in RECOVERY:
  s['level_parameters']['awaken_sp']= [round(v) for v in curve(20,40)]
  s['effects'].append({'id':'awaken_sp','type':'resource_change','target':'friends','resource':'sp','amount':ref('awaken_sp')})
  gains.append({'type':'sp_restore','range':[20,40],'target':'friends'})
 elif id in SUMMONS:
  e=next(e for e in s['effects'] if e['type']=='summon');old=e['duration_ms'];s['level_parameters']['awaken_lifetime']=[round(v)for v in curve(old*1.2,old*1.5)];e['duration_ms']=ref('awaken_lifetime')
  # More useful even when a fast rotation replaces a plant before its new expiry.
  key=e['power_scale']['level_param'];s['level_parameters'][key]=[round(v*1.15,6)for v in s['level_parameters'][key]]
  gains.append({'type':'summon','duration_range':s['level_parameters']['awaken_lifetime'][::9],'additional_power_multiplier':1.15,'max_owned_unchanged':True})
 else:raise AssertionError(('ACTIVE_WITHOUT_POLICY',id))
 if id=='monk_call_spirits':
  s['level_parameters']['awaken_sp']=[round(v)for v in curve(12,30)]
  s['effects'].append({'id':'awaken_sp','type':'resource_change','target':'self','resource':'sp','amount':ref('awaken_sp')})
  gains.append({'type':'sp_restore','range':[12,30],'target':'self'})
 if id=='assassin_enchant_poison':
  # D162/TASK132: the generic Awaken curve multiplied both ATK and uptime.
  # Rein in that compound growth while keeping rank1, penetration, independent
  # stacking and the original Class2 skill intact. No class-wide damage penalty.
  maximum=original['level_parameters']['ratio'][-1]
  duration=original['level_parameters']['duration'][-1]
  s['level_parameters']['ratio']=curve(maximum*1.1,maximum*1.2)
  s['level_parameters']['duration']=[round(v)for v in curve(duration*1.1,duration*1.2)]
 return gains

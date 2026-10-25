"""D170: presentation-only native RO art bindings with an explicit provenance audit."""
import json, pathlib, copy, hashlib
R=pathlib.Path(__file__).resolve().parents[1];RO=R/'assets/ro';p=R/'src/renderer/combat-visuals.json';v=json.loads(p.read_text());before=json.loads((R/'plan/evidence/task-146/before-combat-visuals.json').read_text())
rows=json.loads((RO/'library/indexes/effects.json').read_text())['assets'];by_name={}
for r in rows:
 if r['kind']=='keyframe_effect_atlas':by_name.setdefault(pathlib.PurePosixPath(r['meta_path']).name.split('--')[0],[]).append(r)
def ref(name):return 'library/'+by_name[name][0]['meta_path']
existing={k.split('/')[-1].split('--')[0]:k for k in [a['meta_path']for a in json.loads((R/'runtime/ro/manifest.json').read_text())['assets'].values()if a['meta_path'].startswith('library/effects/keyframe')]}
LENS='library/effects/effect_texture/lens1--066dd9853776.meta.json';PURPLE='library/effects/effect_texture/purpleslash--0139e39f3eba.meta.json';TAROT='library/effects/effect_texture/tarot09--fcc81ec72531.meta.json';FALCON='library/effects/sprite_effect_atlas/soul_falcon--5efd75c6706e.meta.json';IVY='library/effects/effect_texture/blue_ivy--f23bd420b8bd.meta.json'
def layer(meta,w=100,h=100,duration=800,count=1,delay=0,alpha=1,radial=False,spread=0,angle=0,from_=(0,-40),to=(0,-40),end=None,additive=True):return dict(meta=meta,delay_ms=delay,duration_ms=duration,count=count,interval_ms=0,alpha=alpha,fade_in=True,fade_out=True,**{'from':list(from_),'to':list(to)},size=[w,h],end_size=list(end or(w,h)),angle=angle,spread=spread,radial=radial,additive=additive)
# Asset selection is explicit. Reuse/renamed skills are adaptations, never exact effect claims.
named={
 'lord_knight_aura_blade':'enc_fire','lord_knight_spiral_pierce':'pierce','paladin_shield_chain':'holy_cross','paladin_gospel':'sanctuary',
 'high_priest_assumptio':'asum','high_priest_basilica':'holyhit','champion_palm_strike':'hit','champion_chain_crush_combo':LENS,
 'sniper_falcon_assault':FALCON,'sniper_sharpshooting':'arrowstorm','clown_arrow_vulcan':'arrowstorm','clown_marionette_control':'spell','gypsy_tarot_card_of_fate':'spell','gypsy_moonlit_water_mill':'sanctuary',
 'high_wizard_mystical_amplification':'spell','high_wizard_napalm_vulcan':'holyhit','professor_double_casting':'spell','professor_soul_change':'new_psychicwave_bottom',
 'assassin_cross_soul_destroyer':'sonicblow','assassin_cross_meteor_assault':PURPLE,'stalker_chase_walk':'poisonreact','stalker_full_strip':'strip_armor',
 'whitesmith_cart_termination':'new_axetornado','whitesmith_maximum_overthrust':'enc_fire','creator_acid_demonstration':'firehit1','creator_full_chemical_protection':'concentration',
 'monk_asura':LENS,'monk_finger_offensive':IVY,'monk_steel_body':'concentration','crusader_grand_cross':'holy_cross','priest_kyrie':'holyhit','priest_sanctuary':'sanctuary',
 'hunter_rapid_fire':'arrowstorm','hunter_spiral_volley':'arrowstorm','bard_encore':'spell','dancer_encore':'loud','wizard_storm_gust':'stormgust','wizard_meteor':'firehit1','wizard_heavens_drive':'earthhit','sage_psychic_bolt':'lightning','sage_magic_barrier':'spell',
 'assassin_grimtooth':PURPLE,'rogue_raid':PURPLE,'alchemist_demonstration':'claymore','alchemist_acid_terror':'poison','assassin_detonate':'new_rollingcutter_count_01'}
named.update({
 'knight_brandish':'brandish','crusader_defender':'concentration','hunter_claymore':'claymore','blacksmith_weapon_perfection':'concentration','blacksmith_cart_crash':'new_axetornado','knight_battle_cry':'loud','knight_counter_stance':'concentration','crusader_devotion':'asum',
 'priest_magnificat':'holyhit','priest_resurrection':'holyhit',
 'hunter_ankle_snare':'concentration','bard_battle_song':'concentration','bard_dissonance':'loud',
 'dancer_battle_song':'concentration','dancer_dissonance':'concentration',
 'wizard_jupitel':'windhit1','wizard_quagmire':'earthhit','sage_dispel':'spell',
 'assassin_sonic_blow':'sonicblow','assassin_venom_dust':'poisonreact','rogue_expose':'poisonreact','rogue_intimidate':'poisonreact',
 'blacksmith_hammer_fall':'crashearth','blacksmith_meltdown':'enc_fire',
 'alchemist_hell_plant':'poisonreact','alchemist_bio_cannibalize':'concentration',
})
# Scope = all High actives, Class2 active unlock>=30, plus all established large-attack banners.
finisher_ids=set(__import__('re').findall(r'^\s{2}(\w+):\s*\{', (R/'src/renderer/finishers.ts').read_text(),__import__('re').M));scope=[];audit=[]
for root in ['swordsman','acolyte','archer','mage','thief','merchant']:
 d=json.loads((R/f'plan/data/skills/{root}.json').read_text());pd=json.loads((R/f'plan/data/presentations/{root}.json').read_text());presentations={x['id']:x for x in pd['presentations']+pd['hi_class_presentations']}
 for s in d['skills']+d['hi_class_skills']:
  if s['kind']!='active' or not(s in d['hi_class_skills']or s['unlock_level']>=30 or s['id']in finisher_ids or s['id']in['wizard_storm_gust','crusader_grand_cross','monk_finger_offensive']):continue
  id=s['id'];scope.append(id);old=copy.deepcopy(before['impacts'].get(s['presentation_id'],dict(scale=.75,start_ms=0,lead_ms=0,stagger_ms=0,lift=0)))
  name=named.get(id)
  if not name:raise ValueError('Major skill needs an explicit native role binding: '+id)
  meta=name if name.endswith('.meta.json')else existing.get(name)or ref(name);old['meta']=meta;old['native_only']=True;old['once_per_action']=True;old['duration_ms']=old.get('duration_ms',1300)
  old['basis']='D170 native local RO media; explicit role adaptation where original client mapping has no ready clip. No procedural replacement art.'
  if id in ['monk_asura','champion_chain_crush_combo']:
   c=json.loads((RO/'library/skill-assets/271.json').read_text())['effects']['hitEffectId']['components'][0]['parameters'];old.update(texture_layers=[layer(LENS,w=c['sizeStartX'],h=c['sizeStartY'],duration=c['duration'],count=c['duplicate'],delay=c['delayStart'],alpha=c['alphaMax'],radial=True,spread=14)],scale=1,start_ms=200,lead_ms=0,lift=35,duration_ms=650)
   old['basis']='RO MO_EXTREMITYFIST271 hitEffect266 actual lens1.tga and source24copies/550ms/100ms delay/10x150/.8alpha. 3D attachment adapted to deterministic2D radial placement. Gate is explicit reuse for custom HP-sacrifice punch.'
  if id=='monk_finger_offensive':old.update(texture_layers=[layer(IVY,w=36,h=120,duration=420)],scale=.9,duration_ms=420,start_ms=60,lift=35,once_per_action=False)
  if meta==PURPLE:
   old.update(texture_layers=[layer(PURPLE,w=170,h=70,duration=500,count=3,angle=-20,spread=15,end=(220,90))],scale=1,duration_ms=500,lift=35)
   old['basis']='Native RO purpleslash.tga, referenced by ASC_METEORASSAULT406.2D placement adapted; same real slash art reused for Grimtooth/Raid.'
  if meta==FALCON:old.update(texture_layers=[layer(FALCON,w=130,h=100,duration=1500,from_=(0,-160),to=(0,-30),additive=False)],scale=1,duration_ms=1500,lift=10)
  if id=='gypsy_tarot_card_of_fate':old.update(texture_layers=[layer(TAROT,w=85,h=125,duration=1000,from_=(0,-80),to=(0,-130),additive=False)],scale=.85,duration_ms=1000)
  if id=='stalker_full_strip':old.update(texture_layers=[layer(PURPLE,w=160,h=65,duration=500)],scale=.9,start_ms=300,duration_ms=1500,lift=40)
  if id=='high_priest_basilica':old.update(link_texture_meta=LENS,persistent=True)
  if id in ['professor_soul_change','priest_sanctuary','gypsy_moonlit_water_mill']:old['persistent']=True
  if id=='wizard_storm_gust':old.update(duration_ms=2000,scale=.85)
  if id=='high_wizard_napalm_vulcan':
   v['skills'][id]['hue_rotate_deg']=270;old['scale']=.85
  if id=='high_priest_assumptio':old.update(scale=.75,duration_ms=1700)
  if root=='thief':
   if meta.endswith('sonicblow--8ff63a20bc32.meta.json'):v['skills'][id]['hue_rotate_deg']=50
   if meta==PURPLE or any(l['meta']==PURPLE for l in old.get('texture_layers',[])):v['skills'][id]['hue_rotate_deg']=0
  v['impacts'][s['presentation_id']]=old
  refs={meta,*[l['meta']for l in old.get('texture_layers',[])],*([old['link_texture_meta']]if old.get('link_texture_meta')else[])};assets=[]
  for r in sorted(refs):
   f=RO/r;m=json.loads(f.read_text());assert not m.get('missing_dependencies');coll='library/'if r.startswith('library/')else'';media=RO/(coll+m['file']['path']);assert hashlib.sha256(media.read_bytes()).hexdigest()==m['file']['sha256'];assets.append(dict(meta=r,id=m['id'],sha256=m['file']['sha256'],media=str(media.relative_to(RO)),bytes=m['file']['bytes']))
  audit.append(dict(skill=id,root=root,presentation=s['presentation_id'],source_skill_id=presentations[s['presentation_id']].get('provenance',{}).get('source_skill_id'),basis=old['basis'],assets=assets))
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');(R/'plan/evidence/task-146/native-bindings.json').write_text(json.dumps(dict(scope=scope,count=len(scope),bindings=audit),ensure_ascii=False,indent=2)+'\n');print('D170 native major skill bindings',len(scope))

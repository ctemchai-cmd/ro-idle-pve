#!/usr/bin/env python3
"""Assemble a local-only pool of actor equipment, UI, scenery, and skill recipes."""
import json
from pathlib import Path

import build_ro_library as bulk

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/ro'
PREP=ASSETS/'prepared'
SKILL_IDS=[5,7,19,20,21,28,29,34,45,46,52,54,56,62,70,73,74,79,81,83,84,85,89,91]


def ref(row,collection='library'):
    return {'id':row['id'],'meta':collection+'/'+row['meta_path']}


def main():
    native=json.loads((ASSETS/'library/catalog.json').read_text())['assets']
    prepared=json.loads((PREP/'catalog.json').read_text())['assets']
    classes=json.loads((ASSETS/'library/class-coverage.json').read_text())['classes']
    prep_meta={r['id']:json.loads((PREP/r['meta_path']).read_text()) for r in prepared}
    native_by_id={r['id']:r for r in native}
    def gender(row):
        path=row['source_path'] or ''
        return 'female' if '\\여\\' in path or '_여' in path else 'male'
    actors=[]
    for klass in classes:
        if klass['id'] not in range(0,21):continue
        for body in klass['body_assets']:
            row=native_by_id[body['id']];sex=gender(row)
            head=next((r for r in native if r['kind']=='head_atlas' and r['source_path'].endswith(f'\\인간족\\머리통\\{"남" if sex=="male" else "여"}\\1_{"남" if sex=="male" else "여"}.spr')),None)
            if not head:continue
            weapons=[r for r in native if r['kind']=='weapon_overlay_atlas' and klass['sprite'] in r['source_path'].split('\\') and gender(r)==sex]
            wanted={0:'_검.spr',1:'_검.spr',2:'_롯드.spr',3:'_활.spr',4:'_클럽.spr',5:'_도끼.spr',6:'_단검.spr',
                    7:'_검.spr',8:'_클럽.spr',9:'_롯드.spr',10:'_도끼.spr',11:'_활.spr',12:'_카타르_카타르.spr',
                    14:'_검.spr',15:'_너클.spr',16:'_책.spr',17:'_단검.spr',18:'_도끼.spr',19:'_악기.spr',20:'_채찍.spr'}.get(klass['id'],'_검.spr')
            weapons.sort(key=lambda r:(not r['source_path'].endswith(wanted),r['source_path']))
            weapon=None;attack_index=46
            body_meta=json.loads((ASSETS/'library'/row['meta_path']).read_text())
            body_indices={a['source_action_index'] for a in body_meta['animation']['actions']}
            for candidate in weapons:
                m=json.loads((ASSETS/'library'/candidate['meta_path']).read_text())
                attack=next((a for a in m['animation']['actions'] if a['source_action_index'] in body_indices and a['source_action_index'] in [46,86,94,102] and any(f['layers'] for f in a['frames'])),None)
                if attack:weapon=candidate;attack_index=attack['source_action_index'];break
            actors.append({'id':f'{klass["id"]}-{sex}','name':klass['constant'].removeprefix('JT_')+' / '+sex,
                           'class_id':klass['id'],'class_sprite':klass['sprite'],'gender':sex,
                           'body':ref(row),'head':ref(head),'weapon':ref(weapon) if weapon else None,'attack_source_action_index':attack_index})
    wardrobe=[]
    for row in prepared:
        if row['category'] not in ['headgear','garments','shields']:continue
        e=row['equipment'] or {};wardrobe.append({**ref(row,'prepared'),**e,'category':row['category'],'name':row['name']})
    # Curated classic hat views in the controls; the full wardrobe stays searchable.
    classic_views=[1,2,3,4,5,6,7,8,9,11,12,13,15,16,17,18,19,20,28,40,44,45]
    hats=[r for r in wardrobe if r['category']=='headgear' and set(r['view_ids']) & set(classic_views)]
    recipes=[]
    for ident in SKILL_IDS:
        original=json.loads((ASSETS/f'library/skill-assets/{ident}.json').read_text())
        family='burst';color='#ffe396'
        if ident in [19,20,21,81,83,84,85,91]:family='bolt';color={19:'#ff824f',20:'#9beaff',21:'#c9bbff'}.get(ident,'#f5d879')
        if ident in [28,54,70]:family='heal';color='#8effc5'
        if ident in [29,34,45,73,74]:family='buff';color='#bbe7ff'
        if ident==46:family='arrow';color='#fff3cc'
        native_effect=None
        if ident==89:
            target=original['effects']['effectId']['components'][0]['assets'][0]['asset']
            native_effect={'meta':'library/'+target['meta_path'],'id':target['id']}
        sounds=[]
        def gather(value):
            if isinstance(value,dict):
                asset=value.get('asset')
                if asset and asset['kind']=='sound' and asset['status']=='exported':sounds.append('library/'+asset['meta_path'])
                for v in value.values():gather(v)
            elif isinstance(value,list):
                for v in value:gather(v)
        gather(original)
        sound_basis='source skill mapping'
        if not sounds:
            fallback=next(r for r in native if r['kind']=='sound' and r['name']=='_attack_spear')
            sounds=['library/'+fallback['meta_path']]
            sound_basis='authored reuse of native spear attack sound'
        recipes.append({'skill_id':ident,'name':original['constants'][0] if original['constants'] else str(ident),
                        'icon':{'meta':'library/'+original['icons'][0]['meta_path']} if original['icons'] else None,
                        'family':family,'color':color,'duration_ms':1900 if native_effect else 1000,
                        'native_effect':native_effect,'sounds':list(dict.fromkeys(sounds))[:1],'sound_basis':sound_basis,
                        'visual_basis':'native STR metadata' if native_effect else 'authored prototype animation; not an exact reconstruction of the original RO skill',
                        'runtime':'preview/asset-lab/renderer.mjs','ready':True})
    backgrounds=[];music=[];font=None
    for row in prepared:
        m=prep_meta[row['id']]
        if row['category']=='backgrounds':backgrounds.append({**ref(row,'prepared'),'name':m['map'],'map':m['map'],'stage':m['battle_stage']})
        if row['category']=='music':music.append({**ref(row,'prepared'),'map':m['map']})
        if row['category']=='fonts':font={**ref(row,'prepared'),'file':'prepared/'+m['file']['path']}
    monsters=[]
    for name in ['poring','fabre','willow','lunatic','baphomet','orc_warrior']:
        row=next((r for r in native if r['kind']=='monster_atlas' and r['source_path'].endswith('\\'+name+'.spr')),None)
        if row:monsters.append({**ref(row),'name':name})
    event_names={'ui_confirm':'버튼소리','ui_cancel':'취소','level_up':'levelup','victory':'levelup','defeat':'취소',
                 'attack_sword':'_attack_sword','attack_bow':'_attack_bow','attack_rod':'_attack_rod','attack_dagger':'_attack_dagger',
                 'attack_axe':'_attack_axe','attack_mace':'_attack_mace','hit':'_enemy_hit_normal1','heal':'_heal_effect','cast_start':'ef_beginspell'}
    audio_events={event:ref(next(r for r in native if r['kind']=='sound' and r['name']==name)) for event,name in event_names.items()}
    data={'schema_version':1,'generated_at':bulk.now(),'path_base':'assets/ro/','scope':'preparation content pool; party size, balance and final game scope remain unconfirmed',
          'actors':actors,'backgrounds':backgrounds,'music':music,'font':font,'classic_hats':hats,'wardrobe':wardrobe,'skill_recipes':recipes,'monsters':monsters,'audio_events':audio_events,
          'counts':{'actor_presets':len(actors),'backgrounds':len(backgrounds),'music':len(music),'wardrobe_records':len(wardrobe),'skill_recipes':len(recipes)},
          'uses_only_local_files':True}
    bulk.write_json(PREP/'game-pack.json',data)
    bulk.write_json(PREP/'skill-recipes.json',{'schema_version':1,'path_base':'assets/ro/','recipes':recipes})
    # Font URL is stable after content-hash naming and works relative to the asset lab.
    css=f"@font-face{{font-family:ROThai;src:url('../../assets/ro/{font['file']}') format('woff2');font-weight:100 900;font-display:swap}}\n"
    (ROOT/'preview/asset-lab/font.css').write_text(css)
    print(json.dumps(data['counts']))


if __name__=='__main__':main()

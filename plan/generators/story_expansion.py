"""Append data-authored chapters without recalibrating the original130 stages."""
import json, math
from copy import deepcopy
from pathlib import Path

SPEC=json.loads(Path(__file__).with_name('story-expansion.json').read_text())

def append_chapters(rows, profiles, heavy_casts, time_limit_ms):
    identities={row['id']:row for row in SPEC['enemies']}
    for chapter in SPEC['chapters']:
        c,count=chapter['chapter'],chapter['count']
        assert count in (30,50) and count%len(chapter['zones'])==0
        per_zone=count//len(chapter['zones'])
        for i in range(1,count+1):
            previous=rows[-1]; previous_base=previous['encounter'][0]['resolved_base']
            zone=chapter['zones'][(i-1)//per_zone]
            final=i%per_zone==0
            identity=zone['boss'] if final else zone['monsters'][(i-1)%len(zone['monsters'])]
            level=chapter['level_range'][0]+math.floor((chapter['level_range'][1]-chapter['level_range'][0])*(i-1)/(count-1))
            stats=deepcopy(previous_base)
            stats['max_hp']=math.ceil(previous_base['max_hp']*(chapter.get('entry_multiplier',{}).get('hp',1) if i==1 and 'entry_multiplier' in chapter else chapter['growth_per_5']['hp']**.2))
            stats['physical_attack']=math.ceil(previous_base['physical_attack']*(chapter.get('entry_multiplier',{}).get('attack',1) if i==1 and 'entry_multiplier' in chapter else chapter['growth_per_5']['attack']**.2))
            stats['magical_attack']=stats['physical_attack']
            stats['physical_defense']=stats['magical_defense']=6*level+8
            # Existing fixed primary/speed budgets; no automatic AGI/DEX growth.
            slots=list(profiles[identity])
            heavy=i%chapter['heavy_every']==0
            if heavy:slots=[heavy_casts[(i//chapter['heavy_every']-1)%len(heavy_casts)]]+slots[:3]
            slots += [None]*(4-len(slots))
            element=identities[identity]['element'] if identity in identities else SPEC['identity_elements'][identity]
            boss={'actor_id':'enemy_front','definition_id':identity,'level':level,'position':'front_1',
                  'element':element,
                  'resolved_base':stats,'active_slots':slots,'passives':['enemy_adaptive_cc'] if i==count else []}
            encounter=[boss]
            for n,mob in enumerate(zone['monsters']):
                mob_stats=deepcopy(stats);mob_stats['max_hp']=round(stats['max_hp']/4)
                mob_stats['physical_attack']=mob_stats['magical_attack']=round(stats['physical_attack']*.6)
                kit=list(profiles[mob])
                encounter.append({'actor_id':f'enemy_add_{n}','definition_id':mob,'level':level,
                                  'position':['front_2','back_1','back_2'][n],'element':identities[mob]['element'],
                                  'resolved_base':mob_stats,'active_slots':kit+[None]*(4-len(kit)),'passives':[]})
            solutions=[{'strategy':'interrupt heavy casts with stun, freeze, silence or interrupt','example_skill_ids':['swordsman_bash','sage_spell_breaker'],'examples_are_mandatory':False},
                       {'strategy':'counter elemental armor with weapon endow or fixed-element skills; support through ordinary attacks','example_skill_ids':['wizard_meteor','priest_kyrie'],'examples_are_mandatory':False}]
            rows.append({'id':f'{c}-{i}','chapter':c,'index':i,'unlock_after':previous['id'],
                         'recommended_party_level':level,'time_limit_ms':chapter.get('time_limit_ms',time_limit_ms),'enemy_identity':'definition',
                         **({'release_gate':deepcopy(chapter['release_gate'])} if 'release_gate' in chapter else {}),
                         'encounter':encounter,'background':deepcopy(chapter['background']),'music':deepcopy(chapter['music']),
                         'first_clear_reward':{key: total//count+(1 if i<=total%count else 0) for key,total in {'gold':2500*c*c,'hero_exp':4000*c*c,'skill_manual':100*c,'crystal':200}.items()},
                         'repeat_clear_reward':{},'farm_rate_chapter':c,'mechanic':[zone['name'],*slots[:1]] if heavy else [zone['name'],*profiles[identity]],
                         'solutions':solutions if final or heavy else [],
                         'balance_target':{**deepcopy(previous['balance_target']),'first_clear_seconds':[12,35],'not_measured_yet':True}})
    return rows

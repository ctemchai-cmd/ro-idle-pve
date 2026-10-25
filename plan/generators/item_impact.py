"""D-103 equipment roles; base/tier/rarity/Refine/old option rolls stay independent."""
from copy import deepcopy
from pathlib import Path
import json

POLICY = json.loads(Path(__file__).with_name('build-impact-spec.json').read_text())
POWER = {1: .025, 20: .045, 40: .07, 60: .10, 80: .13, 100: .16}
GUARD = {1: .01, 20: .02, 40: .03, 60: .04, 80: .05, 100: .06}

def card_power(row):
    """Uniform semantic power rules for every card, including future catalog entries."""
    result = deepcopy(row)
    factor = POLICY['power_multiplier']
    growth = {}
    for modifier in list(result['modifiers']):
        stat = modifier['stat']
        reference = POLICY['card_flat_stat_reference'].get(stat)
        if modifier['op'] == 'add_flat' and reference and modifier['value'] > 0:
            growth[stat] = growth.get(stat, 0) + modifier['value'] / reference * factor
        elif modifier['op'] == 'add_flat' and modifier['value'] > 0 and stat in POLICY.get('card_primary_growth', {}):
            for derived, coefficient in POLICY['card_primary_growth'][stat].items():
                growth[derived] = growth.get(derived, 0) + modifier['value'] * coefficient / POLICY['card_flat_stat_reference'][derived] * factor
        elif modifier['op'] == 'add_flat' and stat in ('outgoing_physical_bonus', 'outgoing_magical_bonus', 'outgoing_true_bonus', 'outgoing_healing_bonus'):
            modifier['value'] = round(modifier['value'] * factor, 6)
    for stat, value in growth.items():
        result['modifiers'].append({'id': 'impact_'+stat, 'stat': stat, 'op': 'add_percent', 'bucket': 'derived', 'value': round(value, 6)})
    for trigger in result['triggers']:
        for effect in trigger['effects']:
            if effect['type'] == 'damage':
                effect['formula']['params'] = {key: round(value * factor, 6) if isinstance(value, (int, float)) else value for key, value in effect['formula']['params'].items()}
    return result

def apply_roles(definitions):
    for item in definitions:
        # Rebuilding from already-authored data must never compound the added role modifiers.
        item['modifiers'] = [m for m in item['modifiers'] if not m['id'].startswith('impact_')]
        slot, family, sid = item['slot'], item['weapon_type'], item['id']
        power, guard = POWER[item['tier_level']], GUARD[item['tier_level']]
        def add(stat, value, op='add_flat', bucket='bonus'):
            item['modifiers'].append({'id': 'impact_'+stat, 'stat': stat, 'op': op, 'bucket': bucket, 'value': round(value, 4)})
        if slot == 'weapon':
            if family in ('instrument', 'whip'):
                add('outgoing_healing_bonus', power * (.5 if sid.endswith('_b') else 1))
                if sid.endswith('_b'): add('sp_cost_percent', -guard)
            elif sid.endswith('_b') and family in ('sword', 'bow', 'dagger', 'knuckle'):
                add('normal_damage_bonus', power*1.25)
            else:
                add('skill_damage_bonus', power*(.7 if sid.endswith('_b') else 1))
                if sid.endswith('_b') and family in ('staff', 'book'): add('sp_cost_percent', -guard)
        elif slot == 'head':
            if sid.endswith('_helm'): add('max_hp', guard, 'add_percent', 'derived')
            else: add('skill_damage_bonus', power*(.6 if sid.endswith('_circlet') else .5))
        elif slot == 'armor':
            if sid.endswith('_robe'):
                add('sp_regen_percent', power*1.2); add('healing_received_bonus', power*.5)
            elif sid.endswith('_suit'): add('normal_damage_bonus', power*.4)
            else: add('guard_percent', guard)
        elif slot == 'garment':
            if sid.endswith('_cape'): add('normal_damage_bonus', power*.4)
            elif sid.endswith('_manteau'): add('healing_received_bonus', power)
            else: add('max_hp', guard, 'add_percent', 'derived')
        elif slot == 'shoes':
            if sid.endswith('_boots'): add('guard_percent', guard*.5)
            elif sid.endswith('_sandals'): add('healing_received_bonus', power*.4)
            else: add('max_hp', guard*1.5, 'add_percent', 'derived')
        elif slot == 'accessory':
            if sid.endswith('_power') or sid.endswith('_rosary'): add('normal_damage_bonus', power*.5)
            elif sid.endswith('_wisdom'): add('skill_damage_bonus', power*.5)
            else: add('sp_regen_percent', power*1.2)

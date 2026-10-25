"""D172: append Lv80/100 versions without repricing or rewriting existing items."""
from copy import deepcopy
from item_impact import apply_roles

HIGH_TIERS = (80, 100)


def apply(equipment, strings):
    legacy = [row for row in equipment['definitions'] if row['tier_level'] <= 60]
    by_id = {row['id']: row for row in legacy}
    presentations = {row['id']: row for row in equipment['presentations']}
    output, visuals = list(legacy), [p for p in equipment['presentations'] if p['id'] in {row['presentation_id'] for row in legacy}]
    names = dict(strings['strings'])
    for tier in HIGH_TIERS:
        steps = (tier - 60) // 20
        additions = []
        for template in (row for row in legacy if row['tier_level'] == 60):
            row = deepcopy(template)
            previous = by_id[template['id'].replace('_60', '_40')]
            old_mods = {modifier['id']: modifier for modifier in previous['modifiers']}
            for modifier in row['modifiers']:
                modifier['value'] = round(modifier['value'] + steps * (modifier['value'] - old_mods[modifier['id']]['value']), 4)
            row['id'] = template['id'].replace('_60', f'_{tier}')
            row['name_key'] = row['id']
            row['tier_level'] = row['required_level'] = tier
            row['presentation_id'] = 'visual_' + row['id']
            additions.append(row)
            visual = deepcopy(presentations[template['presentation_id']])
            visual['id'] = row['presentation_id']
            visual['basis'] = 'D172: higher-level version of the same equipment family; reuses its genuine native inventory icon, not a new RO item ID'
            visuals.append(visual)
            names[row['name_key']] = names[template['name_key']].removesuffix('Lv.60') + f'Lv.{tier}'
        apply_roles(additions)
        output.extend(additions)
    return {**equipment, 'definitions': output, 'presentations': visuals,
            'future_definitions': [], 'future_tiers': {'80': True, '100': True},
            'random_options': {**equipment['random_options'], 'tier_scale': {**equipment['random_options']['tier_scale'], '80': 3, '100': 3.5}}}, {**strings, 'strings': names}

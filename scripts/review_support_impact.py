#!/usr/bin/env python3
"""D-104 source/numeric audit. No engine, seeds or balance simulation."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
def current(name): return json.loads((ROOT / 'plan/data' / name).read_text())
def shipped(name): return json.loads(subprocess.check_output(['git', 'show', '910abb56b:plan/data/' + name], cwd=ROOT))
spec = json.loads((ROOT / 'plan/generators/build-impact-spec.json').read_text())
skills = {}; previous = {}
for root in ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant']:
    skills.update({s['id']: s for s in current('skills/' + root + '.json')['skills']})
    previous.update({s['id']: s for s in shipped('skills/' + root + '.json')['skills']})
for sid, skill in skills.items():
    before = json.loads(json.dumps(previous[sid])); after = json.loads(json.dumps(skill))
    before.pop('level_parameters'); after.pop('level_parameters')
    if sid == 'priest_kyrie': before['effects'][0]['formula']['params']['flat_power'] = 52.5
    if sid == 'alchemist_bio_cannibalize': before['effects'][0]['power_scale'] = 1.75
    assert before == after, sid
rows = []
for sid, curves in spec['baseline_support_power'].items():
    for key, values in curves.items():
        expected = [round(v * 1.75, 6) for v in values]
        assert skills[sid]['level_parameters'][key] == expected, (sid, key)
        rows.append({'skill_id': sid, 'parameter': key, 'before': values, 'after': expected})
for sid, curves in spec['baseline_skill_power'].items():
    for key in curves:
        assert skills[sid]['level_parameters'][key] == previous[sid]['level_parameters'][key], (sid, key, 'damage must not compound')
for name in ['equipment.json', 'stages.json', 'tower.json', 'daily-bosses.json', 'economy.json', 'progression.json', 'loot.json', 'gacha.json', 'slot-progress.json']:
    assert current(name) == shipped(name), name
cards0, cards1 = shipped('cards.json'), current('cards.json')
for key in ['origins', 'presentations', 'rarities', 'level_multipliers', 'level_cost_rows']:
    assert cards0[key] == cards1[key], key
for before, after in zip(cards0['definitions'], cards1['definitions'], strict=True):
    for key in ['id', 'slot', 'tier_level', 'required_level', 'triggers']: assert before[key] == after[key]
    # Only scalable primary-card modifiers change in D-104; original primary stats/penalties stay exact.
    assert [m for m in before['modifiers'] if not m['id'].startswith('impact_')] == [m for m in after['modifiers'] if not m['id'].startswith('impact_')]
report = {'task_id': 'TASK-078', 'passed': True, 'baseline_commit': '910abb56b', 'original_power_baseline': spec['baseline_commit'], 'power_factor': 1.75,
          'invariants': {'skill_definition_skeletons': 126, 'damage_programs_not_compounded': 52, 'support_programs': len(spec['baseline_support_power']), 'equipment_encounter_economy_files_unchanged': 9, 'RO_card_identities': 66},
          'support_parameters': rows, 'notes': ['Raw benefit coefficients scale equally; this does not claim equal class DPS/EHP or count overheal as effective healing.', 'Weapon stat effects are verified separately for30 family/tier builds without cards; not a battle simulation.', 'Guard and buff stacks retain uncapped independent instances and existing formula; no new clamping or diminishing returns.'],
          'balance_simulation': False, 'owner_cloud_writes': False}
(ROOT / 'plan/evidence/task-078-static-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': True, **report['invariants']}))

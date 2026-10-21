#!/usr/bin/env python3
"""Apply D-057 status-point rules to plan/data/progression.json (idempotent).

Points gained when reaching level L (L >= 2): 3 + floor(L/5)  (Ragnarok-style; Lv10 = 34, Lv20 = 91, Lv70 = 676 total).
The per-step allocation cost rule stays '1 + floor((current_value - 1)/10)'. Primary milestone bonuses live in
combat-rules.json primary_milestone_bonus. Usage: --write | --check
"""
import argparse, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / 'plan/data/progression.json'
RULE = '3 + floor(new_level/5)'

def gained(level): return 3 + level // 5
def total(level): return sum(gained(l) for l in range(2, level + 1))
def cost(value): return 1 + (value - 2) // 10  # price of raising to `value`

def apply(data):
    for row in data['progression']['level_rows']: row['total_status_points'] = total(row['level'])
    allocation = data['status_allocation']
    allocation.pop('points_per_level_gained', None)
    allocation['points_per_level_rule'] = RULE
    allocation['points_per_level_rule_source'] = 'D-057 Ragnarok-style growth; numbers are an assistant baseline to tune in TASK-041'
    cases = data['reference_cases']
    for row in cases['milestones']: row['status_points'] = total(row['level'])
    cap, budget = allocation['manual_value_max'], total(70)
    value, spent = 1, 0
    while value < cap and spent + cost(value + 1) <= budget: value += 1; spent += cost(value)
    cases['level70_single_stat'] = {'value': value, 'spent_points': spent, 'unspent_points': budget - spent}
    for key in ('actor_before', 'actor_after_remove_and_readd'):
        actor = cases['roster_identity_case'][key]
        used = sum(sum(cost(v) for v in range(2, target + 1)) for target in actor['primary_stats'].values())
        actor['unspent_status_points'] = total(actor['level']) - used
    return data

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); parser.add_argument('--check', action='store_true'); args = parser.parse_args()
    text = PATH.read_text(); data = json.loads(text)
    assert json.dumps(data, indent=2, ensure_ascii=False) + '\n' == text, 'progression.json is not in canonical formatting'
    result = json.dumps(apply(data), indent=2, ensure_ascii=False) + '\n'
    if args.write: PATH.write_text(result)
    print(json.dumps({'lv10': total(10), 'lv20': total(20), 'lv40': total(40), 'lv70': total(70), 'matches': result == text}))
    if args.check and result != text: raise SystemExit(1)

if __name__ == '__main__':
    main()

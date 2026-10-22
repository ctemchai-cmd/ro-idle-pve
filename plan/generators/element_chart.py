#!/usr/bin/env python3
"""Transcribe the ROO Global guide's in-game Elemental Effectiveness screenshot.

Rows attack / columns defense, source percentages are bonuses relative to100%.
The retained screenshot is primary evidence; no table from RO PC or another RO title.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ORDER = ['neutral', 'wind', 'earth', 'fire', 'water', 'poison', 'holy', 'dark', 'ghost', 'undead']
SOURCE_BONUS_PERCENT = [
    [0, 0, 0, 0, 0, 0, 0, 0, -30, 0],
    [0, -75, -20, 0, 75, 0, -25, 0, 0, 0],
    [0, 75, -75, -20, 0, 0, -25, 0, 0, 0],
    [0, 0, 75, -75, -20, 0, -25, 0, 0, 50],
    [0, -10, 0, 75, -75, 0, -25, 0, 0, 0],
    [0, 25, 25, 25, 25, -75, -50, -50, 0, -75],
    [0, 0, 0, 0, 0, 0, -75, 50, 0, 75],
    [0, 0, 0, 0, 0, -50, 50, -75, 0, -75],
    [-30, 0, 0, 0, 0, 0, -25, -25, 50, 25],
    [0, 0, 0, 0, 0, -50, 25, -75, 0, -75],
]
REFERENCE = {
    'id': 'ragnarok_origin_global_v1',
    'title': 'Ragnarok Origin',
    'guide_url': 'https://roo-global.gitbook.io/guide/game-wiki/element',
    'source': 'In-game Elemental Effectiveness screenshot embedded in the ROO Global guide, written by Mumei #4529 from ROO Discord Tavern',
    'screenshot_date': '2023-05-05',
    'verified_on': '2026-10-22',
    'screenshot_sha256': '6f41ab37af3ad9e8dac77a8c01e68ebc45f779ce97b7fc72accc5d63b86d6915',
    'orientation': 'attack row / defense column',
    'source_percentages': 'bonus relative to 100%; dot means zero bonus, not zero damage',
    'runtime_values': 'total damage multiplier: (100+source_bonus_percent)/100',
    'scope': 'One10x10table, no elemental levels. This adopts the chart only, not ROO skill elements, armor cards, conversions, stats or whole-game formulas. Current server variants are not claimed identical.',
}

def authored_chart(order):
    source = {attack: {armor: (100 + SOURCE_BONUS_PERCENT[i][j]) / 100 for j, armor in enumerate(SOURCE_ORDER)} for i, attack in enumerate(SOURCE_ORDER)}
    return {attack: {armor: source[attack][armor] for armor in order} for attack in order}

def main():
    args = argparse.ArgumentParser(); args.add_argument('--write', action='store_true'); args.add_argument('--check', action='store_true'); options = args.parse_args()
    path = ROOT / 'plan/data/combat-rules.json'; rules = json.loads(path.read_text()); chart = authored_chart(list(rules['element_chart']))
    if options.write:
        rules['element_chart'] = chart; rules['element_chart_reference'] = REFERENCE
        path.write_text(json.dumps(rules, ensure_ascii=False, indent=2) + '\n')
    assert rules['element_chart'] == chart, 'ROO_CHART_NOT_REPRODUCIBLE'
    assert rules.get('element_chart_reference') == REFERENCE, 'ROO_CHART_PROVENANCE_MISSING'
    assert len(chart) == 10 and all(len(row) == 10 for row in chart.values())
    print(json.dumps({'passed': True, 'pairs': 100, 'profile': REFERENCE['id'], 'percentages_are_total_damage': True}))

if __name__ == '__main__': main()

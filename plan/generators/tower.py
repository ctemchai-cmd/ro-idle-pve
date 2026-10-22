#!/usr/bin/env python3
"""Reproduce the first100 Tower rows from the same authored polynomial parameters.

Usage: python3 plan/generators/tower.py --write | --check
No balance simulation, stage reset, rewards change or remote write.
"""
import argparse
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'data/tower.json'

def rows(data):
    g = data['generator']
    for floor in range(1, data['authored_initial_rows'] + 1):
        def curve(key):
            p = g[key]
            n = p['base'] + p['linear'] * floor + p.get('quadratic', 0) * floor**2 + p.get('cubic', 0) * floor**3
            divisor = p.get('divisor', 1)
            assert isinstance(n, int) and 0 <= n <= 9007199254740991
            assert isinstance(divisor, int) and divisor > 0
            return (n + divisor - 1) // divisor
        yield {'floor': floor, 'hp': curve('hp'), 'attack': curve('attack'), 'defense': curve('defense'),
               'definition_id': g['template_cycle'][(floor - 1) % len(g['template_cycle'])],
               'gold': curve('reward_gold'), 'crystal': g['crystal_amount'] if floor % g['crystal_every'] == 0 else 0,
               'bronze_card_count': 1 if floor % g['bronze_card_every'] == 0 else 0}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = json.loads(OUT.read_text())
    generated = list(rows(data))
    if args.write:
        data['floor_rows'] = generated
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    assert data['floor_rows'] == generated, 'Tower rows differ from authored generator'
    print(json.dumps({'passed': True, 'authored_rows': len(generated), 'balance_simulation': False}))

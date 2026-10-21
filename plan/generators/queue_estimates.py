#!/usr/bin/env python3
"""Recompute every example build's dry queue_estimate from its primary stats plus the D-061 job bonus.

Same arithmetic as plan/checks/classes.py and src/domain/build/queue-trace.ts: unbuffed timing, learned
permanent Passives included, temporary buffs/SP/CC/procs excluded. Usage: --write | --check
"""
import argparse, json, sys
from math import ceil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'plan/checks'))
import composition as c  # noqa: E402

ROOTS = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant']
BONUS = json.loads((ROOT / 'plan/data/progression.json').read_text())['status_allocation']['job_bonus_by_root']

def final_stats(build, root):
    return {k: v + BONUS[root].get(k, 0) for k, v in build['primary_stats'].items()}

def estimate(build, skills, root):
    st = final_stats(build, root)
    aspd = 100 + (st['agi'] - 1) + .25 * (st['dex'] - 1); cs = 100 + 1.5 * (st['dex'] - 1) + .25 * (st['int'] - 1)
    permanent = [c.resolve(skills[sid], {k: v[build['skill_levels'][sid] - 1] for k, v in skills[sid]['level_parameters'].items()}) for sid in build['automatic_passives']]
    def timing(base, key):
        mods = [m for p in permanent for m in p['modifiers'] if m['stat'] == key]
        return max(1, (base + sum(m['value'] for m in mods if m['op'] == 'add_flat')) * (1 + sum(m['value'] for m in mods if m['op'] == 'add_percent')))
    aspd = timing(aspd, 'attack_speed'); cs = timing(cs, 'cast_speed'); si = ceil(150000 / aspd); at = 0; sp = 0; starts = []
    for sid in build['active_slots']:
        raw = skills[sid]; s = c.resolve(raw, {k: v[build['skill_levels'][sid] - 1] for k, v in raw['level_parameters'].items()})
        at += si; ct = ceil(s['timing']['cast_ms'] * 100 / cs) if s['timing']['cast_ms'] else 0; acd = ceil(s['timing']['after_cast_ms'] * 100 / cs) if s['timing']['after_cast_ms'] else 0
        starts.append({'skill_id': sid, 'start_ms': at, 'resolve_ms': at + ct, 'acd_end_ms': at + ct + acd}); at += ct + acd
        if isinstance(s['cost']['sp'], (int, float)): sp += s['cost']['sp']
    return aspd, cs, {'si_ms': si, 'cycle_ms': at, 'starts': starts, 'fixed_sp_per_cycle': sp}

def apply(data, root):
    skills = {s['id']: s for s in data['skills']}
    for build in data['builds']:
        aspd, cs, values = estimate(build, skills, root); q = build['queue_estimate']
        if 'attack_speed_rating' in q: q['attack_speed_rating'] = aspd
        if 'cast_speed_rating' in q: q['cast_speed_rating'] = cs
        q.update(values); q['job_bonus'] = 'D-061 job bonus included in primary stats'
    return data

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); parser.add_argument('--check', action='store_true'); args = parser.parse_args(); changed = []
    for root in ROOTS:
        path = ROOT / f'plan/data/skills/{root}.json'; text = path.read_text(); result = json.dumps(apply(json.loads(text), root), indent=2, ensure_ascii=False) + '\n'
        if result != text: changed.append(root)
        if args.write: path.write_text(result)
    print(json.dumps({'changed': changed}))
    if args.check and changed: raise SystemExit(1)

if __name__ == '__main__':
    main()

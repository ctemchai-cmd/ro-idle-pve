"""D-103/104 authored power curves from immutable baselines; no combat simulation."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'plan/data'
SPEC = Path(__file__).with_name('build-impact-spec.json')

def build():
    spec = json.loads(SPEC.read_text())
    docs = {p: json.loads(p.read_text()) for p in (D / 'skills').glob('*.json')}
    skills = {s['id']: s for doc in docs.values() for s in doc['skills']}
    for sid, curves in spec['baseline_skill_power'].items():
        skill = skills[sid]
        for key, values in curves.items():
            if key not in skill['level_parameters']: raise ValueError((sid, key))
            # Flat-only detonation now scales with ATK using the same normalized power budget.
            if sid == 'assassin_detonate' and key == 'power':
                skill['level_parameters'][key] = [0 for _ in values]
                skill['level_parameters']['detonate_ratio'] = [round(v * spec['power_multiplier'] / 100, 6) for v in values]
            else:
                skill['level_parameters'][key] = [round(v * spec['power_multiplier'], 6) for v in values]
    for sid, curves in spec.get('baseline_support_power', {}).items():
        for key, values in curves.items():
            skills[sid]['level_parameters'][key] = [round(v * spec['power_multiplier'], 6) for v in values]
    for row in spec.get('baseline_support_formula_constants', []):
        effect = next(e for e in skills[row['skill_id']]['effects'] if e['id'] == row['effect_id'])
        effect['formula']['params'][row['formula_param']] = round(row['baseline'] * spec['power_multiplier'], 6)
    # Healing Plant shares the same power budget as Hell Plant; HP, duration and ticks stay unchanged.
    if spec.get('baseline_support_power'):
        for sid in ['alchemist_hell_plant', 'alchemist_bio_cannibalize']:
            next(e for e in skills[sid]['effects'] if e['type'] == 'summon')['power_scale'] = spec['power_multiplier']
    # D-132: multiply only Asura's rounded SP curve once, after the immutable baseline.
    for sid, adjustments in spec.get('skill_power_adjustments', {}).items():
        for key, factor in adjustments.items():
            skills[sid]['level_parameters'][key] = [round(v * factor, 6) for v in skills[sid]['level_parameters'][key]]
    # D-133: both Blessing modifiers share a level-scaled lifetime, capped at 10 seconds.
    for sid, values in spec.get('skill_duration_curves', {}).items():
        skill = skills[sid]
        if len(values) != skill['max_level']: raise ValueError((sid, 'duration curve'))
        skill['level_parameters']['duration'] = values
        for effect in skill['effects']:
            if effect['type'] == 'apply_status': effect['duration_ms'] = {'level_param': 'duration'}
    # D-138: exact user-note changes overwrite fixed fields, never multiply prior results.
    from modern_skill_changes import apply
    apply(skills)
    for doc in docs.values():
        for copy in doc.get('copy_whitelist', []):
            source, target = skills[copy['source_skill_id']], skills[copy['skill_id']]
            target['level_parameters'] = json.loads(json.dumps(source['level_parameters']))
    return docs

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write', action='store_true'); ap.add_argument('--check', action='store_true'); args = ap.parse_args()
    docs = build(); changed = []
    for path, doc in docs.items():
        value = json.dumps(doc, ensure_ascii=False, indent=2) + '\n'
        if path.read_text() != value: changed.append(path.name)
        if args.write: path.write_text(value)
    print(json.dumps({'changed': changed, 'scope': 'authored numeric curves only; no battle runner'}))
    if args.check and changed: raise SystemExit(1)

if __name__ == '__main__': main()

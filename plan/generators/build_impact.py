"""D-103 deterministic authored damage curves; does not execute or simulate combat."""
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

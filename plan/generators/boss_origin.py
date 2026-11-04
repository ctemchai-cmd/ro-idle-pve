"""D216 boss defense identities and modest outgoing attack increase; no source guesses."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    spec = json.loads(Path(__file__).with_name('boss-origin-profiles.json').read_text())
    path = ROOT / 'plan/data/enemies.json'
    enemies = json.loads(path.read_text())
    assert set(spec['profiles']) == {a['id'] for a in enemies['actors']}
    profile = {'version': 'origin-defense-v1', 'attack_multiplier': spec['attack_multiplier'],
               'defense_elements': {key: row['element'] for key, row in spec['profiles'].items()}}
    if args.check:
        assert enemies.get('boss_combat') == profile, 'STALE_BOSS_PROFILE'
    else:
        enemies['boss_combat'] = profile
        path.write_text(json.dumps(enemies, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': True, 'boss_identities': len(profile['defense_elements']), 'attack_multiplier': profile['attack_multiplier'], 'hp_changed': False}))

if __name__ == '__main__':
    main()

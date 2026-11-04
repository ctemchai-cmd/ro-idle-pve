"""Bind the visible early-story bosses to real monster identities, without retuning encounters."""
import argparse
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    spec = json.loads(Path(__file__).with_name('boss-identities.json').read_text())
    enemies_path = ROOT / 'plan/data/enemies.json'
    cards_path = ROOT / 'plan/data/cards.json'
    original_enemies = json.loads(enemies_path.read_text())
    original_cards = json.loads(cards_path.read_text())
    enemies, cards = copy.deepcopy(original_enemies), copy.deepcopy(original_cards)
    existing = {a['id']: a for a in enemies['actors']}
    for row in spec['additional_actors']:
        actor = {**copy.deepcopy(existing['poring']), 'id': row['id'], 'presentation': row['presentation']}
        if row['id'] in existing:
            assert existing[row['id']] == actor, row['id']
        else:
            enemies['actors'].append(actor)
        cards['monster_traits'][row['id']] = row['trait']
    profile = enemies['boss_combat']
    profile['defense_elements'] = {key: row['element'] for key, row in spec['profiles'].items()}
    profile['story_identities'] = spec['story_identities']
    assert set(profile['defense_elements']) == {a['id'] for a in enemies['actors']}
    if args.check:
        assert enemies == original_enemies and cards == original_cards, 'STALE_BOSS_IDENTITIES'
    else:
        for path, doc in [(enemies_path, enemies), (cards_path, cards)]:
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': True, 'identities': len(profile['defense_elements']), 'corrected_stages': len(profile['story_identities'])}))

if __name__ == '__main__':
    main()

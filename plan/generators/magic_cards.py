"""Regenerate the card-owned catalog/pool without rewriting unrelated gear or loot."""
import argparse
import json
from pathlib import Path
from card_catalog import build

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'plan/data'

def generate():
    load = lambda name: json.loads((DATA / name).read_text())
    cards, names = build(load('cards.json'))
    strings = load('strings.th.json')
    strings['strings'].update(names)
    gacha = load('gacha.json')
    gacha['definitions'] = [c['id'] for c in cards['definitions']]
    gacha['definition_weights'] = {c['id']: 1000 if cards['origins'][c['id']].get('variant') == 'puppet' else {'normal': 1000, 'mini': 100, 'mvp': 10}[cards['origins'][c['id']]['grade']] for c in cards['definitions']}
    gacha['definition_choice'] = f"D-109: choose rarity then a matching fixed-monster card among all{len(cards['definitions'])} definitions, independent of equipment tier. Farm/Tower retain chapter/tier pools. Original MVP Legendary, Mini Epic, Puppet I Rare."
    return {'cards.json': cards, 'strings.th.json': strings, 'gacha.json': gacha}

if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('--write', action='store_true'); p.add_argument('--check', action='store_true'); args = p.parse_args()
    result = generate()
    for name, value in result.items():
        text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if args.write: (DATA / name).write_text(text)
        if args.check and (DATA / name).read_text() != text: raise ValueError('Stale card data: ' + name)
    print(json.dumps({'cards': len(result['cards.json']['definitions']), 'write': args.write, 'check': args.check}))

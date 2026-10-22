"""D-099: one authored card catalog; preserve stable IDs, derive data/presentations/names."""
from pathlib import Path
import json
from item_impact import card_power

SPEC = Path(__file__).with_name('cards-spec.json')

def build(previous):
    spec = json.loads(SPEC.read_text()); definitions, presentations, origins, names = [], [], {}, {}
    for row in spec['cards']:
        row = card_power(row)
        cid, art = row['id'], f"items.card-{row['ro_item_id']}"
        meta = f"assets/ro/items/card-{row['ro_item_id']}.meta.json"
        definition = {'id': cid, 'name_key': cid, 'kind': 'card', 'slot': row['slot'], 'weapon_type': None, 'tier_level': row['tier'], 'required_level': row['tier'], 'modifiers': row['modifiers'], 'triggers': row['triggers'], 'presentation_id': f'visual_{cid}'}
        if row.get('defense_element'): definition['defense_element'] = row['defense_element']
        definitions.append(definition)
        presentations.append({'id': f'visual_{cid}', 'icon_asset_id': art, 'meta_path': meta, 'illustration_asset_id': art, 'illustration_meta_path': meta, 'symbol_asset_id': art, 'symbol_meta_path': meta, 'basis': 'Native RO cardbmp keyed by RO item ID, retained locally; no skill icon substitution', 'card_face_style': 'native_ro_card', 'illustration_basis': 'Card-specific illustration; ragassets client export'})
        origins[cid] = {k: row[k] for k in ['ro_item_id', 'monster_id', 'monster_name', 'grade', 'source_slot', 'rarity_id', 'source_level', 'strength_class']}
        names[cid] = row['name']
    return {**previous, 'content_version': 'cards-ro-v3', 'catalog_basis': 'D-099 RO identities; D-109 fixed monster strength rarity', 'definitions': definitions, 'presentations': presentations, 'origins': origins, 'monster_traits': spec['monster_traits'], 'rarity_policy': spec['rarity_policy']}, names

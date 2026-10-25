"""D175: explicit native floor bindings. Run after older D170 major-effect authoring."""
import json
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RO = ROOT / 'assets/ro'
parser = argparse.ArgumentParser()
parser.add_argument('--evidence-task', default='task-151')
args = parser.parse_args()
if not re.fullmatch(r'task-\d{3}', args.evidence_task):
    raise ValueError('Invalid evidence task')
OUT = ROOT / 'plan/evidence' / args.evidence_task
FILE = ROOT / 'src/renderer/combat-visuals.json'
value = json.loads(FILE.read_text())
RING = 'library/effects/effect_texture/priest_angel_ring--abc8d5b4fa0c.meta.json'
GROUND_RING = 'library/effects/effect_texture/all_ground--57abef5c9725.meta.json'
MAGIC = 'library/effects/effect_texture/magic_ring_a_s--541bc30a6750.meta.json'
MUD = 'library/effects/effect_texture/quagmire_out--53f3c198e18e.meta.json'
FIRE_RING = 'library/effects/effect_texture/floor_cast--0726bf4aa541.meta.json'
CROSS = 'library/effects/effect_texture/cross_old--f85b1ae938d3.meta.json'
TRAP = 'library/items/world_item_atlas/asset--3f955a83a507.meta.json'
METEOR = 'library/effects/keyframe_effect_atlas/meteor2--1b45e3ebdf39.meta.json'
SANCTUARY_LIGHT = 'library/effects/effect_texture/magic_green--0c6d7c539bfa.meta.json'
GROUND_LIGHT = 'library/effects/effect_texture/pok2--0221e261ee77.meta.json'

def layer(meta, width, height, *, count=1, spread=0, at=(0, 0)):
    return dict(meta=meta, delay_ms=0, duration_ms=1200, count=count, interval_ms=0, alpha=.7,
                fade_in=False, fade_out=False, **{'from': list(at), 'to': list(at)},
                size=[width, height], end_size=[width, height], angle=0, spread=spread,
                radial=False, additive=False)

def field(meta, statuses, scale=.7, anchor='targets', **extra):
    return dict(meta=meta, status_ids=statuses, anchor=anchor, scale=scale, lift=0,
                start_ms=0, lead_ms=0, stagger_ms=0, native_only=True,
                basis='D175 real local RO media, projected from actual status lifetime; 2D area placement is adapted, not added gameplay range.', **extra)

bindings = {
    'priest_sanctuary': field('library/effects/keyframe_effect_atlas/sanctuary--db20ff4546ed.meta.json', ['sanctuary_regeneration'], .65),
    'wizard_storm_gust': field('library/effects/keyframe_effect_atlas/stormgust--2283a43eceda.meta.json', ['frost_field'], .7),
    'wizard_quagmire': field('library/effects/keyframe_effect_atlas/quagmire--0591bb5c4b4a.meta.json', ['slow', 'armor_break'], .9),
    'assassin_venom_dust': field('library/effects/keyframe_effect_atlas/venomdust--b822977c3fce.meta.json', ['venom'], .65),
    'alchemist_demonstration': field('library/effects/keyframe_effect_atlas/firewall--f494e22d2110.meta.json', ['chemical_burn'], .7),
    'alchemist_potion_pitcher': field('library/effects/keyframe_effect_atlas/sanctuary--db20ff4546ed.meta.json', ['regeneration'], .35),
    'professor_soul_change': field('library/effects/keyframe_effect_atlas/new_psychicwave_bottom--5396091ec2af.meta.json', ['psychic_field'], .75),
    'gypsy_moonlit_water_mill': field('library/effects/keyframe_effect_atlas/sanctuary--db20ff4546ed.meta.json', ['guard_up'], .55),
    'paladin_gospel': field(RING, ['guard_up', 'physical_regeneration'], 1, 'source', texture_layers=[layer(RING, 260, 160), layer(CROSS, 34, 50, count=4, spread=48, at=(0, -10))]),
    'hunter_ankle_snare': field(TRAP, ['stun'], 1, texture_layers=[layer(TRAP, 90, 35, at=(0, 5))]),
}
value['ground_fields'] = {'visual_' + skill: profile for skill, profile in bindings.items()}
for skill, profile in bindings.items():
    if skill == 'hunter_ankle_snare':
        continue
    meta, size, alpha, additive = MAGIC, [210, 125], .32, True
    if skill == 'priest_sanctuary':
        meta, size, alpha, additive = SANCTUARY_LIGHT, [260, 160], .28, True
        profile['floor_tiles'] = dict(columns=5, rows=5, surface_meta=GROUND_LIGHT, surface_alpha=.58)
        profile['basis'] = 'D177 Sanctuary STR83 + actual EF_BOTTOM_SANC319 magic_green texture; native GroundEffect pok2.tga white surface. Adapted 5x5 2D tiles, not exact original 3D geometry.'
    elif skill in ['wizard_quagmire', 'assassin_venom_dust']:
        meta, size, alpha, additive = MUD, [210, 130], .65, False
        profile['floor_black_key'] = True
    elif skill == 'alchemist_demonstration':
        meta, size, alpha, additive = FIRE_RING, [240, 140], .65, True
    elif skill in ['paladin_gospel', 'gypsy_moonlit_water_mill', 'alchemist_potion_pitcher']:
        meta, size, alpha, additive = GROUND_RING, [290, 170] if skill == 'paladin_gospel' else [150, 90], .55, True
    profile.update(floor_meta=meta, floor_size=size, floor_alpha=alpha, floor_additive=additive)
    if skill == 'professor_soul_change':
        profile['floor_hue_rotate_deg'] = 40
    if skill == 'gypsy_moonlit_water_mill':
        profile['floor_hue_rotate_deg'] = 280
# Meteor's sky/ground burst gets its actual meteor STR; instant skills stay instant.
value['impacts']['visual_wizard_meteor'].update(meta=METEOR, scale=.75, duration_ms=1700,
    basis='D175 native meteor2 STR from the local client; original keyframes/media, adapted 2D target placement.')
for skill in ['swordsman_magnum_break', 'crusader_grand_cross', 'wizard_heavens_drive', 'wizard_meteor', 'blacksmith_hammer_fall', 'hunter_claymore']:
    value['impacts']['visual_' + skill]['native_only'] = True
# Legacy per-recipient persistent flags are replaced by the shared field projection.
for profile in value['impacts'].values():
    profile.pop('persistent', None)

aura = value['performance_auras']
aura['ring_meta'] = GROUND_RING
aura['ring_size'] = [420, 260]
aura['ring_bounds'] = [9, 8, 110, 74]
aura['alpha'] = .28
aura['note_meta'] = 'library/effects/effect_texture/melody_b--f30d80e2856a.meta.json'
aura['styles'] = {
    'bard': dict(hue_rotate_deg=190, note_meta=aura['note_meta']),
    'bard_healing': dict(hue_rotate_deg=190, note_meta='library/effects/effect_texture/idun_apple--19b59a96a342.meta.json', note_size=36),
    'bard_dissonance': dict(hue_rotate_deg=190, note_meta='library/effects/effect_texture/lens_w--4e5f4b092e79.meta.json', note_size=38, note_additive=True),
    'bard_casting': dict(hue_rotate_deg=190, note_meta='library/effects/effect_texture/spell_01--325346a0eb93.meta.json', note_size=38),
    'dancer': dict(hue_rotate_deg=300, note_meta='library/effects/effect_texture/melody_a--5c6d782a6877.meta.json'),
    'dancer_fortune': dict(hue_rotate_deg=300, note_meta='library/effects/effect_texture/heart_2--857a34afb0bb.meta.json', note_size=38),
}
aura['skills'].update(bard_healing_song='bard_healing', bard_dissonance='bard_dissonance', bard_encore='bard_casting', dancer_battle_song='dancer_fortune')
aura['basis'] = 'D175 native melody_a/b, idun_apple, lens_w, spell_01 and heart_2 from RO song-framework mappings; native ring composes the 2D area, original symbol colors preserved. Not a pixel-identical 3D client field.'
FILE.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

instant = {'swordsman_magnum_break', 'crusader_grand_cross', 'wizard_heavens_drive', 'wizard_meteor', 'blacksmith_hammer_fall', 'hunter_claymore'}
summons = {'alchemist_hell_plant', 'alchemist_bio_cannibalize'}
rows = []
skills = []
for path in sorted((ROOT / 'plan/data/skills').glob('*.json')):
    d = json.loads(path.read_text()); skills += d['skills'] + d.get('hi_class_skills', [])
skills += json.loads((ROOT / 'plan/data/enemies.json').read_text())['skills']
for skill in skills:
    sid = skill['id']; presentation = skill.get('presentation_id')
    role = 'continuous_native_field' if presentation in value['ground_fields'] else 'performance_area' if sid in aura['skills'] else 'instant_native_ground_burst' if sid in instant else 'summoned_actor_not_ground' if sid in summons else 'not_ground'
    rows.append(dict(skill_id=sid, presentation_id=presentation, kind=skill['kind'], role=role))
OUT.mkdir(exist_ok=True)
(OUT / 'ground-catalog.json').write_text(json.dumps({'scope': 'Every authored player/Hi/enemy skill; passive/non-ground attacks are explicitly excluded, no invented field duration.', 'skills': rows}, indent=2) + '\n')
refs = {METEOR, RING, CROSS, TRAP, GROUND_RING, MAGIC, MUD, FIRE_RING, SANCTUARY_LIGHT, GROUND_LIGHT}
refs.update(p['meta'] for p in bindings.values())
refs.update(s['note_meta'] for s in aura['styles'].values())
audit = []
for ref in sorted(refs):
    meta = json.loads((RO / ref).read_text())
    if meta.get('missing_dependencies') or meta['status'] != 'exported':
        raise ValueError('Unresolved floor source: ' + ref)
    audit.append(dict(meta=ref, source=meta['source']['path'], media=meta['file']['path'], sha256=meta['file']['sha256'], status=meta['status']))
(OUT / 'native-bindings.json').write_text(json.dumps({'source_reference': 'https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/Songs.js', 'selected': audit, 'continuous_skills': list(bindings), 'instant_ground_skills': sorted(instant), 'performance_skills': sorted(aura['skills'])}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'continuous': len(bindings), 'songs': len(aura['skills']), 'instant_ground': len(instant), 'catalog_skills': len(rows), 'selected_native_refs': len(refs)}))

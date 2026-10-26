"""Select the Class2 runtime dependency closure without changing source assets.

Only sidecars and checksums are read. ACT/STR data is already inside sidecars;
packed STR textures must use file.path, not the old source texture filenames.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RO = ROOT / 'assets/ro'
OUT = ROOT / 'runtime/ro'
DATA = ROOT / 'plan/data'
COMBAT_VISUALS = ROOT / 'src/renderer/combat-visuals.json'
# Presentation-only shell icons and ambient farm skins; never gameplay data.
SHELL_VISUALS = ROOT / 'src/renderer/shell-visuals.json'
SIDECAR_ENCODING = 'compact-json-safe-integers-v1'

def read(path):
    return json.loads(Path(path).read_text())

def sha(data):
    return hashlib.sha256(data).hexdigest()

def encoded(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()

def runtime_presentations(presentations):
    """The renderer resolves icons by meta path; authoring provenance stays in source.

    These two fields are not part of RuntimeAssetIndex.SkillPresentation. Keep
    every actual visual/audio/recipe field, and never alter source sidecars.
    """
    return {key: {field: value for field, value in row.items()
                  if field not in ('provenance', 'icon_asset_id')}
            for key, row in presentations.items()}

def compact_metadata(value):
    """Same JSON.parse values; integral JSON numbers have no float/int distinction.

    Preserve negative zero, large floats, array order, fields and STR special strings.
    This touches generated runtime bytes only, never the source sidecar or media.
    """
    if isinstance(value, dict):
        return {k: compact_metadata(v) for k, v in value.items()}
    if isinstance(value, list):
        return [compact_metadata(v) for v in value]
    if type(value) is float and value.is_integer() and abs(value) <= 9007199254740991 and not (value == 0 and math.copysign(1, value) < 0):
        return int(value)
    return value

def runtime_payload(path, ro_root=RO):
    source = ro_root / path
    return encoded(compact_metadata(read(source))) if path.endswith('.meta.json') else source.read_bytes()

def walk(value):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

def relative_ref(value):
    value = value.removeprefix('assets/ro/')
    p = Path(value)
    if p.is_absolute() or '..' in p.parts:
        raise ValueError('Unsafe asset path: ' + value)
    return p.as_posix()

def collect_refs(value):
    return {relative_ref(node) for node in walk(value) if isinstance(node, str) and node.endswith('.meta.json')}

def declared_ids(value):
    claims = {}
    for node in walk(value):
        if not isinstance(node, dict):
            continue
        pairs = [('meta', 'id'), ('icon_meta_path', 'icon_asset_id'),
                 ('illustration_meta_path', 'illustration_asset_id'), ('symbol_meta_path', 'symbol_asset_id')]
        if 'meta_path' in node:
            pairs.append(('meta_path', 'icon_asset_id' if 'icon_asset_id' in node else 'asset_id'))
        for meta_key, id_key in pairs:
            if isinstance(node.get(meta_key), str) and isinstance(node.get(id_key), str):
                ref = relative_ref(node[meta_key])
                if ref in claims and claims[ref] != node[id_key]:
                    raise ValueError('Conflicting declared asset IDs: ' + ref)
                claims[ref] = node[id_key]
    return claims

def selection(data_root=DATA):
    names = ['actor-presentations', 'equipment', 'cards', 'enemies', 'stages', 'summon-actors']
    files = [data_root / (name + '.json') for name in names]
    files += sorted((data_root / 'presentations').glob('*.json'))
    files += sorted((data_root / 'skills').glob('*.json'))
    documents = {str(p.relative_to(data_root)): read(p) for p in files}
    # Pack prepared High assets too; the content release flag still controls gameplay.
    # This is a dependency closure, not a second gameplay registry.
    for name, document in documents.items():
        if name.startswith('skills/'):
            document['skills'] += document.get('hi_class_skills', [])
        if name.startswith('presentations/'):
            document['presentations'] += document.get('hi_class_presentations', [])
        if name == 'actor-presentations.json':
            document['jobs'] += document.get('hi_class_jobs', [])
    refs = collect_refs(read(COMBAT_VISUALS)) | collect_refs(read(SHELL_VISUALS))
    recipe_ids = set()
    for document in documents.values():
        refs |= collect_refs(document)
        for node in walk(document):
            if isinstance(node, dict):
                for key in ['reference_skill_id', 'recipe_skill_id']:
                    if isinstance(node.get(key), int):
                        recipe_ids.add(node[key])
    # Plant visuals explicitly reuse the authored Envenom recipe.
    for actor in documents['summon-actors.json']['actors']:
        recipe_ids.add(actor['presentation']['skill_id'])
    # Only asset-bearing data participates: changing a skill price leaves this hash unchanged.
    signature = {
        'sidecar_encoding': SIDECAR_ENCODING,
        'meta_refs': sorted(refs), 'recipe_ids': sorted(recipe_ids), 'combat_visuals': read(COMBAT_VISUALS), 'shell_visuals': read(SHELL_VISUALS),
        'actors': documents['actor-presentations.json']['jobs'],
        'stage_scenery': [{'id': s['id'], 'background': s['background'], 'music': s['music']} for s in documents['stages.json']['stages']],
        'presentations': {name: d.get('presentations', []) for name, d in documents.items() if 'presentations/' in name or name in ['equipment.json', 'cards.json', 'enemies.json']},
        'skill_presentations': {s['id']: s.get('presentation_id') for name, d in documents.items() if name.startswith('skills/') or name == 'enemies.json' for s in d['skills']},
    }
    return documents, refs, recipe_ids, sha(encoded(signature)), files + [COMBAT_VISUALS, SHELL_VISUALS]

def resolve_asset(meta_ref, ro_root=RO):
    ref = relative_ref(meta_ref)
    meta_path = ro_root / ref
    if not meta_path.is_file():
        raise ValueError('Missing sidecar: ' + ref)
    meta = read(meta_path)
    if meta.get('missing_dependencies') or meta.get('status') == 'source_dependencies_missing':
        raise ValueError('Unresolved source dependencies: ' + ref)
    reviewed_card = meta.get('schema_version') == 1 and meta.get('kind') == 'card_illustration' and meta.get('visual_review', {}).get('status') == 'reviewed' and meta.get('file', {}).get('frame_count') == 1
    if meta.get('status') not in ['exported', 'prepared', 'downloaded', 'generated'] and not reviewed_card:
        raise ValueError(f"Unreviewed export status {meta.get('status')}: {ref}")
    collection = 'library' if ref.startswith('library/') else 'prepared' if ref.startswith('prepared/') else ''
    media_ref = relative_ref('/'.join(filter(None, [collection, meta['file']['path']])))
    if Path(media_ref).suffix.lower() not in ['.webp', '.png', '.wav', '.mp3', '.ogg', '.woff2', '.ttf']:
        raise ValueError('Unsupported/archive runtime payload: ' + media_ref)
    media_path = ro_root / media_ref
    if not media_path.is_file():
        raise ValueError('Missing media: ' + media_ref)
    for p in [meta_path, media_path]:
        if not p.resolve().is_relative_to(ro_root.resolve()):
            raise ValueError('Asset symlink escapes source root')
    payload = media_path.read_bytes()
    if sha(payload) != meta['file']['sha256'] or len(payload) != meta['file']['bytes']:
        raise ValueError('Media checksum/size mismatch: ' + media_ref)
    return meta, media_ref

def build(output=OUT, data_root=DATA, ro_root=RO):
    output = Path(output).resolve()
    if output == ro_root.resolve() or not (output.is_relative_to((ROOT / 'runtime').resolve()) or output.is_relative_to(Path('/private/tmp'))):
        raise ValueError('Output must be a generated runtime directory or task temp directory')
    docs, refs, recipe_ids, selection_hash, inputs = selection(data_root)
    presentations = {row['id']: row for name, d in docs.items() if name.startswith('presentations/') for row in d['presentations']}
    skills = {}
    for name, d in docs.items():
        if not name.startswith('skills/'):
            continue
        for skill in d['skills']:
            if skill['id'] in skills or skill.get('presentation_id') not in presentations:
                raise ValueError('Duplicate skill or unknown presentation: ' + skill['id'])
            skills[skill['id']] = {'presentation_id': skill['presentation_id']}
    expected_players = 126 + sum(len(d.get('hi_class_skills', [])) for name, d in docs.items() if name.startswith('skills/'))
    if len(skills) != expected_players:
        raise ValueError('Player skill dependency closure is incomplete')
    # Enemy variants may explicitly reuse a complete player presentation (icon,
    # native effect, sound). Legacy enemy recipes remain on their existing path.
    for skill in docs['enemies.json']['skills']:
        if 'borrowed_program' not in skill['tags']:
            continue
        if skill['id'] in skills or skill.get('presentation_id') not in presentations:
            raise ValueError('Unknown borrowed enemy presentation: ' + skill['id'])
        skills[skill['id']] = {'presentation_id': skill['presentation_id']}
    if set(read(COMBAT_VISUALS)['skills']) - set(skills):
        raise ValueError('Combat visual has no runtime skill presentation')
    prepared = read(ro_root / 'prepared/game-pack.json')
    refs |= collect_refs(prepared['font']) | collect_refs(prepared['audio_events'])
    recipes = read(ro_root / 'prepared/skill-recipes.json')['recipes']
    selected_recipes = [r for r in recipes if r['skill_id'] in recipe_ids]
    if {r['skill_id'] for r in selected_recipes} != recipe_ids:
        raise ValueError('A referenced skill recipe is missing')
    if any(not r['ready'] for r in selected_recipes):
        raise ValueError('A referenced skill recipe is not ready')
    refs |= collect_refs(selected_recipes)
    shell = read(SHELL_VISUALS)
    claims = declared_ids([*docs.values(), prepared['font'], prepared['audio_events'], selected_recipes, shell])
    records = {}
    files = {}
    by_meta = {}
    def include(path):
        payload = runtime_payload(path, ro_root)
        files[path] = {'path': path, 'bytes': len(payload), 'sha256': sha(payload)}
    for ref in sorted(refs):
        meta, media_ref = resolve_asset(ref, ro_root)
        if ref in claims and claims[ref] != meta['id']:
            raise ValueError('Asset ID does not match its sidecar: ' + ref)
        if meta['id'] in records and records[meta['id']]['meta_path'] != ref:
            raise ValueError('Duplicate asset ID points to different sidecars: ' + meta['id'])
        include(ref)
        include(media_ref)
        record = {'id': meta['id'], 'category': meta['category'], 'meta_path': ref, 'media_path': media_ref}
        records[meta['id']] = record
        by_meta[ref] = record
    include('prepared/fonts/OFL.txt')
    # The initial download profile is a budget scenario; other jobs/genders stay lazy.
    combat_visuals = read(COMBAT_VISUALS)
    # Per-skill native impacts load lazily with their skill; only the first-battle skills count as initial.
    initial_refs = collect_refs({key: value for key, value in combat_visuals.items() if key not in ['impacts', 'performance_auras', 'ground_fields']})
    initial_skills = []
    for job in docs['actor-presentations.json']['jobs']:
        if job['job_id'] in ['swordsman', 'acolyte', 'archer', 'mage']:
            initial_refs |= collect_refs(next(p for p in job['presets'] if p['gender'] == 'male'))
            for skill in docs['skills/' + job['job_id'] + '.json']['skills']:
                if skill['class_id'] == job['job_id'] and skill['kind'] == 'active' and skill['unlock_level'] == 1:
                    initial_skills.append(skill['id'])
                    initial_refs |= collect_refs(combat_visuals.get('impacts', {}).get(skill['presentation_id']))
                    initial_refs |= collect_refs(combat_visuals.get('ground_fields', {}).get(skill['presentation_id']))
                    visual = presentations[skill['presentation_id']]
                    initial_refs.add(relative_ref(visual['icon_meta_path']))
                    recipe_id = visual['visual'].get('reference_skill_id')
                    for recipe in selected_recipes:
                        if recipe['skill_id'] == recipe_id:
                            initial_refs |= collect_refs([recipe['icon'], recipe.get('native_effect')])
    aura = combat_visuals.get('performance_auras', {})
    if set(initial_skills).intersection(aura.get('skills', {})):
        initial_refs |= collect_refs(aura)
    first_stage = docs['stages.json']['stages'][0]
    initial_refs |= collect_refs(first_stage['background']) | collect_refs(prepared['font'])
    first_enemies = {row['definition_id'] for row in first_stage['encounter']}
    for actor in docs['enemies.json']['actors']:
        if actor['id'] in first_enemies:
            initial_refs |= collect_refs(actor)
    initial_files = set()
    for ref in initial_refs:
        record = by_meta[ref]
        initial_files |= {record['meta_path'], record['media_path']}
    index = {
        'schema_version': 1, 'sidecar_encoding': SIDECAR_ENCODING, 'asset_selection_hash': selection_hash,
        'assets': records, 'files': [files[k] for k in sorted(files)],
        'actor_jobs': docs['actor-presentations.json']['jobs'],
        'skills': skills, 'presentations': runtime_presentations(presentations),
        'combat_visuals': read(COMBAT_VISUALS), 'shell': shell,
        'recipes': selected_recipes, 'audio_events': prepared['audio_events'], 'font': prepared['font'],
        'initial_profile': {'id': 'four_class1_male_first_story_muted', 'files': sorted(initial_files), 'skill_ids': sorted(initial_skills), 'music': 'lazy after user enables audio'},
        'ui': {'panels': 'CSS', 'icons': 'selected skill/equipment/card symbols plus shell menu/resource icons', 'font_license': 'prepared/fonts/OFL.txt'},
        'renderer_requirements': {'actors': 'native packed ACT layers/anchors/transforms; flip complete actor and attachments',
                                  'effects': 'native STR atlas/keyframes or authored procedural family',
                                  'recipes': 'resolve embedded recipes by reference_skill_id; recipe.runtime/recipe_path are authoring provenance, never dynamic imports'},
        'source_inputs_at_build': {str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else 'fixture/' + str(p.relative_to(data_root)): sha(p.read_bytes()) for p in inputs},
        'scope': 'Class1/2 selected media+sidecars only; no asset-library catalogs/archives, no new visual verification',
    }
    index['pack_hash'] = sha(encoded({k: v for k, v in index.items() if k != 'source_inputs_at_build'}))
    index['base_url'] = '/ro/' + index['pack_hash'] + '/'
    raw_bytes = sum(row['bytes'] for row in files.values())
    initial_bytes = sum(files[path]['bytes'] for path in initial_files)
    index['sizes'] = {'media_and_sidecar_bytes': raw_bytes, 'initial_profile_raw_bytes': initial_bytes,
                      'pack_budget_bytes': 32 * 1024 * 1024, 'first_battle_budget_bytes': 8 * 1024 * 1024,
                      'download_policy': 'all files in pack are deployable; fetch initial profile then actors/icons/scenery/audio on demand'}
    index['sizes']['manifest_bytes'] = 0
    for _ in range(10):
        size = len(encoded(index))
        if size == index['sizes']['manifest_bytes']:
            break
        index['sizes']['manifest_bytes'] = size
    if raw_bytes + len(encoded(index)) > index['sizes']['pack_budget_bytes']:
        raise ValueError('Selected runtime pack exceeds32MiB raw budget (D-099 card illustrations)')
    output.mkdir(parents=True, exist_ok=True)
    payload_root = output / 'payload'
    payload_root.mkdir(exist_ok=True)
    for ref in files:
        target = payload_root / ref
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or sha(target.read_bytes()) != files[ref]['sha256']:
            target.write_bytes(runtime_payload(ref, ro_root))
    # No stale payload is allowed to inflate later source uploads.
    for target in payload_root.rglob('*'):
        if target.is_file() and str(target.relative_to(payload_root)) not in files:
            target.unlink()
    (output / 'manifest.json').write_bytes(encoded(index))
    return index

def verify(output=OUT, data_root=DATA, *, artifact_only=False, ro_root=RO):
    """Verify the shipped pack; local checks also require matching source files.

    Deployment input intentionally excludes the source library. Select that mode
    explicitly: Vercel can leave empty directories after applying .vercelignore.
    """
    output = Path(output)
    index = read(output / 'manifest.json')
    _, _, _, selection_hash, _ = selection(data_root)
    if index['asset_selection_hash'] != selection_hash:
        raise ValueError('Asset selection changed; rebuild pack locally')
    expected = {row['path'] for row in index['files']}
    actual = {str(p.relative_to(output / 'payload')) for p in (output / 'payload').rglob('*') if p.is_file()}
    if actual != expected:
        raise ValueError('Pack has missing or unexpected payload files')
    for row in index['files']:
        payload = (output / 'payload' / relative_ref(row['path'])).read_bytes()
        if sha(payload) != row['sha256'] or len(payload) != row['bytes']:
            raise ValueError('Pack payload changed: ' + row['path'])
        if not artifact_only:
            source = ro_root / relative_ref(row['path'])
            source_bytes = runtime_payload(row['path'], ro_root) if source.is_file() and index.get('sidecar_encoding') == SIDECAR_ENCODING else source.read_bytes() if source.is_file() else b''
            if not source.is_file() or sha(source_bytes) != row['sha256']:
                raise ValueError('Selected local source changed; rebuild pack: ' + row['path'])
    if not artifact_only:
        prepared = read(ro_root / 'prepared/game-pack.json')
        recipe_ids = {row['skill_id'] for row in index['recipes']}
        current_recipes = [row for row in read(ro_root / 'prepared/skill-recipes.json')['recipes'] if row['skill_id'] in recipe_ids]
        if encoded([prepared['font'], prepared['audio_events'], current_recipes]) != encoded([index['font'], index['audio_events'], index['recipes']]):
            raise ValueError('Prepared font/audio/recipes changed; rebuild pack')
    identity = {k: v for k, v in index.items() if k not in ['pack_hash', 'base_url', 'sizes', 'source_inputs_at_build']}
    if sha(encoded(identity)) != index['pack_hash']:
        raise ValueError('Pack manifest fingerprint mismatch')
    by_path = {row['path']: row for row in index['files']}
    if index['sizes']['media_and_sidecar_bytes'] != sum(row['bytes'] for row in index['files']):
        raise ValueError('Incorrect pack size report')
    if index['sizes']['initial_profile_raw_bytes'] != sum(by_path[p]['bytes'] for p in index['initial_profile']['files']):
        raise ValueError('Incorrect initial-profile size report')
    if index['sizes']['manifest_bytes'] != len((output / 'manifest.json').read_bytes()):
        raise ValueError('Incorrect manifest size report')
    return index

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--artifact-only', action='store_true',
                        help='With --check, validate the runtime pack without the excluded source library')
    args = parser.parse_args()
    if args.artifact_only and not args.check:
        parser.error('--artifact-only requires --check')
    index = verify(artifact_only=args.artifact_only) if args.check else build()
    print(json.dumps({'pack_hash': index['pack_hash'], 'assets': len(index['assets']), 'files': len(index['files']), **index['sizes']}, ensure_ascii=False))

if __name__ == '__main__':
    main()

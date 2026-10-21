import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('runtime_assets', ROOT / 'scripts/build_runtime_assets.py')
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)

class RuntimeAssetsTests(unittest.TestCase):
    def fixture(self, root, *, missing=False, wrong_hash=False):
        directory = root / 'library/effects'
        directory.mkdir(parents=True)
        payload = b'not decoded: byte-integrity fixture'
        (directory / 'shared.webp').write_bytes(payload)
        meta = {'schema_version': 2, 'id': 'effects.fixture', 'category': 'effects', 'status': 'exported',
                'missing_dependencies': ['texture.bmp'] if missing else [],
                'file': {'path': 'effects/shared.webp', 'bytes': len(payload), 'sha256': 'bad' if wrong_hash else pack.sha(payload)}}
        (directory / 'own.meta.json').write_text(json.dumps(meta))
        return 'library/effects/own.meta.json'

    def test_shared_media_uses_file_path_not_sidecar_basename(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            root = Path(work)
            ref = self.fixture(root)
            meta, media = pack.resolve_asset(ref, root)
            self.assertEqual(media, 'library/effects/shared.webp')
            self.assertEqual(meta['id'], 'effects.fixture')

    def test_missing_texture_blocks_selection(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            root = Path(work)
            ref = self.fixture(root, missing=True)
            with self.assertRaisesRegex(ValueError, 'Unresolved'):
                pack.resolve_asset(ref, root)

    def test_corrupted_media_blocks_selection(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            root = Path(work)
            ref = self.fixture(root, wrong_hash=True)
            with self.assertRaisesRegex(ValueError, 'checksum'):
                pack.resolve_asset(ref, root)

    def test_paths_cannot_escape_asset_root(self):
        for path in ['../secret.meta.json', '/tmp/secret.meta.json', 'library/../../secret']:
            with self.assertRaises(ValueError):
                pack.relative_ref(path)

    def test_declared_ids_cannot_conflict(self):
        with self.assertRaisesRegex(ValueError, 'Conflicting'):
            pack.declared_ids([{'id': 'a', 'meta': 'library/x.meta.json'}, {'id': 'b', 'meta': 'library/x.meta.json'}])

    def test_selection_ignores_balance_numbers_and_tracks_asset_refs(self):
        _, _, _, baseline, _ = pack.selection()
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            data = Path(work) / 'data'
            shutil.copytree(ROOT / 'plan/data', data)
            file = data / 'skills/swordsman.json'
            document = pack.read(file)
            document['skills'][0]['cost']['sp'] = 999
            file.write_text(json.dumps(document))
            self.assertEqual(pack.selection(data)[3], baseline)
            document['skills'][0]['presentation_id'] = 'unknown_visual'
            file.write_text(json.dumps(document))
            self.assertNotEqual(pack.selection(data)[3], baseline)
            with self.assertRaisesRegex(ValueError, 'unknown presentation'):
                pack.build(Path(work) / 'out', data)

    def test_selected_pack_is_repeatable_and_under_budget(self):
        first = pack.verify()
        rebuilt = pack.build()
        self.assertEqual(first['pack_hash'], rebuilt['pack_hash'])
        self.assertEqual(len(first['skills']), 126)
        self.assertEqual(len(first['actor_jobs']), 19)
        self.assertEqual(sum(len(job['presets']) for job in first['actor_jobs']), 36)
        self.assertLess(first['sizes']['media_and_sidecar_bytes'] + first['sizes']['manifest_bytes'], 27 * 1024 * 1024)
        self.assertLess(first['sizes']['initial_profile_raw_bytes'] + first['sizes']['manifest_bytes'], 8 * 1024 * 1024)
        self.assertFalse(any(row['path'].endswith(('.zip', '.grf')) for row in first['files']))
        self.assertEqual(pack.verify()['pack_hash'], first['pack_hash'])

    def test_missing_or_extra_output_is_detected(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            output = Path(work)
            shutil.copyfile(ROOT / 'runtime/ro/manifest.json', output / 'manifest.json')
            (output / 'payload').mkdir()
            with self.assertRaisesRegex(ValueError, 'missing or unexpected'):
                pack.verify(output)

if __name__ == '__main__':
    unittest.main()

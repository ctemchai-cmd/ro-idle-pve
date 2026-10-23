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
    def test_borrowed_enemy_unknown_presentation_is_rejected_before_pack_write(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-enemy-', dir='/private/tmp') as work:
            root=Path(work); data=root/'data'; shutil.copytree(ROOT/'plan/data',data)
            p=data/'enemies.json'; document=json.loads(p.read_text())
            next(s for s in document['skills'] if s['id']=='enemy_cold_bolt')['presentation_id']='missing_visual'
            p.write_text(json.dumps(document))
            with self.assertRaisesRegex(ValueError,'Unknown borrowed enemy presentation'):
                pack.build(data_root=data,output=root/'output')
    def test_reviewed_static_starter_card_is_supported_without_claiming_native_export(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-card-', dir='/private/tmp') as work:
            root = Path(work); directory = root / 'items'; directory.mkdir()
            payload = b'card checksum fixture'; (directory / 'card.webp').write_bytes(payload)
            meta = {'schema_version': 1, 'id': 'items.card-test', 'category': 'items', 'kind': 'card_illustration', 'visual_review': {'status': 'reviewed'}, 'file': {'path': 'items/card.webp', 'bytes': len(payload), 'sha256': pack.sha(payload), 'frame_count': 1}}
            sidecar = directory / 'card.meta.json'; sidecar.write_text(json.dumps(meta))
            self.assertEqual(pack.resolve_asset('items/card.meta.json', root)[1], 'items/card.webp')
            meta['visual_review']['status'] = 'not_reviewed'; sidecar.write_text(json.dumps(meta))
            with self.assertRaisesRegex(ValueError, 'Unreviewed'):
                pack.resolve_asset('items/card.meta.json', root)

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
        self.assertEqual(len(first['skills']), 132)  #126players+6explicit enemy presentation aliases
        for enemy, player in [('enemy_cold_bolt','mage_cold_bolt'),('enemy_lightning_bolt','mage_lightning_bolt'),('enemy_sonic_blow','assassin_sonic_blow'),('enemy_armor_break','merchant_first_aid'),('enemy_hammer_fall','blacksmith_hammer_fall'),('enemy_mend','acolyte_heal')]:
            self.assertEqual(first['skills'][enemy], first['skills'][player])
        self.assertFalse(set(first['combat_visuals']['skills']) - set(first['skills']))
        self.assertEqual(len(first['actor_jobs']), 19)
        self.assertEqual(sum(len(job['presets']) for job in first['actor_jobs']), 36)
        self.assertLess(first['sizes']['media_and_sidecar_bytes'] + first['sizes']['manifest_bytes'], 32 * 1024 * 1024)
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

    def test_deployment_check_allows_empty_or_partial_source_directories(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            source = Path(work) / 'assets/ro'
            # Git deployments can retain these directories after ignoring files.
            (source / 'library/characters/body_atlas').mkdir(parents=True)
            expected = pack.read(ROOT / 'runtime/ro/manifest.json')['pack_hash']
            for state in ['empty', 'partial']:
                with self.subTest(source=state):
                    if state == 'partial':
                        (source / 'prepared').mkdir()
                        (source / 'prepared/game-pack.json').write_text('{}')
                    self.assertEqual(pack.verify(artifact_only=True, ro_root=source)['pack_hash'], expected)
                    with self.assertRaisesRegex(ValueError, 'Selected local source changed'):
                        pack.verify(ro_root=source)
            shutil.rmtree(source)
            with self.assertRaisesRegex(ValueError, 'Selected local source changed'):
                pack.verify(ro_root=source)

    def test_deployment_check_rejects_changed_missing_or_extra_runtime_payload(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            output = Path(work) / 'runtime'
            shutil.copytree(ROOT / 'runtime/ro', output)
            row = pack.read(output / 'manifest.json')['files'][0]
            payload = output / 'payload' / row['path']
            original = payload.read_bytes()
            payload.write_bytes(b'corrupted')
            with self.assertRaisesRegex(ValueError, 'Pack payload changed'):
                pack.verify(output, artifact_only=True)
            payload.unlink()
            with self.assertRaisesRegex(ValueError, 'missing or unexpected'):
                pack.verify(output, artifact_only=True)
            payload.write_bytes(original)
            (output / 'payload/unexpected.txt').write_text('extra')
            with self.assertRaisesRegex(ValueError, 'missing or unexpected'):
                pack.verify(output, artifact_only=True)

    def test_deployment_check_still_requires_matching_selection(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            data = Path(work) / 'data'
            shutil.copytree(ROOT / 'plan/data', data)
            file = data / 'skills/swordsman.json'
            document = pack.read(file)
            document['skills'][0]['presentation_id'] = 'changed_visual'
            file.write_text(json.dumps(document))
            with self.assertRaisesRegex(ValueError, 'Asset selection changed'):
                pack.verify(data_root=data, artifact_only=True)

    def test_deployment_check_still_requires_manifest_fingerprint(self):
        with tempfile.TemporaryDirectory(prefix='ro-pack-', dir='/private/tmp') as work:
            output = Path(work) / 'runtime'
            shutil.copytree(ROOT / 'runtime/ro', output)
            manifest = output / 'manifest.json'
            index = pack.read(manifest)
            index['audio_events'] = {}
            manifest.write_bytes(pack.encoded(index))
            with self.assertRaisesRegex(ValueError, 'manifest fingerprint mismatch'):
                pack.verify(output, artifact_only=True)

if __name__ == '__main__':
    unittest.main()

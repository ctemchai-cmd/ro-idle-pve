"""Check category discovery and directional ACT frame remapping."""
import copy
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np

PATH = Path(__file__).resolve().parents[1] / "scripts/build_ro_library.py"
SPEC = importlib.util.spec_from_file_location("bulk_assets", PATH)
bulk = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bulk)


class BulkAssetTests(unittest.TestCase):
    def test_special_str_numbers_remain_valid_browser_json(self):
        values = {"keys": [[float("inf"), float("-inf"), float("nan"), 2.5]]}
        encoded = json.dumps(bulk.strict_json_values(values), allow_nan=False)
        self.assertEqual(json.loads(encoded)["keys"], [["Infinity", "-Infinity", "NaN", 2.5]])

    def test_ambiguous_effect_texture_is_not_substituted(self):
        payloads = {'data\\texture\\effect\\one\\spark.bmp': b'one',
                    'data\\texture\\effect\\two\\spark.bmp': b'two'}
        class Archive:
            def namelist(self): return list(payloads)
            def __contains__(self, path): return path in payloads
            def read(self, path): return payloads[path]
        resolver = bulk.EffectArchive(Archive())
        self.assertIsNone(resolver.resolve('data\\texture\\effect\\missing\\spark.bmp'))
        payloads['data\\texture\\effect\\two\\spark.bmp'] = b'one'
        resolver = bulk.EffectArchive(Archive())
        self.assertIsNotNone(resolver.resolve('data\\texture\\effect\\missing\\spark.bmp'))

    def test_body_head_and_weapon_are_distinct_categories(self):
        self.assertEqual(bulk.classify('data\\sprite\\인간족\\몸통\\남\\검사_남.spr'),
                         ('characters', 'body_atlas'))
        self.assertEqual(bulk.classify('data\\sprite\\인간족\\머리통\\남\\1_남.spr'),
                         ('characters', 'head_atlas'))
        self.assertEqual(bulk.classify('data\\sprite\\인간족\\검사\\검사_남_검.spr'),
                         ('weapons', 'weapon_overlay_atlas'))
        self.assertIsNone(bulk.classify('data\\sprite\\로브\\robe\\robe.spr'))

    def test_east_actions_remap_only_their_referenced_frames(self):
        source = {"actions": [{"delay": 4.0, "frames": [{"layers": [[0, 0, i % 3, 0]]}]}
                              for i in range(16)], "events": []}
        parts = [np.full((2, 3, 4), value, dtype=np.uint8) for value in (50, 100, 150)]
        parsed = SimpleNamespace(indexed_frames=parts)
        with patch.object(bulk, "_ARCHIVE", SimpleNamespace(read=lambda path: b"fixture")), \
             patch.object(bulk.spr_format, "parse", return_value=parsed), \
             patch.object(bulk.act_format, "parse", return_value=object()), \
             patch.object(bulk, "decode_spr_frames", return_value=parts), \
             patch.object(bulk, "act_to_meta", return_value=copy.deepcopy(source)):
            payload, meta = bulk.export_sprite({"source_path": "test.spr", "act_path": "test.act", "kind": "body_atlas"})
        self.assertTrue(payload.startswith(b'\x89PNG'))
        self.assertEqual(meta['sprite_sheet']['source_frame_indices'], [0, 2])
        actions = meta['animation']['actions']
        self.assertEqual([action['source_action_index'] for action in actions], [6, 14])
        self.assertEqual([action['frames'][0]['layers'][0][2] for action in actions], [0, 1])
        self.assertTrue(meta['animation']['facing_variants']['left']['flip_x'])
        self.assertEqual(actions[0]['frame_duration_ms'], 100.0)


if __name__ == '__main__':
    unittest.main()

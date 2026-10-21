"""Keep metadata semantics and prevent unsafe shared-media deletion."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import compact_ro_storage as storage


class StorageOptimizationTests(unittest.TestCase):
    def test_compact_keeps_animation_and_annotations_while_sharing_image(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            path = base / "asset.meta.json"
            source = {"id": "asset", "file": {"path": "old.webp"},
                      "annotations": {"notes": "ข้อมูลภาษาไทย"},
                      "animation": {"keys": [[1, 0.5, "Infinity"]]}}
            path.write_text(json.dumps(source, indent=2))
            replacement = {"id": "asset", "old_path": "old.webp", "canonical_path": "shared.webp", "canonical_id": "other"}
            with patch.object(storage, "LIBRARY", base):
                result = storage.compact_one((path, replacement))
            self.assertNotIn("error", result)
            actual = json.loads(path.read_text())
            self.assertEqual(actual["file"]["path"], "shared.webp")
            self.assertEqual(actual["animation"], source["animation"])
            self.assertEqual(actual["annotations"], source["annotations"])

    def test_duplicates_with_incorrect_content_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            (base / "a.webp").write_bytes(b"same")
            (base / "b.webp").write_bytes(b"oops")
            rows = [{"id": name, "path": name + ".webp", "format": "WEBP", "bytes": 4,
                     "sha256": hashlib.sha256(b"same").hexdigest()} for name in ("a", "b")]
            with patch.object(storage, "LIBRARY", base), self.assertRaises(ValueError):
                storage.plan_duplicates(rows)

    def test_cleanup_refuses_image_still_used_by_catalog(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            image = base / "used.webp"
            image.write_bytes(b"keep")
            (base / "catalog.json").write_text(json.dumps({"assets": [{"path": "used.webp"}]}))
            with patch.object(storage, "LIBRARY", base), self.assertRaises(ValueError):
                storage.remove_duplicates([{"old_path": "used.webp"}])
            self.assertTrue(image.exists())


if __name__ == "__main__":
    unittest.main()

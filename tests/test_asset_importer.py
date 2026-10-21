"""Regression checks for cached metadata and non-destructive refreshes."""

import importlib.util
from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "import_ro_assets.py"
SPEC = importlib.util.spec_from_file_location("asset_importer", MODULE_PATH)
importer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(importer)


def png(color):
    buffer = BytesIO()
    Image.new("RGBA", (2, 2), color).save(buffer, format="PNG")
    return buffer.getvalue()


class AssetImporterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root_patch = patch.object(importer, "ASSET_ROOT", Path(self.temp.name))
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        manifest = {"providers": {"ragassets": {}, "divine_pride": {
            "base_url": "https://example.test"}}, "canvas": {}, "direction": {},
            "characters": [], "monsters": [], "icons": [{
                "slug": "test", "name": "Test", "game_id": 1, "category": "items",
                "tags": [], "image_path": "/test.png"}]}
        self.entry = importer.entries_from_manifest(manifest)[0]
        self.payload = png((255, 0, 0, 255))

    def initial_import(self):
        with patch.object(importer, "download", return_value=(self.payload, {})):
            return importer.import_one(self.entry)[0]

    def test_cached_run_never_fetches_or_decodes_image(self):
        initial = self.initial_import()
        with patch.object(importer, "download", side_effect=AssertionError("Network called")), \
             patch.object(importer, "inspect_image", side_effect=AssertionError("Image decoded")):
            cached, status = importer.import_one(self.entry)
        self.assertEqual(status, "cached")
        self.assertEqual(cached, initial)

    def test_checksum_detects_modified_cached_image(self):
        self.initial_import()
        (importer.ASSET_ROOT / self.entry["path"]).write_bytes(png((0, 255, 0, 255)))
        with self.assertRaises(ValueError):
            importer.read_cached(self.entry)

    def test_cached_webp_survives_deleted_original_png(self):
        metadata = self.initial_import()
        path = importer.ASSET_ROOT / self.entry["path"]
        optimized = path.with_suffix(".webp")
        with Image.open(path) as image:
            image.save(optimized, format="WEBP", lossless=True, exact=True)
        payload = optimized.read_bytes()
        metadata["file"].update(path=optimized.relative_to(importer.ASSET_ROOT).as_posix(),
                                bytes=len(payload), sha256=importer.sha256(payload), format="WEBP")
        importer.write_json(importer.sidecar_path(path), metadata)
        path.unlink()
        with patch.object(importer, "download", side_effect=AssertionError("Network called")), \
             patch.object(importer, "inspect_image", side_effect=AssertionError("Image decoded")):
            cached, status = importer.import_one(self.entry)
        self.assertEqual(status, "cached")
        self.assertEqual(cached["file"]["path"], "items/test.webp")

    def test_invalid_refresh_preserves_existing_image_and_metadata(self):
        self.initial_import()
        path = importer.ASSET_ROOT / self.entry["path"]
        before = (path.read_bytes(), importer.sidecar_path(path).read_bytes())
        with patch.object(importer, "download", return_value=(b"not an image", {})):
            with self.assertRaises(OSError):
                importer.import_one(self.entry, refresh=True)
        self.assertEqual(before, (path.read_bytes(), importer.sidecar_path(path).read_bytes()))

    def test_refresh_preserves_annotations_but_resets_review_when_image_changes(self):
        metadata = self.initial_import()
        metadata["annotations"] = {"role": "health item"}
        metadata["visual_review"] = {"status": "reviewed", "notes": ["red"]}
        path = importer.ASSET_ROOT / self.entry["path"]
        importer.write_json(importer.sidecar_path(path), metadata)
        with patch.object(importer, "download", return_value=(png((0, 255, 0, 255)), {})):
            changed, _ = importer.import_one(self.entry, refresh=True)
        self.assertEqual(changed["annotations"], {"role": "health item"})
        self.assertEqual(changed["visual_review"]["status"], "pending")


if __name__ == "__main__":
    unittest.main()

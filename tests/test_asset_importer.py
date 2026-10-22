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
    def test_card_portrait_uses_its_declared_provider_and_retains_legacy_default(self):
        manifest = {"providers": {"ragassets": {"base_url": "https://cards.example.test"}, "divine_pride": {"base_url": "https://icons.example.test"}}, "canvas": {}, "direction": {}, "characters": [], "monsters": [], "icons": [
            {"slug": "portrait", "name": "Poring Card", "game_id": 4001, "category": "items", "tags": ["card"], "image_path": "/illust/card/4001.png", "provider": "ragassets", "kind": "card_illustration", "page_url": "https://reference.example.test/4001"},
            {"slug": "legacy", "name": "Legacy", "game_id": 501, "category": "items", "tags": [], "image_path": "/items/501.png"}]}
        portrait, legacy = importer.entries_from_manifest(manifest)
        self.assertEqual(portrait["source"]["download_url"], "https://cards.example.test/illust/card/4001.png")
        self.assertEqual(portrait["source"]["page_url"], "https://reference.example.test/4001")
        self.assertEqual(portrait["kind"], "card_illustration")
        self.assertEqual(legacy["source"]["provider"], "divine_pride")
        self.assertEqual(legacy["kind"], "icon")

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

    def test_webp_job_emblem_keeps_declared_game_identity_source_and_bytes(self):
        manifest = {"providers": {"ragassets": {}, "origin": {"base_url": "https://example.test", "request_headers": {"Referer": "https://example.test/classes"}}}, "canvas": {}, "direction": {}, "characters": [], "monsters": [], "icons": [{
            "slug": "job-monk", "name": "Monk job emblem", "game_id": 3201, "category": "ui", "tags": ["job_emblem"], "game_tag": "ragnarok_origin", "game_name": "Ragnarok Origin Classic", "kind": "job_emblem", "provider": "origin", "extension": "webp", "image_path": "/profession/monk.webp", "page_url": "https://example.test/classes/3201"}]}
        entry = importer.entries_from_manifest(manifest)[0]
        buf = BytesIO(); Image.new("RGBA", (56, 56), (30, 150, 60, 190)).save(buf, format="WEBP", lossless=True)
        payload = buf.getvalue()
        with patch.object(importer, "download", return_value=(payload, {})) as fetch:
            meta, status = importer.import_one(entry)
        fetch.assert_called_once_with("https://example.test/profession/monk.webp", headers={"Referer": "https://example.test/classes"})
        self.assertEqual(status, "downloaded")
        self.assertEqual(meta["game"], {"name": "Ragnarok Origin Classic", "entity_id": 3201})
        self.assertEqual(meta["kind"], "job_emblem")
        self.assertEqual(meta["file"]["format"], "WEBP")
        self.assertEqual(meta["file"]["path"], "ui/job-monk.webp")
        self.assertEqual((importer.ASSET_ROOT / meta["file"]["path"]).read_bytes(), payload)
        with patch.object(importer, "download", side_effect=AssertionError("No network")):
            self.assertEqual(importer.read_cached(entry), meta)

    def test_local_modern_source_preserves_bytes_and_detects_change_without_network(self):
        root = Path(self.temp.name)
        source = root / "assets/modern/skill/monk/9.webp"
        source.parent.mkdir(parents=True)
        buf = BytesIO(); Image.new("RGBA", (128, 128), (240, 170, 20, 255)).save(buf, format="WEBP", lossless=True)
        source.write_bytes(buf.getvalue())
        entry = {**self.entry, "local_source": "assets/modern/skill/monk/9.webp", "path": "skills/modern-call.webp", "game_name": "User-provided icon"}
        entry["source"] = {"provider": "local_modern", "download_url": "local:///assets/modern/skill/monk/9.webp", "page_url": "assets/modern/suggestion-migrate.txt"}
        with patch.object(importer, "ROOT", root), patch.object(importer, "download", side_effect=AssertionError("No network")):
            meta, _ = importer.import_one(entry)
            self.assertEqual((importer.ASSET_ROOT / entry["path"]).read_bytes(), source.read_bytes())
            self.assertEqual(importer.read_cached(entry), meta)
            source.write_bytes(b"changed")
            with self.assertRaisesRegex(ValueError, "source changed"):
                importer.read_cached(entry)
            with self.assertRaisesRegex(ValueError, "inside assets/modern"):
                importer.local_payload({"local_source": "assets/modern/../../outside.webp"})

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

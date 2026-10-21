"""Protect exact pixels/timing and original cleanup during web conversion."""
from io import BytesIO
import json
from pathlib import Path
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import optimize_ro_web as web


class WebOptimizationTests(unittest.TestCase):
    def image_bytes(self, color, format="PNG"):
        image = Image.new("RGBA", (32, 32), color)
        output = BytesIO()
        image.save(output, format=format, lossless=True, exact=True)
        return output.getvalue()

    def test_lossless_roundtrip_keeps_invisible_rgb_and_alpha(self):
        raw = self.image_bytes((90, 20, 170, 0))
        reference = web.load_frames(raw)
        candidate = web.candidate_webp(reference)
        self.assertTrue(web.verify_equivalent(candidate, reference))
        self.assertFalse(web.verify_equivalent(self.image_bytes((90, 20, 170, 1)), reference))

    def test_changed_animation_delay_is_rejected(self):
        frames = [Image.new("RGBA", (8, 8), color) for color in ("red", "blue")]
        def encode(delays):
            output = BytesIO()
            frames[0].save(output, format="PNG", save_all=True, append_images=frames[1:],
                           duration=delays, loop=0)
            return output.getvalue()
        reference = web.load_frames(encode([100, 200]))
        self.assertFalse(web.verify_equivalent(encode([100, 201]), reference))

    def test_cleanup_keeps_original_when_replacement_was_modified(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            original = base / "asset.png"
            original.write_bytes(b"original")
            (base / "asset.webp").write_bytes(b"tampered replacement")
            (base / "asset.meta.json").write_text(json.dumps({
                "file": {"path": "asset.webp"},
                "web_optimization": {"original": {"path": "asset.png", "sha256": web.sha(b"original")},
                                     "output_sha256": web.sha(b"expected replacement")}}))
            with self.assertRaises(ValueError):
                web.delete_replaced_originals([{"base": directory, "row": {"meta_path": "asset.meta.json"}}])
            self.assertEqual(original.read_bytes(), b"original")


if __name__ == "__main__":
    unittest.main()

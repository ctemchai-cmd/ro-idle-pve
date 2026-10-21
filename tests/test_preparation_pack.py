"""Integration contracts for the retained local preparation pack."""
import json
from pathlib import Path
import unittest

ASSETS = Path(__file__).resolve().parents[1] / "assets/ro"


def load(path):
    return json.loads(path.read_text())


class PreparationPackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pack = load(ASSETS / "prepared/game-pack.json")

    def test_selected_references_are_local_complete_assets(self):
        paths = set()

        def collect(value):
            if isinstance(value, dict):
                for child in value.values():
                    collect(child)
            elif isinstance(value, list):
                for child in value:
                    collect(child)
            elif isinstance(value, str) and value.endswith(".meta.json"):
                paths.add(value)

        collect(self.pack)
        self.assertGreater(len(paths), 100)
        for relative in paths:
            with self.subTest(meta=relative):
                sidecar = ASSETS / relative
                self.assertTrue(sidecar.resolve().is_relative_to(ASSETS.resolve()))
                meta = load(sidecar)
                self.assertEqual(meta["status"], "exported")
                self.assertFalse(meta.get("missing_dependencies"))
                media = ASSETS / relative.split("/")[0] / meta["file"]["path"]
                self.assertTrue(media.is_file())

    def test_actor_weapon_action_has_layers_on_both_parts(self):
        for actor in self.pack["actors"]:
            with self.subTest(actor=actor["id"]):
                self.assertIsNotNone(actor["weapon"])
                for component in ("body", "weapon"):
                    meta = load(ASSETS / actor[component]["meta"])
                    actions = [a for a in meta["animation"]["actions"]
                               if a["source_action_index"] == actor["attack_source_action_index"]]
                    self.assertEqual(len(actions), 1)
                    self.assertTrue(any(frame["layers"] for frame in actions[0]["frames"]))
                source = load(ASSETS / actor["weapon"]["meta"])["source"]["path"]
                self.assertIn(actor["class_sprite"], source.split("\\"))

    def test_every_prepared_skill_has_icon_sound_and_rendering_choice(self):
        for recipe in self.pack["skill_recipes"]:
            with self.subTest(skill=recipe["skill_id"]):
                self.assertTrue(recipe["icon"])
                self.assertTrue(recipe["sounds"])
                self.assertTrue(recipe["native_effect"] or recipe["family"] in
                                {"burst", "bolt", "heal", "buff", "arrow"})
                self.assertTrue(recipe["visual_basis"])
                self.assertNotIn("damage", recipe)
                self.assertNotIn("cooldown", recipe)


if __name__ == "__main__":
    unittest.main()

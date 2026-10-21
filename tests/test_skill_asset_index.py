"""Skill lookups must follow exact source mappings, including after WebP conversion."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import build_ro_skill_index as skills


def row(ident, source):
    return {"id": ident, "kind": "keyframe_effect_atlas", "source_path": source,
            "path": ident + ".webp", "meta_path": ident + ".meta.json", "format": "WEBP", "status": "exported"}


class SkillAssetIndexTests(unittest.TestCase):
    def test_stormgust_uses_exact_source_not_similar_filename(self):
        resolver = skills.Resolver([row("correct", r"data\texture\effect\stormgust.str"),
                                    row("different", r"data\texture\effect\storm gust.str")])
        result = resolver.resolve("stormgust", "keyframe_effect_atlas")
        self.assertEqual(result["asset"]["path"], "correct.webp")
        self.assertEqual(result["resolution"], "exact_source_path")

    def test_ambiguous_basename_does_not_guess(self):
        resolver = skills.Resolver([row("a", r"data\texture\effect\one\spark.str"),
                                    row("b", r"data\texture\effect\two\spark.str")])
        result = resolver.resolve("spark", "keyframe_effect_atlas")
        self.assertEqual(result["resolution"], "ambiguous")
        self.assertNotIn("asset", result)

    def test_skill_alias_points_to_the_same_skill_id(self):
        index = {"lookup": {"stormgust": [89], "stromgust": [89]},
                 "skills": [{"skill_id": 89, "path": "skill-assets/89.json"}]}
        for query in ("Storm Gust", "Stromgust"):
            self.assertEqual(skills.find_skills(query, index)[0]["skill_id"], 89)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Resolve skill names/IDs to local icons, effect atlases, textures, and sounds.

Uses cached source tables and catalogs only. Missing/ambiguous/code-generated
components remain explicit instead of assigning an unrelated image.
"""
from collections import defaultdict
from datetime import datetime, timezone
from difflib import get_close_matches
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / "assets/ro/library"
SOURCE = ROOT / "assets/ro/inventory/source"


def normalized(value):
    return re.sub(r"[^\w]+", "", str(value).lower(), flags=re.UNICODE)


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")
    compact = path.is_relative_to(LIBRARY)
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=None if compact else 2,
                                    separators=(",", ":") if compact else None, allow_nan=False) + "\n")
    temporary.replace(path)


def asset_ref(row):
    return {key: row.get(key) for key in ("id", "kind", "path", "meta_path", "format", "status")}


class Resolver:
    def __init__(self, rows):
        self.paths = {row["source_path"].lower(): row for row in rows}
        self.basenames = defaultdict(list)
        for row in rows:
            name = row["source_path"].rsplit("\\", 1)[-1].rsplit(".", 1)[0].lower()
            self.basenames[(row["kind"], name)].append(row)

    def resolve(self, value, kind):
        raw = value.lower().replace("/", "\\")
        alternatives = [raw]
        try:
            alternatives.append(raw.encode("latin1").decode("cp949"))
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
        roots, suffix = {
            "keyframe_effect_atlas": (["data\\texture\\effect\\"], ".str"),
            "sprite_effect_atlas": (["data\\sprite\\이팩트\\", "data\\sprite\\effect\\"], ".spr"),
            "effect_texture": (["data\\texture\\effect\\"], ""),
            "sound": (["data\\wav\\"], ".wav"),
        }[kind]
        for alternative in alternatives:
            if suffix and not alternative.endswith(suffix):
                alternative += suffix
            # Effect table sometimes includes the effect/ prefix itself.
            variants = [alternative.removeprefix("effect\\"), alternative] if kind != "sound" else [alternative]
            for variant in variants:
                for root in roots:
                    path = root + variant
                    row = self.paths.get(path)
                    if row and row["kind"] == kind:
                        return {"requested": value, "resolution": "exact_source_path", "asset": asset_ref(row)}
        candidates = {}
        for alternative in alternatives:
            stem = alternative.rsplit("\\", 1)[-1].rsplit(".", 1)[0]
            for row in self.basenames.get((kind, stem), []):
                candidates[row["id"]] = row
        if len(candidates) == 1:
            return {"requested": value, "resolution": "unique_source_basename", "asset": asset_ref(next(iter(candidates.values())))}
        return {"requested": value, "resolution": "ambiguous" if candidates else "missing",
                "candidates": [asset_ref(row) for row in candidates.values()]}


def sounds(value, params, resolver):
    values = value if isinstance(value, list) else [value] if value else []
    result = []
    for name in values:
        if "%d" in name and params.get("rand"):
            start, end = params["rand"]
            result.extend(resolver.resolve(name.replace("%d", str(i)), "sound") for i in range(start, end + 1))
        else:
            result.append(resolver.resolve(name, "sound"))
    return result


def build_skill_index(library=LIBRARY):
    catalog = json.loads((library / "catalog.json").read_text())
    resolver = Resolver(catalog["assets"])
    skill_rows = json.loads((SOURCE / "skills.json").read_text())
    names = {row["id"]: row["name"] for row in skill_rows}
    mappings = json.loads((SOURCE / "skill-effects.json").read_text())
    effect_table = json.loads((SOURCE / "effect-table.json").read_text())
    constants = defaultdict(list)
    for name, ident in re.findall(r"\b([A-Z][A-Z0-9_]*)\s*:\s*(\d+)", (SOURCE / "skill-constants.js").read_text()):
        constants[int(ident)].append(name)
    icons = defaultdict(list)
    for row in json.loads((library / "indexes/skills.json").read_text())["assets"]:
        skill = row.get("skill")
        if skill:
            icons[skill["id"]].append(asset_ref(row))
            sidecar = library / row["meta_path"]
            meta = json.loads(sidecar.read_text())
            link = {"path": f'skill-assets/{skill["id"]}.json', "path_base": "assets/ro/library/"}
            if meta.get("related_skill_assets") != link:
                meta["related_skill_assets"] = link
                save(sidecar, meta)
    lookup, summary = {}, []
    ids = sorted(set(names) | set(constants) | set(icons) | {int(key) for key in mappings})
    for ident in ids:
        symbols = list(dict.fromkeys(constants[ident]))
        aliases = list(dict.fromkeys([*symbols, *[symbol.split("_", 1)[-1] for symbol in symbols]]))
        if ident == 89:
            aliases += ["Storm Gust", "StormGust", "Stromgust"]
        mapping = mappings.get(str(ident), {})
        effects = {}
        for role, effect_id in mapping.items():
            if role == "wav":
                continue
            components = []
            for component in effect_table.get(str(effect_id), []):
                item = {"parameters": component, "assets": [], "sounds": sounds(component.get("wav"), component, resolver)}
                kind = {"STR": "keyframe_effect_atlas", "SPR": "sprite_effect_atlas",
                        "2D": "effect_texture", "3D": "effect_texture"}.get(component.get("type"))
                if kind and component.get("file"):
                    item["assets"].append(resolver.resolve(component["file"], kind))
                if component.get("type") == "STR" and component.get("min"):
                    item["low_detail_variant"] = resolver.resolve(component["min"], "keyframe_effect_atlas")
                if component.get("textureName"):
                    item["assets"].append(resolver.resolve(component["textureName"], "effect_texture"))
                item["renderer"] = {"STR": "str_keyframe_player", "SPR": "act_layer_player"}.get(component.get("type"),
                    "procedural_or_client_code" if component.get("type") else "audio_only")
                components.append(item)
            effects[role] = {"effect_id": effect_id, "components": components,
                             "mapping_available": str(effect_id) in effect_table}
        record = {"schema_version": 1, "path_base": "assets/ro/library/", "skill_id": ident,
                  "name": "Storm Gust" if ident == 89 else names.get(ident), "reference_name": names.get(ident),
                  "constants": symbols, "aliases": aliases, "icons": icons[ident], "effects": effects,
                  "sounds": sounds(mapping.get("wav"), mapping, resolver),
                  "mapping_basis": "cached skill-effects/effect-table source data; paths resolved against current local catalog",
                  "mapping_available": str(ident) in mappings}
        path = f"skill-assets/{ident}.json"
        save(library / path, record)
        for alias in [str(ident), record["name"], record["reference_name"], *aliases]:
            if alias:
                lookup.setdefault(normalized(alias), [])
                if ident not in lookup[normalized(alias)]:
                    lookup[normalized(alias)].append(ident)
        summary.append({"skill_id": ident, "name": record["name"], "constants": symbols,
                        "path": path, "has_icon": bool(icons[ident]), "has_effect_mapping": str(ident) in mappings})
    index = {"schema_version": 1, "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
             "path_base": "assets/ro/library/", "skill_count": len(summary), "lookup": lookup, "skills": summary,
             "note": "Asset links identify source files, not a finished effect renderer. Missing/code-generated components are explicit."}
    save(library / "skill-assets.json", index)
    starter_catalog = ROOT / "assets/ro/starter-catalog.json"
    if library == LIBRARY and starter_catalog.exists():
        for row in json.loads(starter_catalog.read_text())["assets"]:
            if row["category"] != "skills":
                continue
            sidecar = ROOT / "assets/ro" / row["meta_path"]
            meta = json.loads(sidecar.read_text())
            ident = meta["game"]["entity_id"]
            if ident in ids:
                meta["related_skill_assets"] = {"path": f"library/skill-assets/{ident}.json", "path_base": "assets/ro/"}
                save(sidecar, meta)
    print(json.dumps({"skill_asset_records": len(summary), "skills_with_effect_mapping": len(mappings)}))
    return index


def find_skills(query, index):
    key = normalized(query)
    ids = index["lookup"].get(key)
    if ids is None:
        matches = get_close_matches(key, index["lookup"], n=3, cutoff=0.8)
        ids = sorted({ident for match in matches for ident in index["lookup"][match]})
    return [row for row in index["skills"] if row["skill_id"] in ids]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--find", help="Find a skill, e.g. Storm Gust, Stromgust, WZ_STORMGUST, or 89")
    args = parser.parse_args()
    if args.find:
        index = json.loads((LIBRARY / "skill-assets.json").read_text())
        print(json.dumps(find_skills(args.find, index), ensure_ascii=False, indent=2))
    else:
        build_skill_index()

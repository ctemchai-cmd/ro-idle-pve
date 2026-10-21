#!/usr/bin/env python3
"""Export a complete, indexed local asset library from an installed RO client.

The source archive determines completeness. Actor/weapon animation exports keep
east-facing actions and expose a runtime horizontal flip for west-facing use.
The complete original files remain in the downloaded GRF archives.
"""
from __future__ import annotations

import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
import math
import os
from pathlib import Path
import re
import struct
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "vendor"))
from ragx import client as client_mod
from ragx.commands.sprites_cmd import act_to_meta, decode_spr_frames, pack_sheet
from ragx.commands import effects_cmd
from ragx.formats import spr as spr_format, act as act_format, str as str_format

LIBRARY = ROOT / "assets" / "ro" / "library"
UI_PREFIX = "data\\texture\\유저인터페이스\\"
EFFECT_PREFIX = "data\\texture\\effect\\"
SPRITE_PREFIX = "data\\sprite\\"
IMAGE_SUFFIXES = (".bmp", ".tga", ".png", ".jpg", ".jpeg")
_ARCHIVE = None
_CLASS_NAMES = {}
_ITEMS_BY_RESOURCE = {}
_SKILLS_BY_CONSTANT = {}
_EFFECT_ARCHIVE = None
EXPORT_PROFILE = "east-v2-entity-links-v1"
_CONSTANT_PATH = ROOT / "assets/ro/inventory/source/skill-constants.js"
SKILL_SYMBOLS = set(re.findall(r"\b([A-Z][A-Z0-9_]*)\s*:\s*\d+", _CONSTANT_PATH.read_text())) if _CONSTANT_PATH.exists() else set()
SKILL_SYMBOLS = {name.lower() for name in SKILL_SYMBOLS}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_bytes(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    try:
        temporary.write_bytes(data)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def strict_json_values(value):
    """Preserve STR's special numeric values as strings readable by JSON.parse."""
    if isinstance(value, float) and not math.isfinite(value):
        return "NaN" if math.isnan(value) else "Infinity" if value > 0 else "-Infinity"
    if isinstance(value, dict):
        return {key: strict_json_values(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [strict_json_values(item) for item in value]
    return value


def write_json(path, data):
    write_bytes(path, (json.dumps(strict_json_values(data), ensure_ascii=False,
                                 separators=(",", ":"), allow_nan=False) + "\n").encode())


def classify(name):
    if name.startswith(SPRITE_PREFIX) and name.endswith(".spr"):
        relative = name[len(SPRITE_PREFIX):]
        parts = relative.split("\\")
        if "몸통" in parts:
            return "characters", "body_atlas"
        if "머리통" in parts:
            return "characters", "head_atlas"
        if parts[0] in ("인간족", "도람족"):
            return "weapons", "weapon_overlay_atlas"
        if parts[0] == "몬스터":
            return "monsters", "monster_atlas"
        if parts[0] in ("이팩트", "effect", "effects"):
            return "effects", "sprite_effect_atlas"
        if parts[0] in ("아이템", "item"):
            if Path(parts[-1]).stem in SKILL_SYMBOLS:
                return "skills", "skill_sprite_icon"
            return "items", "world_item_atlas"
    if name.startswith(EFFECT_PREFIX):
        if name.endswith(".str"):
            return "effects", "keyframe_effect_atlas"
        if name.endswith(IMAGE_SUFFIXES):
            return "effects", "effect_texture"
    if name.startswith(UI_PREFIX) and name.endswith(IMAGE_SUFFIXES):
        folder = name[len(UI_PREFIX):].split("\\")[0]
        basename = name.rsplit("\\", 1)[-1].rsplit(".", 1)[0]
        if folder == "item" and basename in SKILL_SYMBOLS:
            return "skills", "skill_icon"
        if folder in ("skill", "스킬"):
            return "skills", "skill_icon"
        if folder in ("item", "아이템"):
            return "items", "item_icon"
        if folder == "collection":
            return "items", "item_illustration"
    if name.startswith("data\\wav\\") and name.endswith(".wav"):
        return "effects", "sound"
    return None


def safe_stem(name):
    basename = name.rsplit("\\", 1)[-1].rsplit(".", 1)[0]
    ascii_name = re.sub(r"[^a-z0-9_-]+", "-", basename.lower()).strip("-")[:48] or "asset"
    return ascii_name + "--" + digest(name.encode())[:12]


def inventory(archive):
    names = archive.namelist()
    pool = set(names)
    tasks = []
    for name in sorted(names):
        picked = classify(name)
        if not picked:
            continue
        category, kind = picked
        suffix = ".wav" if kind == "sound" else ".png"
        path = f"{category}/{kind}/{safe_stem(name)}{suffix}"
        act = name[:-4] + ".act" if name.endswith(".spr") else None
        tasks.append({"id": category + "." + digest(name.encode())[:16],
                      "category": category, "kind": kind, "source_path": name,
                      "act_path": act if act in pool else None, "path": path})
    return tasks, names


def initialize(client_path, class_rows):
    global _ARCHIVE, _CLASS_NAMES, _ITEMS_BY_RESOURCE, _SKILLS_BY_CONSTANT, _EFFECT_ARCHIVE
    _ARCHIVE = client_mod.open_stack(client_path)
    _EFFECT_ARCHIVE = EffectArchive(_ARCHIVE)
    _CLASS_NAMES = {row["sprite"].lower(): row for row in class_rows if row.get("sprite")}
    source_root = ROOT / "assets/ro/inventory/source"
    items_path = source_root / "items.json"
    if items_path.exists():
        for row in json.loads(items_path.read_text()):
            resource = (row.get("resourceName") or "").lower()
            if not resource:
                continue
            _ITEMS_BY_RESOURCE.setdefault(resource, []).append(
                {key: row.get(key) for key in ("id", "name", "view", "viewKind")})
    constants_path = source_root / "skill-constants.js"
    skills_path = source_root / "skills.json"
    if constants_path.exists():
        skills = {row["id"]: row for row in json.loads(skills_path.read_text())} if skills_path.exists() else {}
        for symbol, ident in re.findall(r"\b([A-Z][A-Z0-9_]*)\s*:\s*(\d+)", constants_path.read_text()):
            identifier = int(ident)
            _SKILLS_BY_CONSTANT[symbol.lower()] = {"id": identifier, "constant": symbol,
                                                   "name": skills.get(identifier, {}).get("name")}


def source_fingerprints(task):
    result = {"__export_profile__": EXPORT_PROFILE,
              task["source_path"]: _ARCHIVE.fingerprint(task["source_path"])}
    if task["act_path"]:
        result[task["act_path"]] = _ARCHIVE.fingerprint(task["act_path"])
    if task["kind"] == "keyframe_effect_atlas":
        result["__json_encoding__"] = "non-finite-string-v1"
    return result


def linked_class(path):
    basename = path.rsplit("\\", 1)[-1].rsplit(".", 1)[0]
    stem = re.sub(r"_(남|여)$", "", basename)
    row = _CLASS_NAMES.get(stem)
    if row is None:
        for part in path.split("\\"):
            if part in _CLASS_NAMES:
                row = _CLASS_NAMES[part]
                break
    return row


class EffectArchive:
    """Resolve missing texture paths only when the candidate is unambiguous."""
    def __init__(self, archive):
        self.archive = archive
        self.by_name = {}
        self.by_stem = {}
        self.cache = {}
        for path in archive.namelist():
            if path.startswith(EFFECT_PREFIX) and path.endswith(IMAGE_SUFFIXES):
                name = path.rsplit("\\", 1)[-1]
                self.by_name.setdefault(name, []).append(path)
                self.by_stem.setdefault(name.rsplit(".", 1)[0], []).append(path)

    def resolve(self, path):
        path = path.lower().replace("/", "\\")
        if path in self.archive:
            return path
        if path in self.cache:
            return self.cache[path]
        name = path.rsplit("\\", 1)[-1]
        candidates = self.by_name.get(name, []) or self.by_stem.get(name.rsplit(".", 1)[0], [])
        if candidates:
            def score(candidate):
                result = 0
                for a, b in zip(path.split("\\")[:-1], candidate.split("\\")[:-1]):
                    if a != b:
                        break
                    result += 1
                return result
            maximum = max(map(score, candidates))
            candidates = [candidate for candidate in candidates if score(candidate) == maximum]
        resolved = None
        if len(candidates) == 1:
            resolved = candidates[0]
        elif candidates and len({digest(self.archive.read(candidate)) for candidate in candidates}) == 1:
            resolved = sorted(candidates)[0]
        self.cache[path] = resolved
        return resolved

    def __contains__(self, path):
        return self.resolve(path) is not None

    def read(self, path):
        resolved = self.resolve(path)
        if resolved is None:
            raise FileNotFoundError(path)
        return self.archive.read(resolved)


def png_bytes(pixels):
    from PIL import Image
    output = BytesIO()
    Image.fromarray(pixels).save(output, format="PNG")
    return output.getvalue()


def export_sprite(task):
    parsed = spr_format.parse(_ARCHIVE.read(task["source_path"]))
    pixels = decode_spr_frames(parsed)
    if not pixels:
        return None, {"status": "empty_source_sprite", "sprite_frame_count": 0}
    all_animation = {"actions": [], "events": []}
    if task["act_path"]:
        act = act_format.parse(_ARCHIVE.read(task["act_path"]))
        all_animation = act_to_meta(act, len(pixels), len(parsed.indexed_frames))
    directional = task["kind"] in ("body_atlas", "head_atlas", "weapon_overlay_atlas", "monster_atlas")
    selected = [(index, action) for index, action in enumerate(all_animation["actions"])
                if not directional or len(all_animation["actions"]) < 8 or index % 8 == 6]
    used = sorted({layer[2] for _, action in selected for frame in action["frames"] for layer in frame["layers"]})
    if not used:
        used = list(range(len(pixels)))
    remap = {old: new for new, old in enumerate(used)}
    sheet, rectangles = pack_sheet([pixels[index] for index in used])
    actions = []
    state_names = ({0: "idle", 1: "walk", 2: "attack", 3: "hurt", 4: "dead"}
                   if task["kind"] == "monster_atlas" else
                   {0: "idle", 1: "walk", 2: "sit", 3: "pickup", 4: "standby",
                    5: "attack", 6: "hurt", 7: "frozen", 8: "dead"})
    for index, action in selected:
        for frame in action["frames"]:
            for layer in frame["layers"]:
                layer[2] = remap[layer[2]]
        actions.append({"source_action_index": index,
                        "state": state_names.get(index // 8, f"action_group_{index // 8}") if directional else f"action_{index}",
                        "frame_duration_ms": action["delay"] * 25,
                        "frames": action["frames"]})
    return png_bytes(sheet), {
        "status": "exported", "width": int(sheet.shape[1]), "height": int(sheet.shape[0]),
        "sprite_frame_count": len(rectangles),
        "sprite_sheet": {"rect_format": "xywh", "frames": rectangles,
                         "source_frame_indices": used},
        "animation": {"source_action_count": len(all_animation["actions"]), "actions": actions,
                      "events": all_animation["events"],
                      "layer_format": "[x,y,frame,mirror] or [x,y,frame,mirror,r,g,b,a,scale_x,scale_y,angle]",
                      "coordinates": "layer center relative to source origin; attach anchors preserved",
                      "source_facing": "right" if directional and len(all_animation["actions"]) >= 8 else None,
                      "facing_variants": {"right": {"flip_x": False}, "left": {"flip_x": True}} if directional else {},
                      "mapping_basis": "ACT source data; state labels follow the conventional player/monster action table"},
    }


def export_bitmap(task):
    from PIL import Image
    import numpy as np
    source = _ARCHIVE.read(task["source_path"])
    with Image.open(BytesIO(source)) as image:
        rgba = np.array(image.convert("RGBA"))
    pink = ((rgba[:, :, 0] & 0xF0) == 0xF0) & (rgba[:, :, 1] < 0x10) & ((rgba[:, :, 2] & 0xF0) == 0xF0)
    rgba[pink] = 0
    return png_bytes(rgba), {"status": "exported", "width": int(rgba.shape[1]),
                            "height": int(rgba.shape[0]), "has_transparency": bool((rgba[:, :, 3] < 255).any())}


def export_effect(task, temporary_root):
    source = task["source_path"]
    parsed = str_format.parse(_ARCHIVE.read(source))
    dependencies = []
    for layer in parsed.layers:
        for name in layer.texture_names:
            path = source.rsplit("\\", 1)[0] + "\\" + name.replace("/", "\\")
            resolved = _EFFECT_ARCHIVE.resolve(path)
            dependencies.append({"requested_path": path, "resolved_path": resolved,
                                 "available": resolved is not None,
                                 "source_fingerprint": _ARCHIVE.fingerprint(resolved) if resolved else None})
    effects_cmd.export_one(source, parsed, _EFFECT_ARCHIVE, temporary_root)
    relative = source[len(EFFECT_PREFIX):-4].replace("\\", "/")
    png_path = temporary_root / (relative + ".png")
    json_path = temporary_root / (relative + ".json")
    result = json.loads(json_path.read_text())
    payload = png_path.read_bytes()
    png_path.unlink()
    json_path.unlink()
    missing = sorted({d["requested_path"] for d in dependencies if not d["available"]})
    return payload, {"status": "exported" if not missing else "source_dependencies_missing",
                     "width": result["w"], "height": result["h"],
                     "effect": result, "dependencies": dependencies, "missing_dependencies": missing,
                     "number_encoding": {"non_finite_values": "strings: Infinity, -Infinity, NaN",
                                         "scope": "effect.layers[].keys numeric cells; original STR values preserved"}}


def export_sound(task):
    data = _ARCHIVE.read(task["source_path"])
    details = {"status": "exported", "codec": "unknown"}
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        cursor = 12
        while cursor + 8 <= len(data):
            tag, size = struct.unpack_from("<4sI", data, cursor)
            if tag == b"fmt " and size >= 16:
                codec, channels, rate, _, _, bits = struct.unpack_from("<HHIIHH", data, cursor + 8)
                details.update(codec=codec, channels=channels, sample_rate=rate, bits_per_sample=bits)
                break
            cursor += 8 + size + size % 2
    return data, details


def cached_result(task, output, fingerprints):
    sidecar = output.with_suffix(".meta.json")
    if not sidecar.exists():
        return None
    meta = json.loads(sidecar.read_text())
    if meta["source"]["fingerprints"] != fingerprints:
        return None
    if task["kind"] == "keyframe_effect_atlas":
        for dependency in meta.get("dependencies", []):
            if "requested_path" not in dependency:
                return None
            resolved = _EFFECT_ARCHIVE.resolve(dependency["requested_path"])
            if resolved != dependency["resolved_path"]:
                return None
            if resolved and _ARCHIVE.fingerprint(resolved) != dependency["source_fingerprint"]:
                return None
    if meta.get("file"):
        current_output = LIBRARY / meta["file"]["path"]
        if not current_output.exists() or digest(current_output.read_bytes()) != meta["file"]["sha256"]:
            return None
    return summary(meta, "cached")


def summary(meta, operation):
    file = meta.get("file") or {}
    return {"id": meta["id"], "name": meta["name"], "category": meta["category"],
            "kind": meta["kind"], "status": meta["status"], "operation": operation,
            "source_path": meta["source"]["path"], "path": file.get("path"),
            "meta_path": meta["meta_path"], "width": meta.get("width"), "height": meta.get("height"),
            "sha256": file.get("sha256"), "bytes": file.get("bytes", 0),
            "format": file.get("format"),
            "class": meta.get("class"), "sprite_frame_count": meta.get("sprite_frame_count", 0),
            "source_facing": meta.get("animation", {}).get("source_facing"),
            "missing_dependencies": meta.get("missing_dependencies", [])}


def process(task):
    output = LIBRARY / task["path"]
    try:
        fingerprints = source_fingerprints(task)
        cached = cached_result(task, output, fingerprints)
        if cached:
            return cached
        if task["source_path"].endswith(".spr"):
            payload, details = export_sprite(task)
        elif task["kind"] == "keyframe_effect_atlas":
            payload, details = export_effect(task, LIBRARY / ".work" / str(os.getpid()))
        elif task["kind"] == "sound":
            payload, details = export_sound(task)
        else:
            payload, details = export_bitmap(task)
        klass = linked_class(task["source_path"])
        basename = task["source_path"].rsplit("\\", 1)[-1].rsplit(".", 1)[0]
        name = f'{klass.get("jt") or klass.get("name")} / {basename}' if klass else basename
        entities = _ITEMS_BY_RESOURCE.get(basename, []) if task["kind"] in ("item_icon", "item_illustration", "world_item_atlas") else []
        skill = _SKILLS_BY_CONSTANT.get(basename) if task["kind"] in ("skill_icon", "skill_sprite_icon") else None
        previous = {}
        if output.with_suffix(".meta.json").exists():
            previous = json.loads(output.with_suffix(".meta.json").read_text())
        file = None
        if payload is not None:
            write_bytes(output, payload)
            file = {"path": task["path"], "bytes": len(payload), "sha256": digest(payload),
                    "format": "WAV" if task["kind"] == "sound" else "PNG"}
        meta = {"schema_version": 2, "id": task["id"], "name": name,
                "category": task["category"], "kind": task["kind"],
                "meta_path": str(Path(task["path"]).with_suffix(".meta.json")),
                "tags": [task["category"], task["kind"], basename],
                "game": {"name": "Ragnarok Online", "item_references": entities, "skill": skill},
                "class": {key: klass.get(key) for key in ("id", "renderId", "jt", "name", "race")} if klass else None,
                "source": {"provider": "Gravity kRO 2024-06-10 full client", "path": task["source_path"],
                           "act_path": task["act_path"], "fingerprints": fingerprints},
                "file": file, "generated_at": now(), **details,
                "visual_review": {"status": "not_manually_reviewed"},
                "annotations": previous.get("annotations", {})}
        write_json(output.with_suffix(".meta.json"), meta)
        return summary(meta, "exported")
    except Exception as error:
        return {**task, "status": "failed", "operation": "failed", "error": f"{type(error).__name__}: {error}"}


def check():
    catalog = json.loads((LIBRARY / "catalog.json").read_text())
    failures = []
    for asset in catalog["assets"]:
        if asset["status"] == "failed":
            failures.append(asset["id"])
            continue
        def reject_constant(value):
            raise ValueError("Non-standard JSON numeric constant: " + value)
        meta = json.loads((LIBRARY / asset["meta_path"]).read_text(), parse_constant=reject_constant)
        if not meta.get("file"):
            continue
        path = LIBRARY / meta["file"]["path"]
        if not path.exists() or digest(path.read_bytes()) != meta["file"]["sha256"]:
            failures.append(asset["id"])
        sheet = meta.get("sprite_sheet", {})
        for x, y, w, h in sheet.get("frames", []):
            if not (0 <= x <= x+w <= meta["width"] and 0 <= y <= y+h <= meta["height"]):
                failures.append(asset["id"])
                break
        for action in meta.get("animation", {}).get("actions", []):
            for frame in action["frames"]:
                if any(not 0 <= layer[2] < len(sheet["frames"]) for layer in frame["layers"]):
                    failures.append(asset["id"])
    result = {"checked": len(catalog["assets"]), "failed": sorted(set(failures)),
              "source_dependency_issue_count": catalog["status_counts"].get("source_dependencies_missing", 0),
              "generated_at": now(), "catalog_sha256": digest((LIBRARY / "catalog.json").read_bytes()),
              "checks": ["strict JSON", "file SHA-256", "sprite atlas bounds", "ACT layer frame references"]}
    write_json(LIBRARY / "validation.json", result)
    print(json.dumps(result))
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", default=str(ROOT / "assets/ro/_source_archives/kro-20240610"))
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--inventory-only", action="store_true")
    parser.add_argument("--limit", type=int, help="Development smoke test only; coverage remains partial")
    args = parser.parse_args()
    if args.check:
        return check()
    if not (Path(args.client) / "data.grf").exists() and (LIBRARY / "catalog.json").exists():
        print("Source client is absent; validating the retained web library without downloading.", flush=True)
        result = check()
        if not result:
            from index_ro_library import build_indexes
            build_indexes(LIBRARY)
        return result
    archive = client_mod.open_stack(args.client)
    tasks, names = inventory(archive)
    all_count = len(tasks)
    unpaired_acts = [name for name in names if name.startswith(SPRITE_PREFIX) and name.endswith(".act")
                     and name[:-4]+".spr" not in archive and classify(name[:-4]+".spr")]
    archive.close()
    write_json(LIBRARY / "inventory.json", {"schema_version": 1, "generated_at": now(),
               "source_client": "kRO full client 2024-06-10", "source_file_count": len(names),
               "planned_count": all_count, "counts_by_kind": dict(Counter(t["kind"] for t in tasks)),
               "unpaired_acts": sorted(unpaired_acts), "assets": tasks})
    print("Inventory:", all_count, dict(Counter(t["kind"] for t in tasks)), flush=True)
    if args.inventory_only:
        return 0
    if args.limit:
        tasks = tasks[:args.limit]
    classes_path = ROOT / "assets/ro/inventory/source/classes.json"
    classes = json.loads(classes_path.read_text()) if classes_path.exists() else []
    started = time.monotonic()
    results = []
    with ProcessPoolExecutor(max_workers=args.jobs, initializer=initialize,
                             initargs=(args.client, classes)) as pool:
        for result in pool.map(process, tasks, chunksize=16):
            results.append(result)
            if len(results) % 100 == 0 or len(results) == len(tasks):
                print(len(results), "/", len(tasks), dict(Counter(r["status"] for r in results)),
                      round(time.monotonic()-started), "seconds", flush=True)
    counts = Counter(r["status"] for r in results)
    catalog = {"schema_version": 2, "generated_at": now(), "path_base": "assets/ro/library/",
               "source_client": "kRO full client 2024-06-10", "planned_count": all_count,
               "processed_count": len(results), "asset_count": sum(bool(r.get("sha256")) for r in results),
               "status_counts": dict(counts), "counts_by_category": dict(Counter(r["category"] for r in results)),
               "operation_counts": dict(Counter(r["operation"] for r in results)),
               "counts_by_kind": dict(Counter(r["kind"] for r in results)),
               "total_bytes": sum(r.get("bytes", 0) for r in results),
               "unpaired_act_count": len(unpaired_acts), "assets": results}
    write_json(LIBRARY / "catalog.json", catalog)
    write_json(LIBRARY / "coverage.json", {key: value for key, value in catalog.items() if key != "assets"} |
               {"failed": [r for r in results if r["status"] == "failed"],
                "source_dependencies_missing": [r for r in results if r.get("missing_dependencies")]})
    print("Complete:", catalog["asset_count"], "files; status", dict(counts), flush=True)
    if not counts.get("failed") and len(results) == all_count:
        from index_ro_library import build_indexes
        build_indexes(LIBRARY)
    return 1 if counts.get("failed") or len(results) != all_count else 0


if __name__ == "__main__":
    sys.exit(main())

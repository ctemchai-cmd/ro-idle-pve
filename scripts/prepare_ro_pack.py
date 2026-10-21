#!/usr/bin/env python3
"""Build the missing local preparation pack from a temporary RO client and captures."""
from __future__ import annotations
import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from io import BytesIO
import json
from pathlib import Path
import re
import subprocess
import sys

from PIL import Image
import build_ro_library as bulk

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/ro/prepared"
SOURCE = ROOT / "assets/ro/inventory/source"
STAGE = Path("/private/tmp/ro-idle-prep")
GARMENT_ITEMS = [2576, 2589, 20502, 20504, 20507, 20509]
MAPS = ["prt_fild08", "pay_fild01", "gef_dun00", "moc_fild01", "iz_dun01", "prontera"]
STAGES = {
    "prt_fild08": (430, 840, 590), "moc_fild01": (430, 840, 590),
    "pay_fild01": (420, 620, 535), "gef_dun00": (650, 930, 560),
    "iz_dun01": (480, 840, 645), "prontera": (430, 840, 650),
}
_ITEMS = []


def choose_web_image(png):
    with Image.open(BytesIO(png)) as source:
        rgba = source.convert("RGBA")
        output = BytesIO()
        rgba.save(output, format="WEBP", lossless=True, exact=True, method=4, quality=100)
        candidate = output.getvalue()
        if len(candidate) < len(png):
            with Image.open(BytesIO(candidate)) as decoded:
                if decoded.convert("RGBA").tobytes() != rgba.tobytes():
                    raise ValueError("Lossless WebP pixel verification failed")
            return candidate, ".webp", "WEBP"
    return png, ".png", "PNG"


def save_asset(payload, category, kind, name, source, details=None, equipment=None):
    key = source.get("path") or source.get("url") or name
    ident = "prepared." + category + "." + bulk.digest(str(key).encode())[:16]
    stem = re.sub(r"[^a-z0-9_-]+", "-", name.lower()).strip("-")[:64] or "asset"
    stem += "--" + ident.rsplit(".", 1)[-1][:12]
    details = details or {}
    if payload.startswith(b"\x89PNG"):
        payload, suffix, fmt = choose_web_image(payload)
    else:
        suffix = {"font": ".woff2", "music": ".mp3", "stylesheet": ".css"}[kind]
        fmt = suffix[1:].upper()
    path = OUTPUT / category / (stem + suffix)
    sidecar = path.with_suffix(".meta.json")
    previous = json.loads(sidecar.read_text()) if sidecar.exists() else {}
    checksum = bulk.digest(payload)
    same_media = previous.get("file", {}).get("sha256") == checksum
    meta = {"schema_version": 2, "id": ident, "name": name, "category": category, "kind": kind,
            "meta_path": str(sidecar.relative_to(OUTPUT)), "source": source,
            "file": {"path": str(path.relative_to(OUTPUT)), "bytes": len(payload),
                     "sha256": checksum, "format": fmt},
            "status": "exported", "tags": [category, kind], "equipment": equipment,
            "generated_at": bulk.now(), **details,
            "visual_review": previous.get("visual_review", {"status": "not_manually_reviewed"}) if same_media else {"status": "not_manually_reviewed"},
            "annotations": previous.get("annotations", {})}
    bulk.write_bytes(path, payload)
    bulk.write_json(sidecar, meta)
    return meta


def initialize(client):
    global _ITEMS
    classes = json.loads((SOURCE / "classes.json").read_text())
    bulk.initialize(client, classes)
    _ITEMS = json.loads((SOURCE / "items.json").read_text())


def export_task(task):
    try:
        path = task["source_path"]
        if task["kind"] == "ui_image":
            payload, details = bulk.export_bitmap(task)
        else:
            payload, details = bulk.export_sprite({**task, "kind": "head_atlas" if task["category"] == "headgear" else "weapon_overlay_atlas"})
        if payload is None:
            return {"status": "empty", "source_path": path}
        stem = path.rsplit("\\", 1)[-1][:-4]
        gender = "male" if "\\남\\" in path or "_남" in stem else "female" if "\\여\\" in path or "_여" in stem else None
        resource = re.sub(r"^(남|여)_", "", stem)
        matches = [row for row in _ITEMS if (row.get("resourceName") or "").lower() == resource]
        garment = task.get("garment")
        if garment:
            matches = [garment]
        klass = bulk.linked_class(path)
        equipment = {"gender": gender, "class_sprite": re.sub(r"_(남|여)$", "", stem) if garment else path.split("\\")[3] if task["category"] == "shields" else None,
                     "class_id": klass.get("id") if klass else None,
                     "item_ids": [row["id"] for row in matches],
                     "view_ids": sorted({row.get("spriteView") or row.get("view") for row in matches if row.get("spriteView") or row.get("view")}),
                     "view_kind": "headgear" if task["category"] == "headgear" else "garment" if garment else "shield" if task["category"] == "shields" else None,
                     "resource": resource, "garment_folder": garment["resourceName"] if garment else None}
        name = path.rsplit("\\", 1)[-1][:-4]
        meta = save_asset(payload, task["category"], task["kind"], name,
                          {"provider": "Gravity kRO full client 2024-06-10", "path": path,
                           "act_path": task["act_path"], "fingerprints": bulk.source_fingerprints(task),
                           "archive_url": "https://rofull.gnjoy.com/Ragnarok_240610.zip",
                           "archive_sha256": "53a4b470d7cc1e197edb400b6a52682942d7f35f7618aa7727d8751fa2406f0c",
                           "temporary_source": True}, details, equipment if task["category"] != "ui" else None)
        return {"status": "exported", "id": meta["id"]}
    except Exception as error:
        return {"status": "failed", "source_path": task["source_path"], "error": str(error)}


def build_tasks(client):
    archive = bulk.client_mod.open_stack(client)
    names = archive.namelist()
    items = json.loads((SOURCE / "items.json").read_text())
    garments = {row["resourceName"].lower(): row for row in items if row["id"] in GARMENT_ITEMS}
    tasks, skipped = [], []
    for path in sorted(names):
        category = kind = garment = None
        if path.startswith(("data\\sprite\\악세사리\\", "data\\sprite\\악세서리\\")) and path.endswith(".spr"):
            category, kind = "headgear", "headgear_atlas"
        elif path.startswith("data\\sprite\\방패\\") and path.endswith(".spr"):
            category, kind = "shields", "shield_atlas"
        elif path.startswith("data\\sprite\\로브\\") and path.endswith(".spr"):
            folder = path.split("\\")[3]
            if folder in garments:
                category, kind, garment = "garments", "garment_atlas", garments[folder]
        elif path.startswith(bulk.UI_PREFIX) and path.endswith(bulk.IMAGE_SUFFIXES):
            folder = path[len(bulk.UI_PREFIX):].split("\\")[0]
            if folder in ("basic_interface", "menu_icon", "ro_menu_icon", "statuswnd"):
                category, kind = "ui", "ui_image"
        if not category:
            continue
        act = path[:-4] + ".act" if path.endswith(".spr") else None
        if act and act not in archive:
            skipped.append({"path": path, "reason": "no paired ACT; not registered as ready animation"})
            continue
        tasks.append({"source_path": path, "act_path": act, "category": category, "kind": kind, "garment": garment})
    archive.close()
    bulk.write_json(OUTPUT / "manifest.json", {"source_client": "kRO 2024-06-10", "garment_item_ids": GARMENT_ITEMS,
                    "source_file_count": len(tasks), "counts": dict(Counter(t["category"] for t in tasks)), "skipped": skipped})
    return tasks


def add_media(stage):
    music = json.loads((stage / "bgm-index.json").read_text())["maps"]
    captures = {}
    for mapname in MAPS:
        capture_path = stage / (mapname + ".capture.json")
        capture = json.loads(capture_path.read_text())
        captures[mapname] = capture
        left, right, floor = STAGES[mapname]
        payload = (stage / (mapname + ".png")).read_bytes()
        meta = save_asset(payload, "backgrounds", "battle_background", mapname,
                         {"provider": "Ragnarok map rendered with latamvisuais", "url": f"https://assets.latam-tools.com.br/maps/{mapname}/manifest.json",
                          "renderer_repository": "https://github.com/adsonpleal/latamvisuais", "camera": {k: v for k, v in capture.items() if k != "manifest"}},
                         {"width": 1280, "height": 720, "battle_stage": {"floor_y": floor, "left_x": left, "right_x": right, "status": "prototype_placement"},
                          "usage": "hub_background" if mapname == "prontera" else "battle_background",
                          "map": mapname})
        track = music[mapname]
        payload = (stage / track).read_bytes()
        probe = json.loads(subprocess.check_output(["ffprobe", "-v", "quiet", "-show_format", "-show_streams", "-of", "json", str(stage / track)]))
        save_asset(payload, "music", "music", track[:-4], {"provider": "ragassets BGM", "url": "https://assets.latam-tools.com.br/bgm/" + track},
                   {"duration_seconds": float(probe["format"]["duration"]), "map": mapname, "recommended_loop": True,
                    "channels": probe["streams"][0]["channels"], "sample_rate": int(probe["streams"][0]["sample_rate"])})
    bulk.write_json(OUTPUT / "inventory/background-captures.json", {
        "renderer_repository": "https://github.com/adsonpleal/latamvisuais",
        "scope": "1280x720 still captures of source maps with experimental renderer; not full client scene fidelity",
        "captures": captures})
    from fontTools.ttLib import TTFont
    font = TTFont(stage / "NotoSansThai.ttf")
    chars = set().union(*(set(table.cmap) for table in font['cmap'].tables))
    sample = "ภาษาไทย ทดสอบการต่อสู้ Ragnarok 123"
    assert all(ord(char) in chars for char in sample if not char.isspace())
    font.flavor = "woff2"
    output = BytesIO();font.save(output)
    save_asset(output.getvalue(), "fonts", "font", "noto-sans-thai",
               {"provider": "Google Fonts", "url": "https://github.com/google/fonts/tree/main/ofl/notosansthai"},
               {"family": "Noto Sans Thai", "weights": [100, 900], "thai_sample_verified": sample, "license_file": "fonts/OFL.txt"})
    (OUTPUT / "fonts/OFL.txt").write_bytes((stage / "font-OFL.txt").read_bytes())


def rebuild():
    rows, canonical = [], {}
    metadata = []
    for sidecar in sorted(OUTPUT.rglob("*.meta.json")):
        meta = json.loads(sidecar.read_text())
        file = meta["file"]
        key = (file["sha256"], file["bytes"], file["format"])
        if key in canonical and file["path"] != canonical[key]:
            old = OUTPUT / file["path"]
            target = OUTPUT / canonical[key]
            if old.read_bytes() != target.read_bytes():raise ValueError("dedup mismatch")
            file["path"] = canonical[key]
            meta["shared_media"] = True
            bulk.write_json(sidecar, meta)
            old.unlink()
        else:
            canonical[key] = file["path"]
        metadata.append(meta)
        rows.append({key: meta.get(key) for key in ("id", "name", "category", "kind", "meta_path", "status", "width", "height", "equipment")} |
                    {"path": file["path"], "bytes": file["bytes"], "sha256": file["sha256"], "format": file["format"],
                     "source_path": meta["source"].get("path"), "source_url": meta["source"].get("url")})
    catalog = {"schema_version": 2, "path_base": "assets/ro/prepared/", "generated_at": bulk.now(), "asset_count": len(rows),
               "counts_by_category": dict(Counter(r["category"] for r in rows)), "counts_by_kind": dict(Counter(r["kind"] for r in rows)),
               "total_bytes": sum(row["bytes"] for row in rows), "unique_media_count": len(canonical),
               "unique_media_bytes": sum((OUTPUT / path).stat().st_size for path in canonical.values()), "assets": rows}
    bulk.write_json(OUTPUT / "catalog.json", catalog)
    return catalog, metadata


def check():
    catalog = json.loads((OUTPUT / "catalog.json").read_text())
    errors = []
    for row in catalog["assets"]:
        meta = json.loads((OUTPUT / row["meta_path"]).read_text())
        file = meta["file"];path = OUTPUT / file["path"]
        if not path.exists() or bulk.digest(path.read_bytes()) != file["sha256"]:
            errors.append(row["id"]);continue
        sheet = meta.get("sprite_sheet", {})
        for x, y, w, h in sheet.get("frames", []):
            if not (0 <= x < x+w <= meta["width"] and 0 <= y < y+h <= meta["height"]):errors.append(row["id"])
        for action in meta.get("animation", {}).get("actions", []):
            for frame in action["frames"]:
                if any(not 0 <= layer[2] < len(sheet["frames"]) for layer in frame["layers"]):errors.append(row["id"])
    result = {"checked": len(catalog["assets"]), "failed": sorted(set(errors)), "generated_at": bulk.now()}
    bulk.write_json(OUTPUT / "validation.json", result);print(json.dumps(result), flush=True)
    return 1 if errors else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", default=str(STAGE / "client/app"))
    parser.add_argument("--stage", default=str(STAGE))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:return check()
    tasks = build_tasks(args.client);print("Preparing",len(tasks),"source files",flush=True)
    results = []
    with ProcessPoolExecutor(max_workers=4, initializer=initialize, initargs=(args.client,)) as pool:
        for result in pool.map(export_task, tasks, chunksize=16):
            results.append(result)
            if len(results) % 500 == 0:print(len(results), dict(Counter(r["status"] for r in results)), flush=True)
    failed = [r for r in results if r["status"] == "failed"]
    bulk.write_json(OUTPUT / "import-result.json", {"counts": dict(Counter(r["status"] for r in results)), "failed": failed})
    if failed:print(json.dumps(failed[:5]),flush=True);return 1
    add_media(Path(args.stage))
    catalog, _ = rebuild();print("Prepared",catalog["asset_count"],catalog["counts_by_category"],flush=True)
    return check()


if __name__ == "__main__":sys.exit(main())

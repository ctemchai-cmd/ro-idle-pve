#!/usr/bin/env python3
"""Download the curated RO manifest and cache image facts in adjacent JSON files.

Normal reruns verify existing checksums and reuse metadata without decoding images.
--check validates the local library without making any network requests.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "ro"
MANIFEST = ASSET_ROOT / "manifest.json"
MAX_BYTES = 16 * 1024 * 1024
USER_AGENT = "ROIdleClassicAssetImporter/0.1 (curated local prototype assets)"


def timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256(payload):
    return hashlib.sha256(payload).hexdigest()


def atomic_write(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    try:
        temporary.write_bytes(payload)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def write_json(path, data):
    text = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)
    if len(text) > 16384:
        text = json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    atomic_write(path, (text + "\n").encode())


def entries_from_manifest(manifest):
    entries = []
    provider = manifest["providers"]["ragassets"]
    direction = manifest["direction"]
    for category in ("characters", "monsters"):
        for actor in manifest[category]:
            for state, action in manifest["animation_actions"][category].items():
                asset_id = f'{category}.{actor["slug"]}.{state}'
                canvas = manifest.get("canvas_overrides", {}).get(asset_id, manifest["canvas"])
                params = {
                    "job": actor["job_id"],
                    "action": action + direction["index"],
                    "canvas": (f'{canvas["width"]}x{canvas["height"]}'
                               f'+{canvas["origin_x"]}+{canvas["origin_y"]}'),
                }
                appearance = manifest["appearance"] if category == "characters" else None
                if appearance:
                    params.update(appearance)
                entries.append({
                    "id": asset_id,
                    "name": actor["name"], "category": category,
                    "kind": "actor_animation", "game_id": actor["job_id"],
                    "path": f'{category}/{actor["slug"]}/{state}.png',
                    "tags": ["ragnarok_online", category, actor["slug"], state, *actor["tags"]],
                    "state": state, "direction": direction, "appearance": appearance,
                    "anchor": {"x": canvas["origin_x"], "y": canvas["origin_y"],
                               "basis": "explicit_renderer_canvas_origin"},
                    "expected_canvas": [canvas["width"], canvas["height"]],
                    "source": {
                        "provider": "ragassets", "page_url": provider["documentation_url"],
                        "download_url": provider["base_url"] + "/image?" + urlencode(params),
                        "render_parameters": params, "client_variant": provider["client_variant"],
                    },
                })
    for icon in manifest["icons"]:
        provider_name = icon.get("provider", "divine_pride")
        provider = manifest["providers"][provider_name]
        entity = "skill" if icon["category"] == "skills" else "item"
        entries.append({
            "id": f'{icon["category"]}.{icon["slug"]}',
            "name": icon["name"], "category": icon["category"],
            "kind": icon.get("kind", "icon"), "game_id": icon["game_id"],
            "path": f'{icon["category"]}/{icon["slug"]}.png',
            "tags": ["ragnarok_online", "icon", icon["slug"], *icon["tags"]],
            "state": None, "direction": None, "appearance": None, "anchor": None,
            "source": {
                "provider": provider_name,
                "page_url": icon.get("page_url", f'https://www.divine-pride.net/database/{entity}/{icon["game_id"]}'),
                "download_url": provider["base_url"] + icon["image_path"],
            },
        })
    ids = [entry["id"] for entry in entries]
    paths = [entry["path"] for entry in entries]
    if len(set(ids)) != len(ids) or len(set(paths)) != len(paths):
        raise ValueError("Manifest contains duplicate IDs or paths")
    for entry in entries:
        path = ASSET_ROOT / entry["path"]
        if not path.resolve().is_relative_to(ASSET_ROOT.resolve()):
            raise ValueError("Asset path escapes the library")
    return entries


def download(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=40) as response:
                payload = response.read(MAX_BYTES + 1)
                if len(payload) > MAX_BYTES:
                    raise ValueError("Image exceeds the 16 MiB limit")
                if not payload.startswith(b"\x89PNG\r\n\x1a\n"):
                    raise ValueError("Response is not a PNG/APNG image")
                return payload, {
                    "resolved_url": response.geturl(), "retrieved_at": timestamp(),
                    "content_type": response.headers.get("Content-Type"),
                    "etag": response.headers.get("ETag"),
                    "last_modified": response.headers.get("Last-Modified"),
                }
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            try:
                delay = min(30, max(2, int(error.headers.get("Retry-After", "2"))))
            except ValueError:
                delay = 5
            time.sleep(delay * (attempt + 1))
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def inspect_image(payload, expected_canvas=None):
    from PIL import Image

    with Image.open(BytesIO(payload)) as image:
        if image.format not in ("PNG", "WEBP"):
            raise ValueError("Only PNG/APNG/WebP assets are supported")
        image_format = image.format
        if expected_canvas and list(image.size) != expected_canvas:
            raise ValueError(f"Renderer canvas {image.size} differs from {expected_canvas}")
        frame_count = getattr(image, "n_frames", 1)
        default_image = bool(image.info.get("default_image", False))
        loops = image.info.get("loop")
        frames = []
        visible = False
        elapsed = 0.0
        transparency = False
        touches_edge = False
        for index in range(frame_count):
            image.seek(index)
            image.load()
            rgba = image.convert("RGBA")
            alpha = rgba.getchannel("A")
            bounds = alpha.getbbox()
            visible = visible or bounds is not None
            transparency = transparency or alpha.getextrema()[0] < 255
            if bounds:
                touches_edge |= (bounds[0] == 0 or bounds[1] == 0
                                 or bounds[2] == image.width or bounds[3] == image.height)
            duration = float(image.info.get("duration", 0))
            if duration < 0:
                raise ValueError("Negative frame duration")
            poster = default_image and index == 0
            frames.append({
                "index": index, "is_default_image": poster,
                "start_ms": elapsed, "duration_ms": duration,
                "canvas_rect": [0, 0, image.width, image.height],
                "encoded_rect": list(getattr(image, "dispose_extent", (0, 0, *image.size))) if image_format == "PNG" else None,
                "alpha_bounds": list(bounds) if bounds else None,
                "disposal": int(image.info.get("disposal", 0)) if image_format == "PNG" else None,
                "blend": int(image.info.get("blend", 0)) if image_format == "PNG" else None,
            })
            if not poster:
                elapsed += duration
        if not visible:
            raise ValueError("Image is fully transparent in every frame")
        return {
            "format": ("APNG" if frame_count > 1 else "PNG") if image_format == "PNG" else ("ANIMATED_WEBP" if frame_count > 1 else "WEBP"),
            "width": image.width, "height": image.height, "mode": image.mode,
            "frame_count": frame_count, "has_transparency": transparency,
            "default_image": default_image, "source_loop_count": loops,
            "cycle_duration_ms": elapsed, "frames": frames,
            "touches_canvas_edge": touches_edge,
        }


def sidecar_path(path):
    return path.with_suffix(".meta.json")


def read_cached(entry):
    meta_path = sidecar_path(ASSET_ROOT / entry["path"])
    if not meta_path.is_file():
        raise ValueError("Metadata is missing")
    metadata = json.loads(meta_path.read_text())
    path = ASSET_ROOT / metadata["file"]["path"]
    if not path.resolve().is_relative_to(ASSET_ROOT.resolve()) or not path.is_file():
        raise ValueError("Image is missing or escapes the library")
    payload = path.read_bytes()
    if metadata.get("schema_version") != 1 or metadata.get("id") != entry["id"]:
        raise ValueError("Metadata ID/schema differs from the manifest")
    facts = metadata["file"]
    expected_paths = {entry["path"], str(Path(entry["path"]).with_suffix(".webp"))}
    if facts["path"] not in expected_paths or facts["bytes"] != len(payload):
        raise ValueError("Image path or size differs from its metadata")
    if facts["sha256"] != sha256(payload):
        raise ValueError("Image checksum differs from its metadata")
    if metadata["source"]["download_url"] != entry["source"]["download_url"]:
        raise ValueError("Manifest source changed; use --refresh to update")
    if facts["frame_count"] != len(facts["frames"]):
        raise ValueError("Metadata frame count is inconsistent")
    width, height = facts["width"], facts["height"]
    for frame in facts["frames"]:
        for field in ("canvas_rect", "encoded_rect", "alpha_bounds"):
            rect = frame[field]
            if rect is not None and not (0 <= rect[0] <= rect[2] <= width
                                         and 0 <= rect[1] <= rect[3] <= height):
                raise ValueError(f"Frame {field} is out of bounds")
    return metadata


def import_one(entry, refresh=False):
    path = ASSET_ROOT / entry["path"]
    old = None
    if sidecar_path(path).exists() and not refresh:
        return read_cached(entry), "cached"
    if sidecar_path(path).exists():
        old = json.loads(sidecar_path(path).read_text())
    payload, transport = download(entry["source"]["download_url"])
    facts = inspect_image(payload, entry.get("expected_canvas"))
    digest = sha256(payload)
    review = {"status": "pending", "notes": []}
    if old and old.get("file", {}).get("sha256") == digest:
        review = old.get("visual_review", review)
    metadata = {
        "schema_version": 1, "id": entry["id"], "name": entry["name"],
        "category": entry["category"], "kind": entry["kind"],
        "game": {"name": "Ragnarok Online", "entity_id": entry["game_id"]},
        "tags": entry["tags"],
        "source": {**entry["source"], **transport},
        "file": {"path": entry["path"], "bytes": len(payload), "sha256": digest, **facts},
        "animation": {
            "state": entry["state"], "direction": entry["direction"],
            "mapping_basis": "renderer_documentation" if entry["state"] else None,
            "recommended_loop": entry["state"] in ("idle", "walk"),
            "anchor": entry["anchor"],
            "facing_variants": {"right": {"flip_x": False}, "left": {"flip_x": True}}
                               if entry["state"] and entry["direction"].get("facing") == "right" else {},
        },
        "appearance": entry["appearance"],
        "usage": {"browser_img_ready": True, "phaser_atlas_ready": False,
                  "note": "APNG timing is embedded; create a frame atlas before Phaser Sprite use."
                          if facts["format"] == "APNG" else "Single static PNG."},
        "visual_review": review,
        "annotations": old.get("annotations", {}) if old else {},
    }
    atomic_write(path, payload)
    write_json(sidecar_path(path), metadata)
    if old and old.get("file", {}).get("path") != entry["path"]:
        obsolete = ASSET_ROOT / old["file"]["path"]
        if obsolete == path.with_suffix(".webp"):
            obsolete.unlink(missing_ok=True)
    return metadata, "downloaded"


def write_catalog(entries):
    assets, missing = [], []
    for entry in entries:
        try:
            meta = read_cached(entry)
        except (ValueError, KeyError, OSError) as error:
            missing.append({"id": entry["id"], "error": str(error)})
            continue
        assets.append({
            "id": meta["id"], "name": meta["name"], "category": meta["category"],
            "kind": meta["kind"], "state": meta["animation"]["state"],
            "tags": meta["tags"], "path": meta["file"]["path"],
            "meta_path": sidecar_path(Path(meta["file"]["path"])).as_posix(),
            "width": meta["file"]["width"], "height": meta["file"]["height"],
            "frame_count": meta["file"]["frame_count"],
            "cycle_duration_ms": meta["file"]["cycle_duration_ms"],
            "sha256": meta["file"]["sha256"],
            "format": meta["file"]["format"],
            "review_status": meta["visual_review"]["status"],
        })
    catalog = {
        "schema_version": 1, "generated_at": timestamp(),
        "path_base": "assets/ro/", "manifest_path": "manifest.json",
        "asset_count": len(assets), "planned_count": len(entries),
        "counts_by_category": dict(sorted(Counter(a["category"] for a in assets).items())),
        "missing": missing, "assets": assets,
    }
    write_json(ASSET_ROOT / "starter-catalog.json", catalog)
    library_path = ASSET_ROOT / "library" / "catalog.json"
    if library_path.exists():
        library = json.loads(library_path.read_text())
        catalog["schema_version"] = 2
        catalog["collections"] = [
            {"name": "starter", "catalog_path": "starter-catalog.json"},
            {"name": "full_client_library", "catalog_path": "library/catalog.json",
             "coverage_path": "library/coverage.json", "source_client": library["source_client"]},
        ]
        catalog["asset_count"] += library["asset_count"]
        catalog["planned_count"] += library["planned_count"]
        combined_counts = Counter(a["category"] for a in assets)
        combined_counts.update(library["counts_by_category"])
        catalog["counts_by_category"] = dict(sorted(combined_counts.items()))
        catalog["inline_collection"] = "starter"
        catalog["inline_asset_count"] = len(assets)
        catalog["source_dependency_issue_count"] = library["status_counts"].get("source_dependencies_missing", 0)
        catalog["source_dependency_report_path"] = "library/coverage.json"
        catalog["skill_assets_index_path"] = "library/skill-assets.json"
        if (ASSET_ROOT / "web-optimization.json").exists():
            catalog["web_optimization_report_path"] = "web-optimization.json"
        catalog["category_indexes"] = {
            category: "library/indexes/" + category + ".json"
            for category in library["counts_by_category"]
        }
        catalog["missing"].extend(asset for asset in library["assets"] if asset["status"] == "failed")
    prepared_path = ASSET_ROOT / "prepared/catalog.json"
    if prepared_path.exists():
        prepared = json.loads(prepared_path.read_text())
        catalog.setdefault("collections", [{"name": "starter", "catalog_path": "starter-catalog.json"}]).append(
            {"name": "prepared_pack", "catalog_path": "prepared/catalog.json", "coverage_path": "prepared/validation.json"})
        catalog["asset_count"] += prepared["asset_count"]
        catalog["planned_count"] += prepared["asset_count"]
        counts = Counter(catalog["counts_by_category"])
        counts.update(prepared["counts_by_category"])
        catalog["counts_by_category"] = dict(sorted(counts.items()))
    write_json(ASSET_ROOT / "catalog.json", catalog)
    return catalog


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check files and metadata offline")
    parser.add_argument("--refresh", action="store_true", help="Explicitly re-download selected entries")
    parser.add_argument("--only", action="append", default=[], help="Exact asset ID; repeat as needed")
    parser.add_argument("--dry-run", action="store_true", help="List selected assets without downloading")
    args = parser.parse_args()
    if args.check and args.refresh:
        parser.error("--check and --refresh cannot be combined")
    manifest = json.loads(MANIFEST.read_text())
    all_entries = entries_from_manifest(manifest)
    selected = [e for e in all_entries if not args.only or e["id"] in args.only]
    unknown = set(args.only) - {e["id"] for e in selected}
    if unknown:
        parser.error("Unknown asset IDs: " + ", ".join(sorted(unknown)))
    if args.dry_run:
        for entry in selected:
            print(entry["id"], entry["path"])
        print(f"{len(selected)} assets selected; no network requests made")
        return 0
    failures = []
    counts = Counter()
    for entry in selected:
        try:
            if args.check:
                read_cached(entry)
                status = "checked"
            else:
                _, status = import_one(entry, args.refresh)
            counts[status] += 1
            print(f'{status}: {entry["id"]}', flush=True)
            if status == "downloaded":
                time.sleep(0.8)
        except (ValueError, KeyError, OSError) as error:
            failures.append(entry["id"])
            print(f'FAILED: {entry["id"]}: {error}', file=sys.stderr, flush=True)
    if not args.check:
        catalog = write_catalog(all_entries)
        print(f'Catalog: {catalog["asset_count"]}/{catalog["planned_count"]} assets')
    print(json.dumps({"results": dict(counts), "failed": failures}))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

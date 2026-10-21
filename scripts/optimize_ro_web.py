#!/usr/bin/env python3
"""Select verified lossless WebP/PNG files, rebuild indexes, then remove originals.

No resizing, palette reduction, sound conversion, or image generation. Changed
extensions keep the old PNG until all catalogs and validation checks pass.
"""
from __future__ import annotations

import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import time

from PIL import Image

import import_ro_assets as starter
import build_ro_library as bulk
from index_ro_library import build_indexes

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/ro"
PROFILE = "lossless-webp-exact-rgba-v1"


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_frames(payload):
    with Image.open(BytesIO(payload)) as image:
        frames, durations = [], []
        default_image = bool(image.info.get("default_image", False))
        loop = image.info.get("loop", 0)
        icc = image.info.get("icc_profile")
        for index in range(getattr(image, "n_frames", 1)):
            image.seek(index)
            image.load()
            frames.append(image.convert("RGBA"))
            durations.append(float(image.info.get("duration", 0)))
        return frames, durations, loop, default_image, icc


def verify_equivalent(payload, reference):
    frames, durations, loop, poster, _ = load_frames(payload)
    originals, original_durations, original_loop, original_poster, _ = reference
    if len(frames) != len(originals) or poster != original_poster:
        return False
    if len(frames) > 1 and (durations != original_durations or loop != original_loop):
        return False
    return all(a.size == b.size and a.tobytes() == b.tobytes()
               for a, b in zip(frames, originals))


def candidate_webp(reference):
    frames, durations, loop, poster, icc = reference
    if poster or any(frame.width > 16383 or frame.height > 16383 for frame in frames):
        return None
    output = BytesIO()
    options = dict(format="WEBP", lossless=True, exact=True, quality=100, method=4)
    if icc:
        options["icc_profile"] = icc
    if len(frames) > 1:
        # Fractional delays cannot be represented exactly by WebP's millisecond clock.
        if any(duration != round(duration) or duration <= 0 for duration in durations):
            return None
        options.update(save_all=True, append_images=frames[1:], duration=durations,
                       loop=loop, minimize_size=True, background=(0, 0, 0, 0))
    frames[0].save(output, **options)
    return output.getvalue()


def optimize_one(task):
    base = Path(task["base"])
    meta_path = base / task["row"]["meta_path"]
    try:
        meta = json.loads(meta_path.read_text())
        facts = meta["file"]
        path = base / facts["path"]
        raw = path.read_bytes()
        if sha(raw) != facts["sha256"] or len(raw) != facts["bytes"]:
            raise ValueError("Source checksum/size mismatch")
        prior = meta.get("web_optimization", {})
        if prior.get("profile") == PROFILE and prior.get("output_sha256") == facts["sha256"]:
            return {"id": meta["id"], "operation": "cached", "before": prior["original"]["bytes"],
                    "after": len(raw), "format": facts["format"], "meta_path": str(meta_path)}
        reference = load_frames(raw)
        candidate = candidate_webp(reference)
        decision = "kept_smaller_png"
        chosen, output = raw, path
        if candidate and len(candidate) < len(raw):
            if verify_equivalent(candidate, reference):
                chosen, output = candidate, path.with_suffix(".webp")
                decision = "converted_webp"
            else:
                decision = "kept_png_exact_frame_safety"
        original = {"path": facts["path"], "bytes": len(raw), "sha256": facts["sha256"],
                    "format": facts["format"]}
        if output != path:
            starter.atomic_write(output, chosen)
            # Decode bytes read back from disk, not just the encoder's memory buffer.
            if not verify_equivalent(output.read_bytes(), reference):
                raise ValueError("Persisted output differs from original pixels/timing")
            facts.update(path=output.relative_to(base).as_posix(), bytes=len(chosen), sha256=sha(chosen))
            if meta["schema_version"] == 1:
                facts.update(starter.inspect_image(chosen))
                meta["usage"]["note"] = "Lossless WebP; animation timing is embedded when animated."
            else:
                facts["format"] = "WEBP"
        meta["web_optimization"] = {
            "profile": PROFILE, "optimized_at": now(), "decision": decision,
            "original": original, "output_sha256": sha(chosen),
            "pixel_verification": "exact RGBA for every composited frame",
            "dimensions_preserved": True, "frame_count": len(reference[0]),
            "duration_ms": reference[1], "loop_count": reference[2],
            "original_cleanup_pending": output != path,
        }
        bulk.write_json(meta_path, meta)
        return {"id": meta["id"], "operation": decision, "before": len(raw), "after": len(chosen),
                "format": facts["format"], "meta_path": str(meta_path)}
    except Exception as error:
        return {"id": task["row"]["id"], "operation": "failed", "error": str(error)}


def rebuild_catalogs():
    library = ASSETS / "library"
    catalog = json.loads((library / "catalog.json").read_text())
    rows = []
    for row in catalog["assets"]:
        meta = json.loads((library / row["meta_path"]).read_text())
        rows.append(bulk.summary(meta, "web_optimized" if meta.get("web_optimization") else "retained"))
    catalog.update(generated_at=now(), assets=rows, total_bytes=sum(row["bytes"] for row in rows),
                   operation_counts=dict(Counter(row["operation"] for row in rows)),
                   formats=dict(Counter(row["format"] for row in rows)),
                   web_optimization_profile=PROFILE)
    bulk.write_json(library / "catalog.json", catalog)
    bulk.write_json(library / "coverage.json", {key: value for key, value in catalog.items() if key != "assets"} |
                    {"failed": [row for row in rows if row["status"] == "failed"],
                     "source_dependencies_missing": [row for row in rows if row.get("missing_dependencies")]})
    inventory_path = library / "inventory.json"
    inventory = json.loads(inventory_path.read_text())
    by_id = {row["id"]: row for row in rows}
    for task in inventory["assets"]:
        if task["id"] in by_id:
            task.setdefault("original_export_path", task["path"])
            task["path"] = by_id[task["id"]]["path"]
    bulk.write_json(inventory_path, inventory)
    build_indexes(library)
    manifest = json.loads(starter.MANIFEST.read_text())
    entries = starter.entries_from_manifest(manifest)
    for entry in entries:
        starter.read_cached(entry)
    starter.write_catalog(entries)
    return catalog, entries


def delete_replaced_originals(tasks):
    removed = []
    for task in tasks:
        base = Path(task["base"])
        meta_path = base / task["row"]["meta_path"]
        meta = json.loads(meta_path.read_text())
        optimization = meta["web_optimization"]
        original = optimization["original"]
        if original["path"] == meta["file"]["path"]:
            continue
        current = base / meta["file"]["path"]
        if sha(current.read_bytes()) != optimization["output_sha256"]:
            raise ValueError("Replacement changed before cleanup")
        obsolete = base / original["path"]
        if not obsolete.resolve().is_relative_to(base.resolve()) or obsolete.is_symlink():
            raise ValueError("Unsafe obsolete asset path")
        if obsolete.exists():
            if sha(obsolete.read_bytes()) != original["sha256"]:
                raise ValueError("Original changed before cleanup")
            obsolete.unlink()
            removed.append({"path": str(obsolete.relative_to(ROOT)), "bytes": original["bytes"],
                            "sha256": original["sha256"]})
        optimization["original_cleanup_pending"] = False
        bulk.write_json(meta_path, meta)
    return removed


def delete_source_archives():
    base = ASSETS / "_source_archives"
    removed = []
    for path in sorted(base.rglob("*")):
        if not path.is_file() or path.suffix == ".json":
            continue
        if path.is_symlink() or not path.resolve().is_relative_to(base.resolve()):
            raise ValueError("Unsafe archive path")
        with path.open("rb") as stream:
            checksum = hashlib.file_digest(stream, "sha256").hexdigest()
        size = path.stat().st_size
        path.unlink()
        removed.append({"path": str(path.relative_to(ROOT)), "bytes": size, "sha256": checksum})
    return removed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--delete-originals", action="store_true",
                        help="After full validation, remove replaced PNGs and source ZIP/GRF/System payloads")
    args = parser.parse_args()
    tasks = []
    for base, catalog_path in [(ASSETS / "library", ASSETS / "library/catalog.json"),
                               (ASSETS, ASSETS / "starter-catalog.json")]:
        catalog = json.loads(catalog_path.read_text())
        tasks.extend({"base": str(base), "row": row} for row in catalog["assets"]
                     if row["path"] and Path(row["path"]).suffix.lower() in (".png", ".webp"))
    results = []
    started = time.monotonic()
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        for result in pool.map(optimize_one, tasks, chunksize=8):
            results.append(result)
            if len(results) % 1000 == 0 or len(results) == len(tasks):
                print(f"{len(results)}/{len(tasks)}", dict(Counter(row["operation"] for row in results)),
                      f"{time.monotonic()-started:.0f}s", flush=True)
    failed = [row for row in results if row["operation"] == "failed"]
    report = {"generated_at": now(), "profile": PROFILE, "image_count": len(tasks),
              "before_image_bytes": sum(row.get("before", 0) for row in results),
              "after_image_bytes": sum(row.get("after", 0) for row in results),
              "decisions": dict(Counter(row["operation"] for row in results)),
              "formats": dict(Counter(row.get("format") for row in results)), "failed": failed,
              "cleanup_complete": False}
    report_path = ASSETS / "web-optimization.json"
    bulk.write_json(report_path, report)
    if failed:
        print(json.dumps(failed[:10]), flush=True)
        return 1
    rebuild_catalogs()
    if bulk.check():
        return 1
    if args.delete_originals:
        removed_images = delete_replaced_originals(tasks)
        removed_archives = delete_source_archives()
        cleanup_path = ASSETS / "original-cleanup.json"
        previous = json.loads(cleanup_path.read_text()) if cleanup_path.exists() else {}
        removed = previous.get("removed", []) + removed_images + removed_archives
        bulk.write_json(cleanup_path, {"generated_at": now(), "authorization": "User requested optimization and deletion of originals, 2026-10-18",
                                      "removed": removed, "removed_bytes": sum(row["bytes"] for row in removed)})
        report.update(cleanup_complete=True, removed_image_count=len(removed_images),
                      removed_archive_payload_count=len(removed_archives),
                      removed_bytes_this_run=sum(row["bytes"] for row in removed_images + removed_archives))
        bulk.write_json(report_path, report)
    subprocess.run([sys.executable, str(ROOT / "scripts/import_ro_assets.py"), "--check"], check=True)
    print(json.dumps(report, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

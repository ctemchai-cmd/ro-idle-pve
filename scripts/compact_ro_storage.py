#!/usr/bin/env python3
"""Compact JSON and share byte-identical native media while retaining every asset ID."""
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
import time

import build_ro_library as bulk
from optimize_ro_web import rebuild_catalogs

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
LIBRARY = ASSETS / "ro/library"


def totals(root):
    result = {"file_count": 0, "logical_bytes": 0, "allocated_bytes": 0}
    for path in root.rglob("*"):
        if path.is_file():
            stat = path.stat()
            result["file_count"] += 1
            result["logical_bytes"] += stat.st_size
            result["allocated_bytes"] += stat.st_blocks * 512
    return result


def plan_duplicates(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[(row["sha256"], row["bytes"], row["format"])].append(row)
    plan = []
    for (checksum, size, _), group in groups.items():
        paths = {row["path"] for row in group}
        if len(paths) < 2:
            continue
        canonical = min(group, key=lambda row: (row["path"], row["id"]))
        payload = (LIBRARY / canonical["path"]).read_bytes()
        if len(payload) != size or hashlib.sha256(payload).hexdigest() != checksum:
            raise ValueError("Canonical media checksum mismatch: " + canonical["id"])
        for row in group:
            if row["path"] == canonical["path"]:
                continue
            if (LIBRARY / row["path"]).read_bytes() != payload:
                raise ValueError("Duplicate media differs: " + row["id"])
            plan.append({"id": row["id"], "meta_path": row["meta_path"], "old_path": row["path"],
                         "canonical_path": canonical["path"], "canonical_id": canonical["id"],
                         "sha256": checksum, "bytes": size})
    return plan


def compact_one(task):
    path, replacement = task
    try:
        raw = path.read_bytes()
        value = json.loads(raw)
        if replacement:
            if value["id"] != replacement["id"] or value["file"]["path"] != replacement["old_path"]:
                raise ValueError("Metadata changed after duplicate planning")
            value["file"]["path"] = replacement["canonical_path"]
            value["shared_media"] = {"previous_path": replacement["old_path"],
                                     "canonical_asset_id": replacement["canonical_id"],
                                     "verification": "SHA-256, size, and complete byte equality"}
        # Keep the small hand-edited starter files readable in the editor.
        pretty = not path.is_relative_to(LIBRARY) and len(raw) < 16384
        encoded = (json.dumps(value, ensure_ascii=False, indent=2 if pretty else None,
                              separators=None if pretty else (",", ":"), allow_nan=False) + "\n").encode()
        if json.loads(encoded) != value:
            raise ValueError("JSON roundtrip changed content")
        if replacement or len(encoded) < len(raw):
            bulk.write_bytes(path, encoded)
        return {"before": len(raw), "after": path.stat().st_size}
    except Exception as error:
        return {"path": str(path), "error": str(error)}


def remove_duplicates(plan):
    catalog = json.loads((LIBRARY / "catalog.json").read_text())
    live = {row["path"] for row in catalog["assets"]}
    seen, removed = set(), []
    for row in plan:
        old = row["old_path"]
        if old in seen:
            continue
        seen.add(old)
        if old in live:
            raise ValueError("Refusing to remove media still referenced by the catalog")
        target = LIBRARY / row["canonical_path"]
        obsolete = LIBRARY / old
        if not obsolete.resolve().is_relative_to(LIBRARY.resolve()) or obsolete.is_symlink():
            raise ValueError("Unsafe duplicate path")
        expected = row["sha256"]
        if hashlib.sha256(target.read_bytes()).hexdigest() != expected:
            raise ValueError("Canonical media changed before cleanup")
        if obsolete.exists():
            if hashlib.sha256(obsolete.read_bytes()).hexdigest() != expected:
                raise ValueError("Duplicate media changed before cleanup")
            obsolete.unlink()
            removed.append(old)
    return removed


def main():
    report_path = ASSETS / "ro/storage-optimization.json"
    plan_path = ASSETS / "ro/storage-cleanup-plan.json"
    started = time.monotonic()
    before = totals(ASSETS)
    catalog = json.loads((LIBRARY / "catalog.json").read_text())
    plan = plan_duplicates(catalog["assets"])
    bulk.write_json(plan_path, {"generated_at": bulk.now(), "replacements": plan})
    print("Plan:", len(plan), "duplicate references; before", before, flush=True)
    updates = {LIBRARY / row["meta_path"]: row for row in plan}
    tasks = [(path, updates.get(path)) for path in ASSETS.rglob("*.json")]
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for index, result in enumerate(pool.map(compact_one, tasks), 1):
            results.append(result)
            if index % 10000 == 0 or index == len(tasks):
                print("JSON:", index, "/", len(tasks), round(time.monotonic()-started), "seconds", flush=True)
    failed = [row for row in results if "error" in row]
    if failed:
        bulk.write_json(report_path, {"failed": failed, "cleanup_complete": False})
        return 1
    rebuild_catalogs()
    if bulk.check():
        return 1
    removed = remove_duplicates(plan)
    # These statistics distinguish physical media from per-asset referenced byte totals.
    catalog = json.loads((LIBRARY / "catalog.json").read_text())
    paths = {row["path"] for row in catalog["assets"]}
    catalog["storage"] = {"unique_media_count": len(paths),
                           "unique_media_bytes": sum((LIBRARY / path).stat().st_size for path in paths),
                           "report_path": "../storage-optimization.json"}
    bulk.write_json(LIBRARY / "catalog.json", catalog)
    report = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
              "before": before, "json_before_bytes": sum(row["before"] for row in results),
              "json_after_bytes": sum(row["after"] for row in results),
              "asset_count": catalog["asset_count"], "unique_native_media_count": len(paths),
              "removed_duplicate_file_count": len(removed),
              "failed": [], "cleanup_complete": True}
    report["after"] = totals(ASSETS)
    bulk.write_json(report_path, report)
    print(json.dumps(report), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

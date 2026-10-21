#!/usr/bin/env python3
"""Build searchable category indexes using JSON metadata only, never images."""
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / "assets/ro/library"


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".part")
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n")
    temporary.replace(path)


def build_indexes(library=LIBRARY):
    catalog = json.loads((library / "catalog.json").read_text())
    source = ROOT / "assets/ro/inventory/source"
    constants = {name.lower(): int(ident) for name, ident in
                 re.findall(r"\b([A-Z][A-Z0-9_]*)\s*:\s*(\d+)", (source / "skill-constants.js").read_text())}
    skills = {row["id"]: row for row in json.loads((source / "skills.json").read_text())}
    indexes = defaultdict(list)
    bodies = defaultdict(list)
    skill_ids = set()
    for row in catalog["assets"]:
        if row["status"] == "failed":
            continue
        meta_path = library / row["meta_path"]
        meta = json.loads(meta_path.read_text())
        basename = meta["source"]["path"].rsplit("\\", 1)[-1].rsplit(".", 1)[0]
        # Enrich cached SPR skill icons without decoding/re-exporting their PNGs.
        if meta["kind"] == "skill_sprite_icon" and basename in constants and not meta["game"].get("skill"):
            ident = constants[basename]
            meta["game"]["skill"] = {"id": ident, "constant": basename.upper(),
                                       "name": skills.get(ident, {}).get("name")}
            save(meta_path, meta)
        skill = meta.get("game", {}).get("skill")
        if skill:
            skill_ids.add(skill["id"])
        enriched = {**row, "tags": meta.get("tags", []), "skill": skill,
                    "item_ids": [item["id"] for item in meta.get("game", {}).get("item_references", [])],
                    "facings": list(meta.get("animation", {}).get("facing_variants", {}))}
        indexes[row["category"]].append(enriched)
        if row["kind"] == "body_atlas":
            stem = basename.removesuffix("_남").removesuffix("_여")
            bodies[stem].append({"id": row["id"], "path": row["path"], "meta_path": row["meta_path"],
                                 "source_path": row["source_path"]})
    for category, rows in indexes.items():
        save(library / "indexes" / (category + ".json"), {
            "schema_version": 2, "path_base": "assets/ro/library/", "category": category,
            "asset_count": len(rows), "counts_by_kind": dict(Counter(row["kind"] for row in rows)),
            "assets": rows})
    classes = json.loads((source / "classes.json").read_text())
    class_rows = [{"id": row["id"], "name": row["name"], "constant": row.get("jt"),
                   "sprite": row["sprite"], "body_assets": bodies.get(row["sprite"].lower(), []),
                   "available": bool(bodies.get(row["sprite"].lower()))} for row in classes]
    save(library / "class-coverage.json", {"reference_count": len(classes),
         "available_count": sum(row["available"] for row in class_rows),
         "basis": "Every class sprite basename in the public class catalog was checked against native client body SPR files.",
         "classes": class_rows})
    save(library / "skill-coverage.json", {"source_client": "kRO 2024-06-10", "reference_skill_count": len(skills),
         "distinct_exported_skill_ids": len(skill_ids),
         "note": "The external reference includes other client versions, NPC skills and follow-up IDs; icon absence does not imply an export failure.",
         "reference_ids_without_native_icon": [{"id": ident, "name": row["name"], "parent": row.get("parent")}
                                                for ident, row in skills.items() if ident not in skill_ids]})
    lines = ["category\tkind\tname\tskill_id\tskill_constant\tmetadata\tsource"]
    for rows in indexes.values():
        for row in rows:
            skill = row.get("skill") or {}
            values = [row["category"], row["kind"], row["name"], skill.get("id", ""),
                      skill.get("constant", ""), row["meta_path"], row["source_path"]]
            lines.append("\t".join(str(value).replace("\t", " ").replace("\n", " ") for value in values))
    (library / "search.tsv").write_text("\n".join(lines) + "\n")
    summary = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
               "category_indexes": {key: "indexes/" + key + ".json" for key in sorted(indexes)},
               "class_coverage": {"available": sum(row["available"] for row in class_rows), "reference": len(classes)},
               "distinct_exported_skill_ids": len(skill_ids), "indexed_files": sum(map(len, indexes.values()))}
    save(library / "index-summary.json", summary)
    from build_ro_skill_index import build_skill_index
    build_skill_index(library)
    print(json.dumps(summary, ensure_ascii=False))
    return summary


if __name__ == "__main__":
    build_indexes()

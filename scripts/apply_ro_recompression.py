"""Apply measured static lossless WebP candidates; verify pixels before every write.

The candidate plan is operator-generated, never a product input. The committed audit
contains relative source paths and pixel hashes, not temporary encoder paths.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image
import optimize_ro_web as optimizer
import prepare_ro_pack as prepared

ROOT = Path(__file__).resolve().parents[1]
RO = ROOT / 'assets/ro'
digest = lambda value: hashlib.sha256(value).hexdigest()

def stable_metadata(meta):
    value = json.loads(json.dumps(meta))
    for key in ('bytes', 'sha256'): value['file'].pop(key, None)
    for key in ('output_sha256', 'compression_method'): value.get('web_optimization', {}).pop(key, None)
    return digest(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode())

def apply(plan_path, report_path, target):
    rows = sorted((r for r in json.loads(plan_path.read_text()) if r['saved'] > 0), key=lambda r: -r['saved'])
    chosen, saved = [], 0
    for row in rows:
        chosen.append(row); saved += row['saved']
        if saved >= target: break
    if saved < target: raise ValueError('Measured candidates do not meet the requested saving')
    changes = {}
    for row in chosen:
        ref = Path(row['path'])
        if ref.is_absolute() or '..' in ref.parts or ref.suffix != '.webp': raise ValueError('Unsafe source path')
        source, encoded = RO / ref, Path(row['encoded'])
        raw, payload = source.read_bytes(), encoded.read_bytes()
        if digest(raw) != row['before_sha'] or len(raw) != row['old'] or len(payload) != row['new']: raise ValueError('Candidate/source changed')
        a, b = Image.open(source), Image.open(encoded)
        if getattr(a, 'n_frames', 1) != 1 or getattr(b, 'n_frames', 1) != 1 or a.size != b.size: raise ValueError('Static dimensions changed')
        if a.convert('RGBA').tobytes() != b.convert('RGBA').tobytes(): raise ValueError('RGBA pixels changed')
        rgba = digest(a.convert('RGBA').tobytes())
        if rgba != row['rgba_sha']: raise ValueError('Pixel baseline changed')
        changes[ref.as_posix()] = {**row, 'after_sha': digest(payload), 'dimensions': list(a.size), 'metadata': []}
    edits = []
    for path in RO.rglob('*.meta.json'):
        meta = json.loads(path.read_text()); file = meta.get('file', {}); base = 'library/' if path.is_relative_to(RO / 'library') else 'prepared/' if path.is_relative_to(RO / 'prepared') else ''
        ref = base + file.get('path', '')
        if ref not in changes: continue
        row = changes[ref]
        if file['sha256'] != row['before_sha'] or file['bytes'] != row['old']: raise ValueError('Shared sidecar baseline mismatch: ' + str(path))
        stable = stable_metadata(meta)
        file.update(bytes=row['new'], sha256=row['after_sha'])
        if 'web_optimization' in meta: meta['web_optimization'].update(output_sha256=row['after_sha'], compression_method=6)
        if stable_metadata(meta) != stable: raise ValueError('Unrelated metadata changed')
        row['metadata'].append({'path': path.relative_to(ROOT).as_posix(), 'unchanged_metadata_sha': stable})
        edits.append((path, meta, bool(base)))
    if any(not r['metadata'] for r in changes.values()): raise ValueError('Source without sidecar')
    # Validate the complete plan before mutating shared media or any sidecar.
    for ref, row in changes.items(): (RO / ref).write_bytes(Path(row['encoded']).read_bytes())
    for path, meta, compact in edits:
        path.write_text(json.dumps(meta, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2})) + ('' if compact else '\n'))
    prepared.rebuild(); optimizer.rebuild_catalogs()
    audit = {'profile': 'static-lossless-webp-exact-rgba-method6-q100', 'saved_media_bytes': saved, 'media_count': len(changes), 'all_RGBA_identical': True,
             'entries': [{k: v for k, v in row.items() if k not in ('encoded', 'rgba_equal')} for row in changes.values()]}
    report_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'saved': saved, 'media': len(changes), 'sidecars': len(edits), 'pixels_unchanged': True}))

def verify(path):
    audit = json.loads(path.read_text())
    for row in audit['entries']:
        media = RO / row['path']; image = Image.open(media)
        assert digest(media.read_bytes()) == row['after_sha'] and len(media.read_bytes()) == row['new']
        assert digest(image.convert('RGBA').tobytes()) == row['rgba_sha'] and list(image.size) == row['dimensions']
        for entry in row['metadata']: assert stable_metadata(json.loads((ROOT / entry['path']).read_text())) == entry['unchanged_metadata_sha']
    print(json.dumps({'verified': len(audit['entries']), 'pixels_and_unrelated_metadata_unchanged': True}))

if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('--plan', type=Path); p.add_argument('--report', type=Path, required=True); p.add_argument('--target-bytes', type=int, default=220000); p.add_argument('--verify', action='store_true'); args = p.parse_args()
    if args.verify: verify(args.report)
    else:
        if not args.plan: p.error('--plan is required when applying measured candidates')
        apply(args.plan, args.report, args.target_bytes)

#!/usr/bin/env python3
"""ACT contact sheet: every frame of chosen actions for body + head + weapon, using the same layer transform rules as
src/renderer/native.mjs drawParts (attachments share the body frame clock; a short overlay holds its last pose).
A red box marks frames with an ACT sound event. Used for TASK-054 to pick attack actions and the bow release frame —
render the weapon alone (--weapon-only) to see the bow string clearly.

  python3 scripts/act_contact_sheet.py --jobs archer,hunter --actions preset --out .local/sheets/bows.png
  python3 scripts/act_contact_sheet.py --jobs monk --actions 46,86,94 --out .local/sheets/monk.png
"""
import json, sys, math
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]; RO = ROOT / 'assets/ro'
def load(meta):
  m = json.load(open(RO / meta)); img = Image.open(RO / 'library' / m['file']['path'] if not (RO / m['file']['path']).exists() else RO / m['file']['path']).convert('RGBA'); return m, img
def action(m, idx):
  return next((a for a in m['animation']['actions'] if a['source_action_index'] == idx), None)
def draw_frame(canvas, asset, frame, origin, offset=(0, 0), s=2):
  m, img = asset
  for L in frame['layers']:
    r = m['sprite_sheet']['frames'][L[2]]; part = img.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))
    sx = (-1 if L[3] else 1) * (L[8] if len(L) > 4 else 1); sy = L[9] if len(L) > 4 else 1
    w, h = max(1, int(abs(sx) * r[2] * s)), max(1, int(abs(sy) * r[3] * s)); part = part.resize((w, h), Image.NEAREST)
    if sx < 0: part = part.transpose(Image.FLIP_LEFT_RIGHT)
    rot = float(L[10]) if len(L) > 10 else 0
    if rot: part = part.rotate(-rot, expand=True, resample=Image.NEAREST)
    if len(L) > 4 and L[7] < 255:
      a = part.split()[3].point(lambda v: v * L[7] // 255); part.putalpha(a)
    cx = origin[0] + (L[0] + offset[0]) * s; cy = origin[1] + (L[1] + offset[1]) * s
    canvas.alpha_composite(part, (int(cx - part.width / 2), int(cy - part.height / 2)))
def sheet(rows, out, cell=(120, 140), weapon_only=False):
  """rows: (label, body_meta, head_meta, weapon_meta, action_index). The body action sets the frame clock."""
  if weapon_only: cell = (200, 300)
  cols = max(len(action(load(b)[0], i)['frames']) for _, b, _, _, i in rows)
  W, H = cell; scale = 3 if weapon_only else 2
  canvas = Image.new('RGBA', (cols * W + 150, len(rows) * H), (40, 40, 40, 255) if weapon_only else (235, 235, 235, 255)); d = ImageDraw.Draw(canvas)
  ink = (255, 255, 255, 255) if weapon_only else (0, 0, 0, 255)
  for ri, (label, b, h, w, idx) in enumerate(rows):
    body = load(b); head = load(h) if h and not weapon_only else None; weap = load(w) if w else None
    ba = action(body[0], idx); d.text((4, ri * H + 4), f'{label} {idx}', fill=ink)
    for fi, f in enumerate(ba['frames']):
      o = (150 + fi * W + W // 2, ri * H + int(H * 0.75))
      if f.get('event') is not None: d.rectangle((150 + fi * W, ri * H, 150 + fi * W + W - 1, ri * H + H - 1), outline=(220, 0, 0, 255), width=2)
      d.text((150 + fi * W + 3, ri * H + 3), f'f{fi}', fill=ink)
      if not weapon_only: draw_frame(canvas, body, f, o, s=scale)
      for att, anchor in ((head, True), (weap, False)):
        if not att: continue
        aa = action(att[0], idx)
        if not aa or not aa['frames']: continue
        af = aa['frames'][min(fi, len(aa['frames']) - 1)]
        base = f.get('anchor') or [0, 0]; own = af.get('anchor') or base
        draw_frame(canvas, att, af, o, (base[0] - own[0], base[1] - own[1]) if anchor else (0, 0), s=scale)
  canvas.save(out)
def main():
  import argparse
  ap = argparse.ArgumentParser(); ap.add_argument('--jobs', required=True); ap.add_argument('--actions', default='preset', help="'preset' or comma list of ACT source_action_index")
  ap.add_argument('--gender', default='all', choices=['all', 'male', 'female']); ap.add_argument('--weapon-only', action='store_true'); ap.add_argument('--out', required=True); a = ap.parse_args()
  data = json.load(open(ROOT / 'plan/data/actor-presentations.json')); rows = []
  for job in data['jobs']:
    if job['job_id'] not in a.jobs.split(','): continue
    for p in job['presets']:
      if a.gender != 'all' and p['gender'] != a.gender: continue
      actions = [p['attack_source_action_index']] if a.actions == 'preset' else [int(x) for x in a.actions.split(',')]
      for i in actions:
        rows.append((f"{job['job_id']}-{p['gender'][0]}", p['body']['meta'], p.get('head', {}).get('meta'), p.get('weapon', {}).get('meta'), i))
  Path(a.out).parent.mkdir(parents=True, exist_ok=True); sheet(rows, a.out, weapon_only=a.weapon_only); print(a.out)
if __name__ == '__main__':
  main()

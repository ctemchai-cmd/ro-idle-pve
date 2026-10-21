#!/usr/bin/env python3
"""Generate plan/data/stages.json from authored spec + formulas (TASK-011 baseline, D-057 stage counts).

Usage:
  python3 plan/generators/stages.py --legacy --check   # prove the 8x10 formulas reproduce the reviewed file
  python3 plan/generators/stages.py --write            # write the current D-057 layout
  python3 plan/generators/stages.py --check            # verify the committed file matches the D-057 layout

Formulas (c chapter, i index, N stages in that chapter; Python round = half-to-even):
  level L = 8c - 4 + floor(6i/N)            (N=10 gives the original floor(3i/5))
  boss HP = round(round(160 * 1.68^(c-1) * (7 + 10i/N)) * (1.35 if i == N else 1))
  boss ATK = round(8 + 2.4L), DEF = 6L + 8; adds HP = round(bossHP/4), ATK = round(bossATK*0.6), DEF = boss DEF
  first clear = gold 250c^2, hero_exp 400c^2, skill_manual 10c, crystal 20, each scaled by 10/N so chapter totals stay fixed
TASK-041 (D-065): the D-057 layout then multiplies boss/adds HP and ATK by the measured per-stage factors in
stages-spec.json `calibration` (written by `scripts/game/balance.ts calibrate`; legacy mode ignores them).
D-066 (user, 20 Oct 2026): a Story boss fight lasts 40 s, not 90 s; target bands become 1-1 1–6 s, chapters 1–2 4–25 s, 3–8 12–35 s.
D-067 (user, 20 Oct 2026): bosses of stages 5, 10 and 15 add the interruptible heavy cast `enemy_cataclysm`; its strength is the
boss magical attack, calibrated separately (`matk`) so a team that brings stun/freeze/silence/interrupt wins and one that does not fails.
"""
import argparse, json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = Path(__file__).with_name('stages-spec.json')
OUT = ROOT / 'plan/data/stages.json'
# D-057: chapters 1-3 keep 10 stages, 4-8 have 20; future chapters (9+) are planned at 50.
LAYOUT = {1: 10, 2: 10, 3: 10, 4: 20, 5: 20, 6: 20, 7: 20, 8: 20}
FUTURE_STAGES_PER_CHAPTER = 50
LEGACY = {c: 10 for c in range(1, 9)}
TIME_LIMIT_MS = 40000  # D-066; the legacy 8x10 baseline keeps its reviewed 90000

def base(level, hp, atk, df):
    return {'str': 1, 'agi': 1, 'vit': 1, 'int': 1, 'dex': 1, 'luk': 1, 'physical_attack': atk, 'magical_attack': atk, 'max_hp': hp, 'max_sp': 100,
            'physical_defense': df, 'magical_defense': df, 'attack_speed': 100, 'cast_speed': 100}

HEAVY_CAST_INDICES = (5, 10, 15)
# D-074 (user, 21 Oct 2026): three heavy casts with the same 4 s interruptible timing, calibrated as Cataclysm equivalents
# (same cast_share/matk row; the skill's own ratio spreads it: all members ×1, the weakest ×2.5, two random ×1.6).
# Chapter 1 always teaches with Cataclysm; later stages rotate so each chapter mixes them.
HEAVY_CASTS = ('enemy_cataclysm', 'enemy_doom', 'enemy_twin_hex')
def heavy_skill(c, i):
    return HEAVY_CASTS[0] if c == 1 else HEAVY_CASTS[(c - 1 + i // 5 - 1) % len(HEAVY_CASTS)]

def calibrated(boss_hp, boss_atk, sid, spec, layout):
    factor = {} if layout is LEGACY else spec.get('calibration', {}).get(sid, {})
    return round(boss_hp * factor.get('hp', 1)), round(boss_atk * factor.get('atk', 1))

def magic(boss_atk, sid, spec, layout):
    factor = {} if layout is LEGACY else spec.get('calibration', {}).get(sid, {})
    return round(boss_atk * factor.get('matk', factor.get('atk', 1)))

def stages(layout, spec):
    rows, previous = [], None
    for c in sorted(layout):
        n, chapter = layout[c], spec['chapters'][str(c)]
        for i in range(1, n + 1):
            sid = f'{c}-{i}'
            if sid == '1-1':
                row = json.loads(json.dumps(spec['stage_1_1']))
                if layout is not LEGACY: row['time_limit_ms'] = TIME_LIMIT_MS
                if layout is not LEGACY and sid in spec.get('calibration', {}):
                    for actor in row['encounter']:
                        b = actor['resolved_base']; b['max_hp'], b['physical_attack'] = calibrated(b['max_hp'], b['physical_attack'], sid, spec, layout); b['magical_attack'] = b['physical_attack']
                rows.append(row); previous = sid; continue
            final = i == n
            level = 8 * c - 4 + math.floor(6 * i / n)
            hp = round(round(160 * 1.68 ** (c - 1) * (7 + 10 * i / n)) * (1.35 if final else 1))
            base_atk, df = round(8 + 2.4 * level), 6 * level + 8
            hp, atk = calibrated(hp, base_atk, sid, spec, layout); matk = magic(base_atk, sid, spec, layout)
            boss_spec = spec['final_bosses'][str(c)] if final else None
            slots = list(boss_spec['active_slots']) if final else ['enemy_bite', None, None, None]
            if layout is not LEGACY and i in HEAVY_CAST_INDICES and not any(x in HEAVY_CASTS for x in slots):
                kept = [x for x in slots if x is not None][:3]; slots = [heavy_skill(c, i)] + kept + [None] * (3 - len(kept))  # first cast starts after one skill interval
            resolved = base(level, hp, atk, df)
            if layout is not LEGACY: resolved['magical_attack'] = matk
            boss = {'actor_id': 'enemy_front', 'definition_id': boss_spec['definition_id'] if final else spec['regular_boss_by_chapter'][str(c)], 'level': level, 'position': 'front_1',
                    'element': boss_spec['element'] if final else 'neutral', 'resolved_base': resolved,
                    'active_slots': slots, 'passives': boss_spec['passives'] if final else []}
            adds = spec['adds'][:1] if sid == '1-2' else spec['adds']
            encounter = [boss] + [{'actor_id': a['actor_id'], 'definition_id': a['definition_id'], 'level': level, 'position': a['position'], 'element': a['element'],
                                   'resolved_base': base(level, round(hp / 4), round(atk * 0.6), df), 'active_slots': a['active_slots'], 'passives': a['passives']} for a in adds]
            scale = 10 / n
            target = dict(spec['balance_target'])
            target['first_clear_seconds'] = ([5, 35] if c <= 2 else [20, 85]) if layout is LEGACY else ([4, 25] if c <= 2 else [12, 35])
            mechanic = boss_spec['mechanic'] if final else ['basic pressure']
            solutions = boss_spec['solutions'] if final else []
            if layout is not LEGACY and i in HEAVY_CAST_INDICES:
                mechanic = list(mechanic) + [f'interruptible heavy cast ({heavy_skill(c, i)})']
                examples = ['swordsman_bash', 'mage_cold_bolt', 'merchant_cart_revolution'] + (['acolyte_holy_light', 'archer_arrow_shower', 'thief_sand_attack'] if level >= 5 else []) + (['sage_spell_breaker', 'blacksmith_hammer_fall'] if level >= 20 else [])
                solutions = list(solutions) + [{'strategy': 'interrupt the heavy cast with stun, freeze, silence or interrupt', 'example_skill_ids': examples, 'examples_are_mandatory': False}]
            rows.append({'id': sid, 'chapter': c, 'index': i, 'unlock_after': previous, 'recommended_party_level': level, 'time_limit_ms': 90000 if layout is LEGACY else TIME_LIMIT_MS, 'encounter': encounter,
                         'background': chapter['background'], 'music': chapter['music'],
                         'first_clear_reward': {'gold': round(250 * c * c * scale), 'hero_exp': round(400 * c * c * scale), 'skill_manual': round(10 * c * scale), 'crystal': round(20 * scale)},
                         'repeat_clear_reward': {}, 'farm_rate_chapter': c, 'mechanic': mechanic,
                         'solutions': solutions, 'balance_target': target})
            previous = sid
    return rows

def document(layout, spec):
    top = spec['top']
    counts = {} if layout is LEGACY else {'stages_per_chapter_by_chapter': {str(c): n for c, n in layout.items()}, 'future_stages_per_chapter': FUTURE_STAGES_PER_CHAPTER}
    doc = {'schema_version': top['schema_version'], 'content_version': top['content_version'] if layout is LEGACY else 'story-v2', 'chapters': len(layout),
           'stages_per_chapter': 10 if layout is LEGACY else None, **counts, 'total_stages': sum(layout.values()), 'stages': stages(layout, spec)}
    if layout is not LEGACY: del doc['stages_per_chapter']
    for key, value in top.items():
        if key not in ('schema_version', 'content_version'): doc[key] = value
    if layout is not LEGACY: doc['rules'] = {**top['rules'], 'lose': f'all four party members dead or {TIME_LIMIT_MS}ms timeout (D-066); main death alone does not lose'}
    return doc

def encoded(doc): return json.dumps(doc, indent=2, ensure_ascii=False) + '\n'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--legacy', action='store_true'); parser.add_argument('--check', action='store_true'); parser.add_argument('--write', action='store_true')
    args = parser.parse_args(); spec = json.loads(SPEC.read_text())
    text = encoded(document(LEGACY if args.legacy else LAYOUT, spec))
    if args.write: OUT.write_text(text)
    if args.check:
        current = OUT.read_text() if not args.legacy else (ROOT / 'plan/generators/stages-legacy-sha256.txt').read_text().strip()
        import hashlib
        ok = (hashlib.sha256(text.encode()).hexdigest() == current) if args.legacy else (text == current)
        print(json.dumps({'layout': 'legacy-8x10' if args.legacy else 'd057', 'stages': text.count('"unlock_after"'), 'matches': ok})); raise SystemExit(0 if ok else 1)
    print(json.dumps({'written': args.write, 'stages': text.count('"unlock_after"')}))

if __name__ == '__main__':
    main()

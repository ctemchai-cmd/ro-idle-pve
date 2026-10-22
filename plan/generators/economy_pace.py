#!/usr/bin/env python3
"""D-069 (user, 20 Oct 2026): "about 2–3 weeks until maxed, waiting for Hi-class" — farm rates from a pace target.

The M0 rates let the whole Story finish in ~16 farm hours. D-069 sets the continuous farm hours needed to finish each
chapter (a player who claims AFK at least twice a day farms ~24 h/day):
  ch1 3 · ch2 9 · ch3 18 · ch4 30 · ch5 40 · ch6 45 · ch7 47 · ch8 48  → Story end ≈ 240 h (≈10 days),
then roughly another week of Refine/Enchant/cards before the Lv.70 cap is "maxed" (≈ 2.5 weeks).
Each resource is paced by its own sinks for the expected player at every chapter end (four members of the reference
team at the chapter's last recommended level + 1): level costs (EXP + gold), Breakthroughs reached (essence + gold),
build skills at the level cap (manuals + gold), average Refine/Enchant per slot (ore/dust + gold, Refine at its
chance-and-pity expected cost). Rate(c) = (sink(c) − sink(c−1) − first-clear income(c)) / hours(c) × bias; daily/Tower
rewards are left on top as the "player who does everything" bonus. scripts/game/journey.ts measures the result.

Usage:  python3 plan/generators/economy_pace.py --write | --check
"""
import argparse, json, math, copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]; D = ROOT / 'plan/data'
CHAPTER_HOURS = [3, 9, 18, 30, 40, 45, 47, 48]
REFINE_TARGET = [0, 1, 3, 3, 5, 5, 6, 7]   # average Refine per worn slot at chapter end
ENCHANT_TARGET = [0, 0, 1, 2, 3, 4, 4, 5]  # average Enchant per worn slot at chapter end
REFERENCE_BUILDS = {'mage': 'wizard_artillery', 'swordsman': 'crusader_guardian', 'acolyte': 'priest_healer', 'archer': 'hunter_sniper'}
# Journey-tuned multipliers on top of the EXP-proportional scaling (1 = keep the M0 ratio to EXP).
GOLD_INCOME_MULTIPLIER = 3  # D-118: shared gold funds many sinks; material/EXP pacing stays unchanged.
RESOURCE_BIAS = {'gold': 1.0, 'hero_exp': 1.0, 'skill_manual': 1.0, 'refine_ore': 1.0, 'breakthrough_essence': 1.0, 'enchant_dust': 1.0}
M0_RATES = [
  {'chapter': 1, 'per_hour': {'gold': 3600, 'hero_exp': 9000, 'skill_manual': 120, 'refine_ore': 12, 'breakthrough_essence': 6, 'enchant_dust': 0}},
  {'chapter': 2, 'per_hour': {'gold': 12000, 'hero_exp': 36000, 'skill_manual': 240, 'refine_ore': 30, 'breakthrough_essence': 18, 'enchant_dust': 6}},
  {'chapter': 3, 'per_hour': {'gold': 24000, 'hero_exp': 72000, 'skill_manual': 360, 'refine_ore': 48, 'breakthrough_essence': 30, 'enchant_dust': 18}},
  {'chapter': 4, 'per_hour': {'gold': 42000, 'hero_exp': 132000, 'skill_manual': 600, 'refine_ore': 78, 'breakthrough_essence': 48, 'enchant_dust': 30}},
  {'chapter': 5, 'per_hour': {'gold': 72000, 'hero_exp': 240000, 'skill_manual': 840, 'refine_ore': 120, 'breakthrough_essence': 72, 'enchant_dust': 48}},
  {'chapter': 6, 'per_hour': {'gold': 120000, 'hero_exp': 420000, 'skill_manual': 1200, 'refine_ore': 180, 'breakthrough_essence': 120, 'enchant_dust': 72}},
  {'chapter': 7, 'per_hour': {'gold': 192000, 'hero_exp': 660000, 'skill_manual': 1680, 'refine_ore': 240, 'breakthrough_essence': 180, 'enchant_dust': 108}},
  {'chapter': 8, 'per_hour': {'gold': 300000, 'hero_exp': 1020000, 'skill_manual': 2400, 'refine_ore': 360, 'breakthrough_essence': 240, 'enchant_dust': 150}},
]

def expected_refine(slot_progress):
  """Expected (gold, ore) to go 0→n per slot with D-057 chance and +10 % pity per failure (failure keeps the level)."""
  r = slot_progress['refine']; rows = {row['to']: row for row in r['upgrade_rows']}; out = [(0.0, 0.0)]
  for target in range(1, r['max'] + 1):
    chance, bonus = r['success_chance_by_target'][str(target)], r['pity']['bonus_per_failure']; attempts, p_reach, k = 0.0, 1.0, 0
    while p_reach > 1e-9:
      p = min(r['pity']['cap'], chance + bonus * k); attempts += p_reach; p_reach *= (1 - p); k += 1
    g, o = out[-1]; out.append((g + attempts * rows[target]['gold'], o + attempts * rows[target]['refine_ore']))
  return out
def sinks(level, refine, enchant, progression, slot_progress, skills_by_root):
  rows = {r['level']: r for r in progression['progression']['level_rows']}; total = {'gold': 0.0, 'hero_exp': 0.0, 'skill_manual': 0.0, 'refine_ore': 0.0, 'breakthrough_essence': 0.0, 'enchant_dust': 0.0}
  reach = rows[level]['leveling_cost_to_reach']; ref = expected_refine(slot_progress)
  ench_rows = slot_progress['enchant']['upgrade_rows']; ench_gold = sum(r['gold'] for r in ench_rows if r['to'] <= enchant); ench_dust = sum(r['enchant_dust'] for r in ench_rows if r['to'] <= enchant)
  for root, build_id in REFERENCE_BUILDS.items():
    total['hero_exp'] += reach.get('hero_exp', 0); total['gold'] += reach.get('gold', 0)
    for gate in progression['progression']['breakthrough_gates']:
      if level > gate['at_level']: total['gold'] += gate['cost'].get('gold', 0); total['breakthrough_essence'] += gate['cost'].get('breakthrough_essence', 0)
    doc = skills_by_root[root]; build = next(b for b in doc['builds'] if b['id'] == build_id); job_ok = lambda cls: cls == root or level >= 20
    for sid, target in build['skill_levels'].items():
      skill = next(x for x in doc['skills'] if x['id'] == sid)
      if skill['unlock_level'] > level or not job_ok(skill['class_id']): continue
      cap = min(target, skill['max_level'], 1 + (level - 1) // 5)
      for row in doc['upgrades'][sid]['upgrade_cost_rows']:
        if row['to_level'] <= cap: total['gold'] += row['gold']; total['skill_manual'] += row['skill_manual']
    total['gold'] += 6 * (ref[refine][0] + ench_gold); total['refine_ore'] += 6 * ref[refine][1]; total['enchant_dust'] += 6 * ench_dust
  return total
LOOKAHEAD = {'breakthrough_essence'}  # a Breakthrough is paid at its gate, so its essence is earned during the chapter before
def rates(progression, stages, slot_progress, skills_by_root):
  out, previous, factors, plan, income, prior = [], None, [], [], {}, {}
  level_at = lambda c: min(70, max((s for s in stages if s['chapter'] == c), key=lambda s: s['index'])['recommended_party_level'] + 1)
  for c in range(1, 9):
    level = level_at(c); need = sinks(level, REFINE_TARGET[c - 1], ENCHANT_TARGET[c - 1], progression, slot_progress, skills_by_root)
    if c < 8:
      ahead = sinks(level_at(c + 1), REFINE_TARGET[c], ENCHANT_TARGET[c], progression, slot_progress, skills_by_root)
      for r in LOOKAHEAD: need[r] = ahead[r]
    first = {k: sum(s['first_clear_reward'].get(k, 0) for s in stages if s['chapter'] == c) for k in need}
    base = M0_RATES[c - 1]['per_hour']; per = {}
    for r in base:
      # Smallest non-decreasing rate that keeps cumulative income ≥ cumulative need at every chapter end.
      have = income.get(r, 0.0) + first.get(r, 0); floor_rate = prior.get(r, 0)
      per[r] = (max(1, floor_rate, math.ceil(max(0.0, need[r] - have) / CHAPTER_HOURS[c - 1] * RESOURCE_BIAS[r])) if base[r] else 0)
      income[r] = have + per[r] * CHAPTER_HOURS[c - 1]
    prior = dict(per)
    out.append({'chapter': c, 'per_hour': per}); factors.append(per['hero_exp'] / base['hero_exp']); plan.append({'chapter': c, 'level': level, 'refine': REFINE_TARGET[c - 1], 'enchant': ENCHANT_TARGET[c - 1], 'cumulative_need': {k: int(v) for k, v in need.items()}})
    previous = need
  return out, factors, plan

def main():
  ap = argparse.ArgumentParser(); ap.add_argument('--write', action='store_true'); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
  load = lambda n: json.loads((D / n).read_text())
  economy, loot = load('economy.json'), load('loot.json')
  skills_by_root = {root: load(f'skills/{root}.json') for root in REFERENCE_BUILDS}
  # D-134 raises the sink, not AFK ore income. Keep the D-069 income-authoring reference
  # at its original 5 ore/target so regenerating does not silently cancel the user's change.
  income_reference_slots = copy.deepcopy(load('slot-progress.json'))
  for row in income_reference_slots['refine']['upgrade_rows']: row['refine_ore'] = 5 * row['to']
  new_rates, factors, plan = rates(load('progression.json'), load('stages.json')['stages'], income_reference_slots, skills_by_root)
  for row in new_rates:
    row['per_hour']['gold'] *= GOLD_INCOME_MULTIPLIER
    row['per_hour']['crystal'] = economy['farm'].get('crystal_per_hour', 0)  # D-129, fixed all chapters
  economy['rates'] = new_rates
  for cp in economy['checkpoints']:  # same independent budgets, minutes at the D-069 rates; windows ±40 % around them
    per = new_rates[cp['chapter'] - 1]['per_hour']; minutes = max(q / per[k] * 60 for k, q in cp['cost'].items())
    cp['expected_minutes'] = minutes  # Keep authored acceptance windows; do not move them to hide a failure.
    cp['pace_basis'] = 'D-118 gold income x3; other D-069 rates and authored acceptance windows unchanged'
  economy['checkpoint_limits'] = 'Empty starting wallet and static unlocked farm chapter; costs are illustrative independent budgets at the D-069 rates, not a measured timeline (scripts/game/journey.ts measures that). First clears/daily/salvage accelerate these estimates. Cannot spend same income on two checkpoints at once.'
  economy['long_term_target'] = 'D-069: Lv70 Class2 and chapter 8 in about 240 continuous farm hours (~10 days with AFK claimed twice a day), maxed gear around 2–3 weeks, then wait for Hi-class; no fixed wait per stage'
  economy['pace_target'] = {'chapter_hours': CHAPTER_HOURS, 'story_end_hours': sum(CHAPTER_HOURS), 'refine_target': REFINE_TARGET, 'enchant_target': ENCHANT_TARGET, 'reference_builds': REFERENCE_BUILDS, 'chapter_end_plan': plan, 'exp_scale_vs_m0': [round(k, 4) for k in factors], 'resource_bias': RESOURCE_BIAS, 'generator': 'plan/generators/economy_pace.py'}
  economy['pace_target']['gold_income_multiplier'] = GOLD_INCOME_MULTIPLIER
  # D-068 pool size: the common-equivalent throughput bound uses the 36-definition tier catalogue.
  sa = loot['supreme_analysis']; sa['target_definition_probability'] = 1 / 36; sa['equivalent_throughput_minutes'] = 729 / (sa['mean_common_equivalent_per_drop'] / 36 / sa['drop_interval_minutes'])
  text = {'economy.json': json.dumps(economy, ensure_ascii=False, indent=2) + '\n', 'loot.json': json.dumps(loot, ensure_ascii=False, indent=2) + '\n'}
  if a.write:
    for k, t in text.items(): (D / k).write_text(t)
  if a.check:
    ok = all((D / k).read_text() == t for k, t in text.items()); print(json.dumps({'matches': ok})); raise SystemExit(0 if ok else 1)
  print(json.dumps({'rates': [r['per_hour'] for r in new_rates], 'exp_scale': [round(k, 3) for k in factors], 'written': a.write}, ensure_ascii=False))

if __name__ == '__main__':
  main()

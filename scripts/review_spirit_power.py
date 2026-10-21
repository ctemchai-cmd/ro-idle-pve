"""D-093 static coefficient/cost review only. No combat runner, RNG or simulation."""
import hashlib
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "862ec57d85a9758dabb0ab239eab6ab35ea37f66"
PATH = "plan/data/skills/acolyte.json"
old_doc = json.loads(subprocess.check_output(["git", "show", f"{BASE}:{PATH}"], cwd=ROOT))
new_doc = json.loads((ROOT / PATH).read_text())
old = {s["id"]: s for s in old_doc["skills"]}
new = {s["id"]: s for s in new_doc["skills"]}
factors = {"monk_triple_attack": 1.25, "monk_finger_offensive": 2.25, "monk_asura": 2.25}
skills = []
for sid in new:
    before, after = old[sid], new[sid]
    if sid not in factors:
        assert before == after, ("unrelated_skill_changed", sid)
        continue
    assert {k: v for k, v in before.items() if k != "level_parameters"} == {k: v for k, v in after.items() if k != "level_parameters"}
    for key, curve in before["level_parameters"].items():
        assert after["level_parameters"][key] == [round(v * factors[sid], 8) for v in curve]
    skills.append({"id": sid, "coefficient_factor": factors[sid], "before": before["level_parameters"], "after": after["level_parameters"], "cost": after["cost"], "timing": after["timing"], "hits": after["effects"][0]["hits"]})

# A transparent two-action timing budget, NOT two matched character builds or a fight.
knight = json.loads((ROOT / "plan/data/skills/swordsman.json").read_text())
other = {s["id"]: s for s in knight["skills"]}
call, finger = new["monk_call_spirits"], new["monk_finger_offensive"]
reference = [other["swordsman_bash"], other["knight_pierce"]]


def budget(pair, level, aspd, cspd):
    # NAI uses 1.5s, SI uses the user's 3s runtime pacing. CT pauses the NA clock.
    si, nai = math.ceil(300000 / aspd), math.ceil(150000 / aspd)
    ct = sum(math.ceil(s["timing"]["cast_ms"] * 100 / cspd) for s in pair)
    acd = sum(math.ceil(s["timing"]["after_cast_ms"] * 100 / cspd) for s in pair)
    power = sum(s["level_parameters"].get("power", [0] * 10)[level - 1] * s["effects"][0].get("hits", 0) for s in pair)
    duration, normal_window = 2 * si + ct + acd, 2 * si + acd
    return {"duration_ms": duration, "raw_skill_atk_ratio": round(power, 8), "fractional_normal_capacity": normal_window / nai, "approx_raw_atk_per_second": (power + normal_window / nai) * 1000 / duration}


timing = []
for level in [1, 4, 10]:
    for aspd, cspd in [(100, 100), (200, 100), (100, 200), (200, 200)]:
        a, b = budget([call, finger], level, aspd, cspd), budget(reference, level, aspd, cspd)
        timing.append({"level": level, "aspd": aspd, "cspd": cspd, "call_finger": a, "bash_pierce_reference": b, "relative_approx_power": a["approx_raw_atk_per_second"] / b["approx_raw_atk_per_second"]})
asura = [{"atk": 1000, "pre_cost_sp": sp, "raw_before": 2500 + 1.3 * sp, "raw_after": 5625 + 2.925 * sp, "sp_after_start": 0} for sp in [250, 1000, 2000, 4000]]
report = {"task_id": "TASK-069", "baseline_commit": BASE, "scope": "Static schema/data differences and closed-form power/timing arithmetic; never advances a battle or runs simulation", "skills": skills, "unrelated_skills_unchanged": len(new) - len(factors), "costs_timing_hit_rules_unchanged": True, "timing_budget": timing, "asura_single_cast_snapshots": asura, "assumptions": ["Same normalized ATK and supplied ASPD/CSPD; not matched gear/stat/role budgets or complete four-slot rotations", "All hits land without crit, armor, flat reduction, targets dying, CC, passive procs or SP shortage", "Normal capacity is a continuous long-run approximation, not the exact integer hit count/first-attack timing", "Held-sphere ATK bonus excluded so the spender coefficient is reviewed on its own", "Asura snapshots are single casts; all-current-SP is spent, and repeating full-SP Asura every rotation is NOT assumed"], "limitations": ["No win rate, sustained resource budget, encounter or whole-game balance verdict", "Passive ball generation can reduce need for Call Spirits; actual loadout tradeoffs remain for player feedback/TASK-041", "No new balance simulation/calibration run was authorized or executed"], "input_sha256": {PATH: hashlib.sha256((ROOT / PATH).read_bytes()).hexdigest()}}
out = ROOT / "plan/evidence/task-069-power-review.json"
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"review": str(out.relative_to(ROOT)), "changed_skills": len(skills), "static_timing_rows": len(timing), "level10_approx_relative_range": [min(r["relative_approx_power"] for r in timing if r["level"] == 10), max(r["relative_approx_power"] for r in timing if r["level"] == 10)], "balance_simulation": False}))

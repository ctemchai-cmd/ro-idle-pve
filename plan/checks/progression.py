"""Independent M0 arithmetic/spec review; this is not the game's rules engine."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "plan/data/progression.json"
REPORT = ROOT / "plan/evidence/task-001-review.json"


def review() -> dict:
    raw = DATA.read_bytes()
    data = json.loads(raw)
    checks: list[dict] = []

    def check(ac: str, case: str, passed: bool, detail: object) -> None:
        checks.append({"ac": ac, "case_id": case, "passed": bool(passed), "result": detail})

    release = data["release"]
    progress = data["progression"]
    rows = progress["level_rows"]
    gates = progress["breakthrough_gates"]
    check("AC-01", "levels-1-through-70", [r["level"] for r in rows] == list(range(1, 71)), len(rows))
    check("AC-01", "no-level-71-or-breakthrough-70", rows[-1]["next_level_cost"] is None and [g["at_level"] for g in gates] == [20, 40, 60], {"cap": release["level_cap"], "gates": [g["at_level"] for g in gates]})
    all_costs_valid = True
    cumulative_valid = True
    for row in rows:
        n = row["level"] - 1
        # Closed-form sums independently check the authored transition table.
        sum_l = n * (n + 1) // 2
        sum_l2 = n * (n + 1) * (2 * n + 1) // 6
        cumulative_valid &= row["leveling_cost_to_reach"] == {"hero_exp": 50 * sum_l + 5 * sum_l2, "gold": 20 * sum_l + 2 * sum_l2}
        if row["next_level_cost"]:
            l = row["level"]
            all_costs_valid &= row["next_level_cost"] == {"hero_exp": 50*l + 5*l*l, "gold": 20*l + 2*l*l}
    check("AC-01", "transition-costs-positive-and-complete", all_costs_valid, "69 transitions match the cost contract")
    check("AC-01", "closed-form-cumulative-costs", cumulative_valid, "all 70 cumulative rows checked using sum(L) and sum(L²)")
    for expected in data["reference_cases"]["milestones"]:
        actual = rows[expected["level"] - 1]
        check("AC-01", f"milestone-{expected['level']}", actual["leveling_cost_to_reach"] == {"hero_exp": expected["hero_exp"], "gold": expected["gold_leveling"]} and actual["total_status_points"] == expected["status_points"], actual["leveling_cost_to_reach"])
    check("AC-01", "class2-independent-of-breakthrough", data["promotion"]["class2_min_level"] == 20 and data["promotion"]["requires_breakthrough_020"] is False, "Lv.20 may promote while local cap remains 20")
    check("AC-01", "future-cap-without-gate70", gates[-1]["unlocks_local_cap"] == 80 and min(release["level_cap"], gates[-1]["unlocks_local_cap"]) == 70 and data["promotion"]["hi_class_enabled"] is False, "gate60 unlocks local80; release cap70 still applies")
    check("AC-01", "resource-source-not-after-required-gate", next(r for r in data["resources"] if r["id"] == "breakthrough_essence")["first_source"] == "farm_cleared_1-5", "essence available before any required promotion/breakthrough encounter")
    start_case = data["reference_cases"]["four_characters_at_level4"]
    actual_start = {k: 4*rows[3]["leveling_cost_to_reach"][k] for k in ["hero_exp", "gold"]}
    initial_wallet = data["initial_state"]["wallet"]
    remaining = {k: initial_wallet[k] - v for k, v in actual_start.items()}
    check("AC-01", "starter-wallet-four-level4", actual_start == start_case["cost"] and remaining == start_case["remaining_initial_wallet"] and min(remaining.values()) >= 0, {"cost": actual_start, "remaining": remaining})

    allocation = data["status_allocation"]
    check("AC-02", "same-base-stats-no-auto-growth", allocation["base"] == dict.fromkeys(["str", "agi", "vit", "int", "dex", "luk"], 1) and allocation["automatic_class_growth"] is False and allocation["automatic_point_spending"] is False, allocation["base"])
    # D-057: Ragnarok-style points gained on reaching level L are 3 + floor(L/5).
    points = lambda level: sum(3 + l//5 for l in range(2, level+1))
    check("AC-02", "points-granted-not-auto-allocated", all(r["total_status_points"] == points(r["level"]) for r in rows) and allocation["points_per_level_rule"] == "3 + floor(new_level/5)", "Lv1=0; Lv10=34; Lv20=91; Lv70=676 unallocated points")
    prices = {r["new_value"]: r["point_cost"] for r in allocation["cost_by_new_value"]}
    check("AC-02", "manual-stat-cost-boundaries", list(prices) == list(range(2, 100)) and all(prices[v] == (v-2)//10+1 for v in prices), {str(v): prices[v] for v in [2, 11, 12, 21, 22, 91, 92, 99]})
    fixture = data["reference_cases"]["level70_single_stat"]
    spent = sum(prices[v] for v in range(2, fixture["value"]+1))
    budget70 = rows[69]["total_status_points"]
    check("AC-02", "single-stat-budget-boundary", spent == 530 and budget70 == 676 and fixture == {"value": 99, "spent_points": 530, "unspent_points": 146} and fixture["value"] == allocation["manual_value_max"], {"stat": fixture["value"], "spent": spent, "budget": budget70, "note": "Lv70 can max one stat at the manual cap 99"})
    check("AC-02", "manual-cap-does-not-cap-buffs", allocation["manual_value_max"] == 99 and allocation["buff_magnitude_cap"] is None, "99 limits allocated primary value; buff magnitude remains uncapped")

    party = data["party_rules"]
    npcs = data["initial_state"]["npc_roster"]
    check("AC-03", "six-distinct-persistent-npcs", len(npcs) == 6 and len({n["character_id"] for n in npcs}) == 6 and len({n["root_job_id"] for n in npcs}) == 6, [n["character_id"] for n in npcs])
    check("AC-03", "main-plus-three-unique-npc-roots", party["main_count"] == 1 and party["npc_count"] == 3 and party["unique_npc_root"] is True and party["main_may_duplicate_npc_root"] is True and party["team_slot_fields"] == ["character_id", "position"], "team positions contain references, not copies of progression")
    check("AC-03", "manual-off-team-upgrade", party["off_team_can_receive_manual_upgrade"] is True and party["auto_level"] is False and progress["spend_mode"] == "manual_selected_character", "resource command names the selected character")
    npc_case = data["reference_cases"]["roster_identity_case"]
    actor = npc_case["actor_before"]
    actor_spent = sum(sum(prices[v] for v in range(2, target+1)) for target in actor["primary_stats"].values())
    check("AC-03", "npc-remove-and-return-preserves-investment", actor == npc_case["actor_after_remove_and_readd"] and actor_spent + actor["unspent_status_points"] == rows[actor["level"]-1]["total_status_points"] and actor["character_id"] not in npc_case["team_after_remove"], {"character": actor["character_id"], "spent_points": actor_spent, "unspent": actor["unspent_status_points"], "weapon_refine": actor["slot_progress"]["weapon"]["refine"]})
    check("AC-03", "replacement-not-inheriting-slot", npc_case["replacement_starts_with_own_level"] == 1 and npc_case["replacement_slot_progress"]["weapon"]["refine"] == 0, "replacement keeps its own progression")

    policy = data["refund_policy"]
    check("AC-04", "ledger-actual-paid-and-zero-grants", policy["mode"] == "actual_paid_resource_vector" and policy["starter_grants_refund"] == 0 and policy["restore_old_upgraded_build_after_refund"] is False and policy["loadout_presets_store_only_configuration"] is True, "refunded progression is removed; a preset does not restore paid upgrades free")
    check("AC-04", "status-refund-character-owned", policy["status_points"]["owner"] == "character_id" and policy["status_points"]["global_wallet_credit"] is False and policy["status_points"]["restore_total_rule"] == "earned_status_points_for_level", "stat reset restores earned unallocated points to the same character, not the shared wallet")
    for case in data["reference_cases"]["refund_version_cases"]:
        initial = case["initial_resources"]
        states = case["states"]
        conservation = all(state["wallet"][k] + state["refundable_paid"][k] == initial[k] for state in states for k in initial)
        correct_refunds = states[1]["returned"] == case["cost_versions"]["v1"] and states[-1]["returned"] == case["cost_versions"]["v2"]
        retry_zero = all(v == 0 for v in states[2]["returned"].values()) and states[1]["wallet"] == states[2]["wallet"]
        check("AC-04", case["id"], conservation and correct_refunds and retry_zero, {"wallet_plus_refundable_investment_conserved": conservation, "old_and_new_payments_refunded_exactly": correct_refunds, "repeat_refund_credit_zero": retry_zero})
    cases = {c["id"]: c for c in data["reference_cases"]["job_switch_cases"]}
    check("AC-04", "job-switch-keeps-level-and-root-rules", cases["main_class1_switch"]["level_before"] == cases["main_class1_switch"]["level_after"] == 40 and cases["npc_cross_root_rejected"]["allowed"] is False and data["promotion"]["npc_root_mutable"] is False, "main may change root; NPC may change only branch; levels remain")
    check("AC-04", "inventory-full-whole-command-reject", cases["inventory_full_switch"]["allowed"] is False and cases["inventory_full_switch"]["state_change"] is False and policy["inventory_full_policy"] == "reject_whole_command_without_mutation" and "slot_progress" in policy["preserve_fields"], "no partial refund, item deletion or slot transfer")
    check("AC-04", "class2-level20-and-hi-class70", cases["class2_before_breakthrough"]["promotion_allowed"] is True and cases["class2_before_breakthrough"]["effective_level_cap_after_promotion"] == 20 and cases["hi_class_at70_closed"]["allowed"] is False, "job promotion and breakthrough remain separate")
    report = {
        "task_id": "TASK-001", "review_date": "2026-10-19", "reviewer": "Codex self-review",
        "method": "independent arithmetic and specification/fixture consistency; not game execution",
        "command": "python3 plan/checks/progression.py --write-report",
        "data_path": str(DATA.relative_to(ROOT)), "data_sha256": hashlib.sha256(raw).hexdigest(),
        "design_path": "plan/design/09-release-scope.md", "content_version": data["content_version"],
        "acceptance_results": {ac: "pass" if all(c["passed"] for c in checks if c["ac"] == ac) else "fail" for ac in ["AC-01", "AC-02", "AC-03", "AC-04"]},
        "checks": checks, "passed": all(c["passed"] for c in checks),
        "limits": ["income/pace and encounter balance await TASK-010/011/041", "save transactions await TASK-013/022", "no engine, browser or cloud tests performed"],
    }
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-report", action="store_true")
    args = parser.parse_args()
    result = review()
    if args.write_report:
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"task": result["task_id"], "checks": len(result["checks"]), "acceptance_results": result["acceptance_results"], "passed": result["passed"], "data_sha256": result["data_sha256"]}, ensure_ascii=False))
    raise SystemExit(0 if result["passed"] else 1)

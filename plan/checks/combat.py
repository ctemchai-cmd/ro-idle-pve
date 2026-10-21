"""M0 arithmetic/trace review only. No scheduler, game engine or live simulation."""
from __future__ import annotations

import argparse
import hashlib
import json
from math import ceil, floor, isclose
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "plan/data/combat-rules.json"
CASES = ROOT / "plan/data/combat-cases.json"
REPORT = ROOT / "plan/evidence/task-002-review.json"


def milestone_bonus(primary, rules):
    """D-057: every full 10 of a primary adds timing-neutral stats (never attack_speed/cast_speed)."""
    table, out = rules.get("primary_milestone_bonus"), {}
    if table:
        for key, gains in table["per_step"].items():
            for stat, amount in gains.items(): out[stat] = out.get(stat, 0) + (primary[key]//table["every"])*amount
    return out


def derived(level, primary, definitions, bonus=None):
    bonus = bonus or {}
    return {name: spec["base"] + spec["per_level_after_one"]*(level-1)
            + sum(primary[k]*v for k, v in spec.get("primary", {}).items())
            + sum((primary[k]-1)*v for k, v in spec.get("primary_above_one", {}).items())
            + bonus.get(name, 0)
            for name, spec in definitions.items()}


def damage(inp, armor):
    d = max(0, max(0, inp.get("defense", 0)*(1-inp.get("armor_break", 0))) * (1-inp.get("penetration_percent", 0)) - inp.get("flat_penetration", 0))
    power = max(0, inp["raw"]) * max(0, 1+inp.get("outgoing_bonus", 0)) * inp.get("element_multiplier", 1)
    if inp.get("is_crit", False): power *= inp.get("crit_multiplier", 1.5)
    power = max(0, power*(1-armor["asymptotic_reduction"]*d/(d+armor["k"])) - inp.get("flat_reduction", 0))
    rounded = floor(power*max(0, 1-inp.get("guard", 0))*max(0, 1+inp.get("vulnerability", 0))+1e-9)
    hits = inp.get("hits", 1)
    total = rounded*hits
    shield = min(total, inp.get("shield", 0))
    loss = min(inp.get("hp", total), total-shield)
    return {"effective_defense": d, "before_shield": rounded, "absorbed": shield,
            "hp_loss": loss, "hp_after": inp.get("hp", total)-loss,
            "overkill": total-shield-loss, "before_shield_per_hit": rounded,
            "total_before_shield": total, "total_hp_loss": loss}


def trace_case(case):
    # Independent, case-specific closed-form calculations; never a time-stepping runner.
    i = case["input"]; kind = case["kind"]
    if kind == "parallel":
        a = i["si_ms"]; b = a+i["cast_a_ms"]; c = a+i["cast_b_ms"]
        return {"start_a_ms":a,"start_b_ms":a,"resolve_a_ms":b,"resolve_b_ms":c,"next_start_a_ms":b+i["acd_ms"]+a,"next_start_b_ms":c+i["acd_ms"]+a}
    if kind == "sp_skip": return {"cast_started":False,"sp_after":i["sp"],"next_slot_ready_ms":i["at_ms"]+i["si_ms"]}
    if kind == "action_gate": return {"start_ms":max(i["ready_ms"],i["restriction_ends_ms"]),"slot_consumed_before_start":False}
    if kind == "interrupted":
        acd = i["interrupt_ms"]+i["acd_ms"]; ready = acd+i["si_ms"]
        return {"old_resolve_ms":i["start_ms"]+i["ct_ms"],"old_event_valid":False,"acd_end_ms":acd,"next_ready_ms":ready,"next_start_ms":max(ready,i["cc_ends_ms"]),"sp_after":i["sp_before"]-i["sp_cost"],"used_slots":1}
    if kind == "instant": return {"start_ms":i["ready_ms"],"resolve_ms":i["ready_ms"],"normal_earliest_ms":i["ready_ms"]+1,"next_start_ms":i["ready_ms"]+i["acd_ms"]+i["si_ms"]}
    if kind == "completion_batch": return {"actor_a_cast_emits":True,"actor_b_cast_emits":True,"result":"player_loss_both_wipe"}
    if kind == "target": return {"retargeted": i["binding"]=="resolve_selector" and not i["original_alive_at_resolve"] and i["another_eligible_alive"],"sp_refunded":False}
    if kind == "speed_si":
        first = i["initial_si_start_ms"]+ceil(150000/i["initial_aspd"])
        return {"first_cast_ms":first,"next_cast_ms":first+i["ct_ms"]+i["acd_ms"]+ceil(150000/i["buffed_aspd"])}
    if kind == "speed_ct":
        resolve = i["cast_start_ms"]+ceil(i["base_ct_ms"]*100/i["initial_cast_speed"])
        return {"resolve_ms":resolve,"acd_end_ms":resolve+ceil(i["base_acd_ms"]*100/i["new_cast_speed"])}
    if kind == "normal_pause": return {"normal_due_after_pause_ms":i["normal_due_without_pause_ms"]+i["ct_ms"]}
    if kind == "empty_slots":
        occupied=[x for x in i["slots"] if x is not None]
        return {"mode":"normal_only","skill_timer_events":0,"max_slots_scanned":4} if not occupied else {"mode":"rotation","next_after_a":occupied[1],"extra_SI_for_empty":0,"max_slots_scanned":4}
    if kind == "silence": return {"skill_start_ms":max(i["ready_ms"],i["silence_end_ms"]),"normal_hit_times_before_skill_ms":list(range(i["normal_interval_ms"],i["silence_end_ms"],i["normal_interval_ms"])),"slot_consumed_before_start":False}
    if kind == "death_cast": return {"cast_resolves":not(i["cast_start_ms"]<i["death_ms"]<i["resolve_ms"]),"sp_after":i["sp_before"]-i["sp_cost"],"sp_refunded":False}
    if kind == "periodic_death_cast": return {"cast_completes":i["death_tick_ms"]>i["cast_resolve_ms"],"refund_sp":False}
    if kind == "full_heal":
        effective=min(i["max_hp"]-i["hp"],i["raw_heal"])
        return {"cast_started":True,"sp_after":i["sp_before"]-i["sp_cost"],"effective_heal":effective,"overheal":i["raw_heal"]-effective}
    if kind == "timeout": return {"event_processed":i["event_at_ms"]<i["limit_ms"],"result":"timeout"}
    if kind == "uninterruptible":
        resolved=i["cast_start_ms"]+i["ct_ms"];ready=resolved+i["acd_ms"]+i["si_ms"]
        return {"cast_resolves_at_ms":resolved,"next_ready_ms":ready,"next_start_ms":max(ready,i["stun_end_ms"])}
    if kind == "cc_union": return {"blocked_from_ms":min(x["at_ms"] for x in i["applications"]),"blocked_until_ms":max(x["at_ms"]+x["duration_ms"] for x in i["applications"]),"immunity_window_ms":0}
    if kind == "cc_chance": return {"apply_chance":min(1,max(0,i["base_chance"]-i["target_resistance"])),"duration_if_applied_ms":i["base_duration_ms"]}
    if kind == "sp_regen":
        amount=min(i["max_sp"]-i["current_sp"],floor(max(0,2+.02*i["max_sp"]+.02*(i["int"]-1))*max(0,1+i.get("sp_regen_percent",0))))
        return {"gain":amount,"sp_after":i["current_sp"]+amount}
    if kind == "max_resource": return {"current_after":min(i["current"],i["new_max"])}
    if kind == "periodic":
        start=i["applied_at_ms"]+(0 if i["tick_on_apply"] else i["tick_ms"])
        times=list(range(start,i["applied_at_ms"]+i["duration_ms"],i["tick_ms"]))
        return {"tick_times_ms":times,"total_amount":len(times)*i["amount_per_tick"]}
    if kind == "outcome_scope": return {"eligible_for_stun":[t for t,landed in i["hit_outcomes"].items() if landed]}
    if kind == "normal_no_interrupt": return {"cast_cancelled":i["explicit_interrupt"]}
    raise ValueError(f"unknown trace kind {kind}")


def same(actual, expected):
    if isinstance(expected, bool): return actual is expected
    if isinstance(expected, (int, float)): return isclose(actual,expected,abs_tol=1e-5,rel_tol=1e-8)
    if isinstance(expected, dict): return all(k in actual and same(actual[k],v) for k,v in expected.items())
    return actual==expected


def review():
    rules=json.loads(DATA.read_text()); cases=json.loads(CASES.read_text()); checks=[]
    def check(ac,id,ok,result): checks.append({"ac":ac,"case_id":id,"passed":bool(ok),"result":result})
    check("AC-01","matching-rules-version",rules["rules_version"]==cases["rules_version"],rules["rules_version"])
    for c in cases["derived_cases"]:
        actual=derived(c["level"],c["primary"],rules["derived_stats"],milestone_bonus(c["primary"],rules))
        check("AC-01",c["id"],same(actual,c["expected"]),actual)
    for c in cases["damage_cases"]:
        actual=damage(c["input"],rules["armor"])
        check("AC-01",c["id"],same(actual,c["expected"]),actual)
    for c in cases["crit_factor_cases"]:
        actual=1+min(1,max(0,c["probability"]))*(c["multiplier"]-1)
        check("AC-01",c["id"],same(actual,c["expected_factor"]),actual)
    matrix=rules["element_chart"]
    check("AC-01","element-table-complete",len(matrix)==10 and all(set(row)==set(matrix) and all(v>0 for v in row.values()) for row in matrix.values()),100)
    check("AC-01","uncapped-additive-buff-policy",rules["modifiers"]["buff_max_stacks"] is None and rules["modifiers"]["buff_magnitude_cap"] is None and rules["modifiers"]["same_caster_reapply"]=="new_independent_instance",rules["modifiers"])
    check("AC-01","crit-eligibility-no-free-armor-ignore",rules["combat_probabilities"]["crit_ignores_defense"] is False and rules["combat_probabilities"]["default_crit_eligibility"]["dot"] is False and rules["combat_probabilities"]["default_crit_eligibility"]["heal"] is False,"DoT/heal/reflect do not inherit critical hits")
    check("AC-01","natural-hp-regen-explicit-zero",rules["resources"]["natural_hp_regen"]==cases["hp_regen_default"]==0,"in-battle HP regen requires an explicit stat/effect source")
    check("AC-01","resource-minima-rounding-explicit",rules["modifiers"]["derived_minimum"]["max_hp"]==1 and rules["modifiers"]["derived_minimum"]["max_sp"]==0 and rules["modifiers"]["integer_derived_fields"]==["max_hp","max_sp"] and rules["modifiers"]["positive_aggregate_buff_cap"] is None,"resource maxima floor after modifiers; positive buff aggregation remains uncapped")
    for c in cases["timeline_cases"]:
        ac="AC-03" if c["kind"] in ["interrupted","action_gate","death_cast","uninterruptible","cc_union","cc_chance"] else "AC-02"
        actual=trace_case(c)
        check(ac,c["id"],same(actual,c["expected"]),actual)
    rotation=rules["rotation"]
    check("AC-02","normal-only-in-SI-ACD-and-no-CD",rotation["normal_allowed_phases"]==["SI","ACD"] and rotation["separate_skill_cooldown"] is False and rotation["slot_count"]==4,"NA clock paused during CT; phase boundaries independent of FPS")
    check("AC-03","cast-token-and-spending-contract",rules["resources"]["spend_skill_sp"]=="once_at_cast_start" and rules["resources"]["interrupted_refund"] is False and rotation["cc_does_not_spend_unstarted_slot"] is True,"started cast remains spent, unstarted slot remains unspent")
    progress=json.loads((ROOT/"plan/data/progression.json").read_text())
    point_prices={x["new_value"]:x["point_cost"] for x in progress["status_allocation"]["cost_by_new_value"]}
    budgets={}
    for c in cases["sensitivity"]["rows"]:
        stats=c["primary"]; bonus=milestone_bonus(stats,rules); d=derived(c["level"],stats,rules["derived_stats"],bonus)
        point_cost=sum(sum(point_prices[n] for n in range(2,value+1)) for value in stats.values())
        si=ceil(150000/d["attack_speed"]);cycle=c["skill_count"]*(si+c["per_skill_ct_ms"]+c["per_skill_acd_ms"])
        hit=min(1,max(0,.95+.002*(stats["dex"]-1)+.001*(stats["luk"]-1)+bonus.get("hit_bonus",0)))
        crit=min(1,max(0,.05+.008*(stats["luk"]-1)+bonus.get("crit_chance_bonus",0))); multiplier=1.5+.005*(stats["luk"]-1)
        atk=d["physical_attack"]
        burst=(atk/(si/1000)+c["skill_count"]*c["per_skill_atk_ratio"]*atk/(cycle/1000))*hit*(1+crit*(multiplier-1))
        sp_rate=c["skill_count"]*c["per_skill_sp"]/(cycle/1000)
        actual={"attack":atk,"si_ms":si,"cycle_ms":cycle,"sp_per_second":sp_rate,"burst_upper_bound_dps":burst,"spent_points":point_cost}
        expected={"attack":c["expected_attack"],"si_ms":c["expected_si_ms"],"cycle_ms":c["expected_cycle_ms"],"sp_per_second":c["expected_sp_per_second"],"burst_upper_bound_dps":c["expected_unrounded_burst_dps"],"spent_points":c["spent_status_points"]}
        budgets.setdefault(c["level"],set()).add(point_cost)
        check("AC-04",c["id"],same(actual,expected) and point_cost<=progress["progression"]["level_rows"][c["level"]-1]["total_status_points"],actual)
    check("AC-04","equal-status-budget-within-level",all(len(v)==1 for v in budgets.values()),{k:list(v) for k,v in budgets.items()})
    prng=rules["rng"];state=cases["rng_case"]["seed"];states=[]
    for _ in cases["rng_case"]["expected_first_states"]:
        state=(prng["a"]*state+prng["c"])%prng["modulus"];states.append(state)
    check("AC-04","lcg32-known-sequence",states==cases["rng_case"]["expected_first_states"],states)
    restore=set(rules["simulation_contract"]["restore_fields"])
    check("AC-04","replay-restoration-contract",{"game_time_ms","pending_events","rng_state","cast_tokens","rotation_cursor","event_sequence","status_instances"}<=restore and rules["simulation_contract"]["unsupported_version"]=="explicit_incompatible_no_latest_fallback",sorted(restore))
    check("AC-04","SP-cost-not-hidden-by-burst-DPS",cases["sensitivity"]["metric"].startswith("analytical unrounded") and max(c["expected_sp_per_second"] for c in cases["sensitivity"]["rows"])>6,"AGI consumes SP faster; measured sustainable DPS waits for the shared engine")
    return {"task_id":"TASK-002","review_date":"2026-10-19","review_round":2,"reviewer":"Codex self-review","resolved_round1_findings":["negative SP regen now zero, with a new reference case","resource maxima rounding/minima explicit, with a new contract check"],"method":"independent arithmetic and explicit trace-contract review; no live engine or scheduler","command":"python3 plan/checks/combat.py --write-report","rules_version":rules["rules_version"],"input_sha256":{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [DATA,CASES,ROOT/"plan/data/progression.json"]},"acceptance_results":{ac:"pass" if all(c["passed"] for c in checks if c["ac"]==ac) else "fail" for ac in ["AC-01","AC-02","AC-03","AC-04"]},"checks":checks,"passed":all(c["passed"] for c in checks),"limits":["M1 must execute these traces with the actual shared engine","sensitivity is an analytical burst upper bound, not measured balance","status catalogs and typed composition schemas are TASK-047"]}


if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--write-report",action="store_true");args=parser.parse_args()
    result=review()
    if args.write_report:REPORT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    failed=[c for c in result["checks"] if not c["passed"]]
    print(json.dumps({"task":result["task_id"],"checks":len(result["checks"]),"acceptance_results":result["acceptance_results"],"failed":failed,"passed":result["passed"]},ensure_ascii=False))
    raise SystemExit(0 if result["passed"] else 1)

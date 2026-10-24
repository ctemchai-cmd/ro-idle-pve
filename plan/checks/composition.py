"""M0 schema/contract and independent arithmetic review; not a combat engine.

Run with Python 3 and jsonschema >= 4.18 (Draft 2020-12 + referencing).
No game runtime, wall clock, renderer, accounts or network is exercised here.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
from math import floor, isfinite, isclose
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "plan/data"
SCHEMAS = {p.stem: json.loads(p.read_text()) for p in (DATA / "schemas").glob("*.json")}
REGISTRY = Registry().with_resources((s["$id"], Resource.from_contents(s)) for s in SCHEMAS.values())
VALIDATORS = {k: Draft202012Validator(s, registry=REGISTRY) for k, s in SCHEMAS.items()}
STATS = {s["id"]: s for s in json.loads((DATA / "stat-definitions.json").read_text())["stats"]}
STATUSES = {s["id"]: s for s in json.loads((DATA / "status-effects.json").read_text())["statuses"]}
if (DATA / "class-status-effects.json").exists():
    for status in json.loads((DATA / "class-status-effects.json").read_text())["statuses"]:
        if status["id"] in STATUSES:
            raise ValueError("duplicate status ID: "+status["id"])
        STATUSES[status["id"]] = status
CASES = json.loads((DATA / "composition-cases.json").read_text())


class Invalid(ValueError):
    def __init__(self, code, detail=""):
        self.code = code
        super().__init__(f"{code}: {detail}")


def require(condition, code, detail=""):
    if not condition:
        raise Invalid(code, detail)


def walk(value):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def unique_ids(rows):
    require(len({x["id"] for x in rows}) == len(rows), "duplicate_id")


def validate_shape(kind, definition):
    for node in walk(definition):
        require(not isinstance(node, (float, int)) or isinstance(node, bool) or isfinite(node), "non_finite")
        require(not isinstance(node, (float, int)) or isinstance(node, bool) or abs(node) <= 9007199254740991, "unsafe_number")
    errors = list(VALIDATORS[kind].iter_errors(definition))
    require(not errors, "schema", errors[0].message if errors else "")


def resolve(value, level_values=None, status_values=None):
    if isinstance(value, dict):
        if set(value) == {"level_param"}:
            require(level_values is not None and value["level_param"] in level_values, "level_param")
            return level_values[value["level_param"]]
        if set(value) == {"status_param"}:
            require(status_values is not None and value["status_param"] in status_values, "status_param_scope")
            return status_values[value["status_param"]]
        return {k: resolve(v, level_values, status_values) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve(v, level_values, status_values) for v in value]
    return value


def predicates(predicate):
    if not predicate:
        return []
    result = [predicate]
    for key in ["condition", "conditions"]:
        child = predicate.get(key)
        if child is not None:
            for c in child if isinstance(child, list) else [child]:
                result += predicates(c)
    return result


def modifiers(rows):
    unique_ids(rows)
    for m in rows:
        s = STATS[m["stat"]]
        require(m["bucket"] == s["group"], "modifier_bucket")
        require(m["op"] in s["allowed_ops"], "modifier_unit")
        for p in predicates(m.get("when")):
            require(p["type"] in ["all", "any", "not", "has_status", "has_tag"], "modifier_predicate_cycle")
            if p["type"] == "has_status":
                require(p["status_id"] in STATUSES, "unknown_status")
            if "actor" in p:
                require(p["actor"] == "self", "modifier_context")


def event_bindings(event):
    if event is None or event == "battle_start":
        return set()
    if event in ["cast_start", "cast_resolve"]:
        return {"event_source"}
    return {"event_source", "event_target"}


def program(effects, selectors, event=None, phase="cast_resolve", status_context=False, actor_ids=frozenset()):
    unique_ids(effects)
    previous = {}
    reserved = {"self", "source_actor"}
    reserved |= event_bindings(event)
    require(not (set(selectors) & {"self", "source_actor", "event_source", "event_target"}), "reserved_binding")
    for name, selector in selectors.items():
        require((selector["select"] == "random_n") == (selector["count"] is not None), "selector_count")
        require(selector["phase"] == ("event" if event else phase) or
                (phase == "cast_resolve" and selector["phase"] == "cast_start"), "selector_phase")
    for effect in effects:
        target = effect["target"]
        require(target in reserved or target in selectors, "unknown_binding", target)
        for p in predicates(effect.get("when")):
            if p["type"] == "effect_succeeded":
                prior = previous.get(p["effect_id"], {})
                require(prior.get("type") == "interrupt", "outcome_reference")
                require(prior.get("target") == target, "outcome_scope")
            if p["type"] == "hit_landed":
                require(p["effect_id"] in previous and previous[p["effect_id"]]["type"] == "damage", "outcome_reference")
                prior = previous[p["effect_id"]]
                require(prior["target"] == target, "outcome_scope")
                require(p["hit_index"] == "any" or p["hit_index"] < prior["hits"], "hit_index")
            if p["type"] == "has_status":
                require(p["status_id"] in STATUSES, "unknown_status")
            if p.get("actor", "").startswith("event_"):
                require(p["actor"] in event_bindings(event), "event_context")
        if effect["type"] == "apply_status":
            require(effect["status_id"] in STATUSES, "unknown_status")
            for key,call in effect.get("parameter_formulas",{}).items():
                require(key in effect["params"] and key in STATUSES[effect["status_id"]]["parameter_schema"]["properties"], "status_parameter_formula")
                require(call["id"]in["physical_power","magical_power","healing_power","flat_power"],"status_parameter_formula")
            status = STATUSES[effect["status_id"]]
            require(not list(Draft202012Validator(status["parameter_schema"]).iter_errors(effect["params"])), "status_params")
            require(0 <= effect["chance"] <= 1, "probability")
            require(effect["duration_ms"] >= 1 and float(effect["duration_ms"]).is_integer(), "duration")
            # The status template is validated with the actual application parameters.
            template = resolve(status, status_values=effect["params"])
            modifiers(template["modifiers"])
            triggers(template["triggers"], actor_ids)
            if template.get("damage_redirect"):
                require(0 <= template["damage_redirect"]["ratio"] <= 1, "redirect_ratio")
                require(template["source_death"] == "remove", "status_lifecycle")
            if template["periodic"]:
                program(template["periodic"]["effects"], {}, status_context=True, actor_ids=actor_ids)
        if effect["type"] in ["damage", "sacrifice_damage", "heal", "shield"]:
            fid = effect["formula"]["id"]
            if fid == "event_damage_power":
                require(event in ["damage_received", "damage_dealt"], "event_context")
            allowed = {"heal": ["healing_power", "physical_power", "flat_power"], "shield": ["healing_power", "physical_power", "flat_power"],
                       "damage": ["physical_power", "magical_power", "flat_power", "sp_burst_power", "event_damage_power"]}
            require(fid in allowed["damage" if effect["type"]=="sacrifice_damage"else effect["type"]], "formula_result_type")
        if target in selectors:
            require((effect["type"] == "revive") == (selectors[target]["life"] == "dead"), "target_life")
        elif effect["type"] == "revive":
            raise Invalid("target_life", "revive requires an explicit dead-ally selector")
        if effect["type"] == "revive":
            require(selectors[target]["team"] == "allies", "target_life")
            require(0 < effect["hp_ratio"] <= 1 and 0 <= effect["sp_ratio"] <= 1, "resource_ratio")
        if effect["type"] in ["shield", "summon"]:
            require(effect["duration_ms"] >= 1 and float(effect["duration_ms"]).is_integer(), "duration")
        if effect["type"] == "resource_change" and effect["target"] in ["self", "source_actor"] and effect["amount"] < 0 and phase != "event":
            raise Invalid("double_cost", "self resource spending belongs to the once-only skill cost")
        if effect["type"] == "damage" and effect["damage_type"] == "true":
            require(effect["armor_rule"] == "ignore", "true_damage_armor")
        if effect.get("as_reflect"):
            require(event in ["damage_received", "damage_dealt"] and effect["formula"]["id"] == "event_damage_power", "reflection_context")
        if effect["type"] == "handler":
            require(effect["params"]["status_id"] in STATUSES, "unknown_status")
        if effect["type"] == "summon":
            require(effect["actor_definition_id"] in actor_ids, "unknown_actor", effect["actor_definition_id"])
        previous[effect["id"]] = effect


def triggers(rows, actor_ids=frozenset()):
    unique_ids(rows)
    for t in rows:
        require(0 <= t["chance"] <= 1, "probability")
        for p in predicates(t.get("when")):
            require(p["type"] not in ["hit_landed", "effect_succeeded"], "outcome_scope")  # event context, not a prior effect program
            if p["type"] == "has_status":
                require(p["status_id"] in STATUSES, "unknown_status")
            if p.get("actor", "").startswith("event_"):
                require(p["actor"] in event_bindings(t["event"]), "event_context")
            if p.get("actor") == "target":
                require("event_target" in event_bindings(t["event"]), "event_context")
        program(t["effects"], t["selectors"], event=t["event"], phase="event", actor_ids=actor_ids)


def validate(kind, definition, actor_ids=frozenset()):
    validate_shape(kind, definition)
    if kind == "skill":
        for curve in definition["level_parameters"].values():
            require(len(curve) == definition["max_level"], "level_curve")
        for level in range(definition["max_level"]):
            values = {k: v[level] for k, v in definition["level_parameters"].items()}
            d = resolve(definition, level_values=values)
            validate_shape(kind, d)
            if d["kind"] == "active":
                for phase, key in [("cast_start", "start_effects"), ("cast_resolve", "effects")]:
                    active_selectors = {k: s for k, s in d["selectors"].items() if phase == "cast_resolve" or s["phase"] == "cast_start"}
                    program(d[key], active_selectors, phase=phase, actor_ids=actor_ids)
                for key in ["cast_ms", "after_cast_ms"]:
                    require(float(d["timing"][key]).is_integer(), "duration")
                costs = [d["cost"]["spirit_spheres"], d["cost"]["sp"] if isinstance(d["cost"]["sp"], (int, float)) else d["cost"]["sp"]["minimum_sp"]]
                require(all(float(n).is_integer() for n in costs), "resource_integer")
                require(d["cost"]["spirit_spheres"] <= 5, "resource_cost")
            else:
                modifiers(d["modifiers"]); triggers(d["triggers"], actor_ids)
    elif kind == "item":
        d = resolve(definition)
        require((d["slot"] == "weapon" and d["kind"] == "equipment") == (d["weapon_type"] is not None), "weapon_kind")
        modifiers(d["modifiers"]); triggers(d["triggers"], actor_ids)
    elif kind == "status":
        Draft202012Validator.check_schema(definition["parameter_schema"])
        require(definition["parameter_schema"].get("additionalProperties") is False, "status_params")
        # All templates are checked again after binding params on each application.
        declared = set(definition["parameter_schema"].get("properties", {}))
        require(set(definition["parameter_schema"]["required"]) == declared, "status_params")
        if definition["periodic"] and definition["periodic"]["offense"] == "live_source":
            require(definition["source_death"] == "remove", "status_lifecycle")
        for prop in definition["parameter_schema"]["properties"].values():
            require(prop.get("minimum", float("-inf")) <= prop.get("maximum", float("inf")), "status_params")
        for node in walk(definition):
            if isinstance(node, dict) and set(node) == {"status_param"}:
                require(node["status_param"] in declared, "status_params")


def patched(base, patches):
    """Small independent fixture transformation, not runtime build compilation."""
    result = deepcopy(base)
    stage_order = {"awaken": 0, "artifact": 1, "scenario": 2}
    seen = set()
    unique_ids(patches)
    for patch in sorted(patches, key=lambda p: (stage_order[p["stage"]], p["priority"], p["id"])):
        validate_shape("patch", patch)
        require(patch["skill_id"] == base["id"], "patch_skill")
        effect_id = patch["effect_id"]
        effects = {e["id"]: e for e in result["effects"]}
        op = patch["operation"]
        if op == "append_effect":
            require("effect" in patch and "param" not in patch and "value" not in patch, "patch_shape")
            require(effect_id not in effects and patch["effect"]["id"] == effect_id, "patch_anchor")
            result["effects"].append(deepcopy(patch["effect"]))
        else:
            require("param" in patch and "value" in patch and "effect" not in patch, "patch_shape")
            require(effect_id in effects, "patch_anchor")
            # Only the declared typed numeric formula parameters may be patched in v1.
            path = patch["param"].split(".")
            require(len(path) == 3 and path[:2] == ["formula", "params"], "patch_path")
            parent = effects[effect_id].get("formula", {}).get("params", {})
            require(path[-1] in parent, "patch_anchor")
            key = (patch["stage"], patch["priority"], effect_id, patch["param"])
            require(key not in seen, "patch_conflict")
            seen.add(key)
            parent[path[-1]] = patch["value"] if op == "set_param" else parent[path[-1]] + patch["value"]
    validate("skill", result)
    return result


def calculate(case):
    i = case["input"]; kind = case["kind"]
    if kind == "buff":
        return [(i["base"]+i["flat"])*(1+sum(x["ratio"] for x in i["instances"] if x["start"] <= t < x["end"])) for t in i["times"]]
    if kind == "sources":
        return {label: (i["base"]+sum(v for k, v in i["flats"].items() if k not in removed))*(1+sum(v for k, v in i["percents"].items() if k not in removed)) for label, removed in [("before", []), ("after", i["remove"]) ]}
    if kind == "hit_scope":
        return [key for key, landed in i.items() if landed]
    if kind == "support":
        amounts = [min(i["matk"], mx-hp) for hp, mx in zip(i["hp"], i["max_hp"])]
        return {"hp": [hp+x for hp, x in zip(i["hp"], amounts)], "effective_heal": sum(amounts), "overheal": i["matk"]*len(amounts)-sum(amounts), "patk": [x*(1+i["buff"]) for x in i["patk"]]}
    if kind == "dot_shield":
        ticks = list(range(i["start"]+i["interval"], i["start"]+i["duration"], i["interval"]))
        total = len(ticks)*i["damage"]; absorbed = min(total, i["shield"])
        return {"ticks": ticks, "absorbed": absorbed, "hp_after": max(0, i["hp"]-total+absorbed)}
    if kind == "cc":
        # These samples assume all attempts succeed; probabilities are prospective before each application.
        chances = [max(0, min(1, i["base_chance"]-n*.1 if i["adaptive"] else i["base_chance"])) for n in range(len(i["applications"]))]
        return {"chances": chances, "blocked_until": max(i["applications"])+i["duration"], "global_immunity": False}
    if kind == "resist_expiry":
        return [sum(i["per_instance"] for t in i["starts"] if t <= now < t+i["duration"]) for now in i["times"]]
    if kind == "sp_snapshot":
        return {"raw_power": i["patk"]*i["attack_ratio"]+i["sp"]*i["sp_ratio"], "sp_after_start": 0, "sp_after_interrupt": 0}
    if kind == "conditional":
        return {"cast_started": True, "raw_power": i["patk"]*(i["base_ratio"]+(i["bonus_ratio"] if i["target_has_poison"] else 0))}
    if kind == "detonate":
        own = i["sources"].count(i["source"])
        return {"raw_power": own*i["power_per_instance"], "consumed": own, "remaining": len(i["sources"])-own}
    if kind == "shield_hit":
        return {"hp_damage": max(0, i["damage"]-i["shield"]) if i["landed"] else 0, "stun_eligible": i["landed"]}
    if kind == "cleanse":
        eligible = sorted([s for s in i["instances"] if s["cleanseable"]], key=lambda s: (s["end"], s["id"]))
        return [s["id"] for s in eligible[:i["max_instances"]]]
    if kind == "proc_guard":
        return i["candidate"] not in i["ancestry"]
    if kind == "status_lifetime":
        return {"after_source_death": "active" if i["source_death"] == "persist" else "removed", "after_target_death": "removed" if i["target_death"] == "remove" else "active"}
    if kind == "bash_interrupt":
        cancelled = i["bash_landed"] and i["enemy_interruptible"] and i["enemy_cast_start"] <= i["bash_at"] < i["enemy_cast_start"]+i["enemy_cast_ms"]
        cast_end = i["bash_at"] if cancelled else i["enemy_cast_start"]+i["enemy_cast_ms"]
        next_ready = cast_end+i["enemy_acd"]+i["enemy_si"]
        return {"bash_sp_after": i["bash_sp"]-i["bash_cost"], "enemy_sp_after": i["enemy_sp"]-i["enemy_cost"],
                "enemy_cast_resolves": not cancelled, "enemy_sp_refund": 0,
                "enemy_next_start": max(next_ready, i["bash_at"]+i["stun_duration"]), "enemy_slots_consumed": 1}
    raise ValueError(kind)


def same(a, b):
    if isinstance(b, bool): return a is b
    if isinstance(b, (int, float)): return isinstance(a, (int, float)) and isclose(a, b, abs_tol=1e-8)
    if isinstance(b, dict): return isinstance(a, dict) and set(a) == set(b) and all(same(a[k], v) for k, v in b.items())
    if isinstance(b, list): return isinstance(a, list) and len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return a == b


def negative(case):
    kind = "skill"; d = deepcopy(CASES["fixtures"]["skills"][0]); effect = d["effects"][0]
    m = case["mutation"]
    if m in ["unknown_stat", "invalid_modifier_bucket", "ratio_as_add_percent"]:
        kind = "item"; d = deepcopy(CASES["fixtures"]["items"][0]); mod = d["modifiers"][0]
        if m == "unknown_stat": mod["stat"] = "speed_unregistered"
        if m == "invalid_modifier_bucket": mod["bucket"] = "primary"
        if m == "ratio_as_add_percent": mod.update(stat="crit_chance_bonus", bucket="bonus", op="add_percent")
    elif m == "unknown_formula": effect["formula"]["id"] = "unregistered"
    elif m == "unknown_formula_param": effect["formula"]["params"]["mystery"] = 1
    elif m == "unknown_status": d["effects"][1]["status_id"] = "unregistered"
    elif m == "unknown_binding": effect["target"] = "unregistered"
    elif m == "outcome_other_target": d["effects"][1]["when"]["scope"] = "any_target"
    elif m == "outcome_forward_reference": d["effects"].reverse()
    elif m == "outcome_different_binding": d["effects"][1]["target"] = "self"
    elif m == "unknown_status_param": d["effects"][1]["params"] = {"mystery": 1}
    elif m == "undefined_level_param": effect["formula"]["params"]["attack_ratio"] = {"level_param": "unknown"}
    elif m == "level_curve_length": d["level_parameters"]["power"] = [2]
    elif m == "buff_cap": kind = "status"; d = deepcopy(STATUSES["attack_up"]); d["stacking"]["max_instances"] = 3
    elif m == "chance_above_one": d["effects"][1]["chance"] = 1.1
    elif m == "event_formula_without_event": effect["formula"] = {"id": "event_damage_power", "params": {"ratio": .2}}
    elif m == "status_param_in_skill": effect["formula"]["params"]["attack_ratio"] = {"status_param": "power"}
    elif m == "dead_heal_binding": d = deepcopy(CASES["fixtures"]["skills"][1]); d["selectors"]["friends"]["life"] = "dead"
    elif m == "non_finite_number": effect["formula"]["params"]["flat_power"] = float("nan")
    elif m == "unknown_json_field": effect["damage"] = "function(){}"
    elif m == "effect_id_duplicate": d["effects"][1]["id"] = effect["id"]
    elif m == "source_sp_double_charge": d["start_effects"] = [{"id": "spend", "type": "resource_change", "target": "self", "resource": "sp", "amount": -12}]
    elif m == "unknown_actor_reference": d = deepcopy(CASES["fixtures"]["skills"][-1])
    elif m == "modifier_feedback_predicate":
        kind = "item"; d = deepcopy(CASES["fixtures"]["items"][0]); d["modifiers"][0]["when"] = {"type": "hp_below", "actor": "self", "ratio": .5}
    elif m == "unsafe_number": effect["formula"]["params"]["flat_power"] = 1e20
    elif m == "status_remote_schema": kind = "status"; d = deepcopy(STATUSES["attack_up"]); d["parameter_schema"] = {"$ref": "https://invalid.example/schema.json"}
    elif m == "skill_as_reflect": effect["as_reflect"] = True
    elif m == "battle_start_event_target":
        d = deepcopy(CASES["fixtures"]["skills"][2]); d["triggers"][0]["event"] = "battle_start"
    elif m == "cast_event_ambiguous_target":
        d = deepcopy(CASES["fixtures"]["skills"][2]); d["triggers"][0]["event"] = "cast_resolve"
    elif m == "live_source_after_death":
        kind = "status"; d = deepcopy(STATUSES["poison"]); d["periodic"]["offense"] = "live_source"
    elif m.startswith("patch_"):
        base = resolve(d, {"power": 2}); patches = deepcopy(CASES["variant_cases"]["patches"][:1])
        if m == "patch_missing_anchor": patches[0]["effect_id"] = "unknown"
        else: patches.append({**patches[0], "id": "conflicting_patch", "value": 3})
        patched(base, patches); return
    else: raise ValueError(m)
    validate(kind, d)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--write-report", action="store_true"); args = parser.parse_args()
    rows = []
    def check(cid, ac, fn):
        try: result = fn(); rows.append({"case_id": cid, "acceptance": ac, "passed": True, "result": result})
        except Exception as e: rows.append({"case_id": cid, "acceptance": ac, "passed": False, "error": str(e)})
    for name, schema in sorted(SCHEMAS.items()):
        check("schema_"+name, ["AC-01"], lambda s=schema: Draft202012Validator.check_schema(s))
    for d in STATUSES.values():
        def status_template(d=d):
            validate("status", d)
            params = {k: p.get("minimum", min(0, p.get("maximum", 0))) for k, p in d["parameter_schema"]["properties"].items()}
            skill = deepcopy(CASES["fixtures"]["skills"][1])
            skill["effects"] = [{"id": "apply", "type": "apply_status", "target": "self", "status_id": d["id"],
                                 "duration_ms": 3000, "params": params, "chance": 1}]
            validate("skill", skill)
            return {"template_bound_with": params}
        check("status_"+d["id"], ["AC-01", "AC-02"], status_template)
    for kind, rows_in in [("skill", CASES["fixtures"]["skills"]), ("item", CASES["fixtures"]["items"])]:
        for d in rows_in:
            check("fixture_"+d["id"], ["AC-01", "AC-05"], lambda d=d, k=kind: validate(k, d, frozenset(CASES["fixtures"]["actor_ids"])))
    for case in CASES["arithmetic_cases"]:
        def run(c=case):
            result = calculate(c); require(same(result, c["expected"]), "expected_result", f"{result} != {c['expected']}"); return result
        coverage = {"buff": ["AC-02", "AC-03"], "sources": ["AC-03"], "hit_scope": ["AC-01", "AC-04"],
                    "support": ["AC-01", "AC-04"], "dot_shield": ["AC-02", "AC-04"], "cc": ["AC-02", "AC-04"],
                    "resist_expiry": ["AC-02", "AC-04"], "sp_snapshot": ["AC-05"], "conditional": ["AC-01", "AC-04"],
                    "detonate": ["AC-05"], "shield_hit": ["AC-01", "AC-04"], "cleanse": ["AC-02", "AC-04"],
                    "proc_guard": ["AC-05"], "status_lifetime": ["AC-02"], "bash_interrupt": ["AC-04"]}
        check(case["id"], coverage[case["kind"]], run)
    for case in CASES["negative_cases"]:
        def run(c=case):
            try: negative(c)
            except Invalid as e:
                require(e.code == c["expected_error"], "wrong_error", f"{e.code} != {c['expected_error']}")
                return {"rejected_with": e.code}
            raise Invalid("accepted_invalid_definition")
        check(case["id"], ["AC-01", "AC-05", "AC-06"] if case["id"].startswith("patch_") else ["AC-01"], run)
    def variants():
        original = deepcopy(CASES["fixtures"]["skills"][0]); pristine = deepcopy(original)
        base = resolve(original, {"power": 2}); spec = CASES["variant_cases"]
        awakening = patched(base, spec["patches"][:1]); artifact = patched(base, spec["patches"])
        def power(s): return s["effects"][0]["formula"]["params"]["attack_ratio"]
        result = {"base": power(base), "awakened": power(awakening), "artifact": power(artifact), "second_actor": power(resolve(original, {"power": 2})), "base_effect_count": len(base["effects"]), "variant_effect_count": len(artifact["effects"])}
        require(original == pristine and same(result, spec["expected"]), "variant_isolation"); return result
    check("variant_isolation_and_append", ["AC-06"], variants)
    inputs = [DATA / n for n in ["stat-definitions.json", "status-effects.json", "effect-primitives.json", "formula-registry.json", "composition-cases.json", "combat-rules.json"]] + sorted((DATA / "schemas").glob("*.json")) + [Path(__file__), ROOT / "plan/design/15-combat-baseline.md", ROOT / "plan/design/16-composition-baseline.md"]
    if (DATA / "class-status-effects.json").exists():
        inputs.append(DATA / "class-status-effects.json")
    passed = all(row["passed"] for row in rows)
    report = {"task": "TASK-047", "reviewer": "Codex self-review", "date": "2026-10-19", "review_round": 2,
              "scope": "M0 JSON Schema and semantic/independent arithmetic review, not runtime simulation",
              "input_sha256": {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},
              "checks": rows, "total": len(rows), "passed": passed,
              "manual_review": [
                  {"acceptance": "AC-01", "finding": "Closed schemas + binding/phase/typed formula params; same-target outcomes cannot borrow another target or later effect."},
                  {"acceptance": "AC-02", "finding": "Independent source/application IDs, no numeric buff caps; expiry/ticks/death/cleanse policies stated in catalog and baseline16."},
                  {"acceptance": "AC-03", "finding": "Single primary/derived/bonus aggregation, source withdrawal recomputes without inverse mutations; enum element override has an explicit separate policy."},
                  {"acceptance": "AC-04", "finding": "Hand-calculated mixed, periodic, shield, CC/resistance cases matched; adaptive reaction applies after the existing batch barrier, not retroactively."},
                  {"acceptance": "AC-05", "finding": "Raw typed formulas/handler intents, pre-cost snapshots, event capability checks, origin filters and ancestry guards; no account side effects."},
                  {"acceptance": "AC-06", "finding": "Fixture deep copies and stable anchors isolate actor/base/variant; same-stage/priority writes conflict, missing anchors reject."}],
              "limitations": ["No scheduler, registry handlers, trigger engine or game runtime has been implemented.",
                              "Manual lifecycle/interface review is required alongside these checks.",
                              "Class/encounter/production asset catalogs and numeric balance remain subsequent M0 tasks.",
                              "Summon fixtures use explicitly supplied fixture actor IDs; production actors are subsequent class/encounter work."]}
    if args.write_report:
        (ROOT / "plan/evidence/task-047-review.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({"checks": len(rows), "passed": passed, "failures": [r for r in rows if not r["passed"]]}, ensure_ascii=False, indent=2))
    raise SystemExit(0 if passed else 1)


if __name__ == "__main__":
    main()

# Skill audit / Artifact interaction — 3 November 2026

Review covers **152 player skills (Active and Passive, base and Awaken), all 32 jobs**. Eleven skill programs changed; 141 retained with role/rationale in [skill-review.json](skill-review.json).

Matched main experiment: **5,756 fights before + 5,756 after**, 97 job/level/gear/phase conditions, two encounter profiles, two screening seeds then eight independent holdout seeds. No cards, Artifact, Refine or Enchant; Common gear and equal primary-stat point entitlements. Actual per-build investment and rotation recorded. This compares common equipment budgets, not identical total resource spending across jobs.

Class1 Lv10/Tier1; Class2 Lv70/Tiers1,20,40,60; High Lv100/Tier100 base/Aw1/Aw10. Ninety-second neutral boss; dummy does not attack; pressure profile uses the same Knight/Priest/Bard core and an attacking boss. Candidate builds are bounded, not an exhaustive optimizer. Main-table DPS is actor damage divided by the full 90 seconds; it is not a win-rate or all-boss claim.

## High Lv100 / Tier100 / Awaken10 — neutral dummy

| Job | Before DPS | After DPS | Normal DPS | Skill DPS |
|---|---:|---:|---:|---:|
| champion | 40,909 | 32,350 | 2,645 | 29,705 |
| high_wizard | 34,570 | 29,670 | 647 | 29,023 |
| lord_knight | 25,804 | 25,804 | 4,582 | 21,223 |
| sniper | 25,325 | 25,325 | 2,166 | 23,159 |
| stalker | 25,178 | 25,178 | 2,817 | 22,361 |
| whitesmith | 34,646 | 23,944 | 5,751 | 18,193 |
| assassin_cross | 20,102 | 20,102 | 2,953 | 17,149 |
| creator | 15,390 | 19,224 | 566 | 18,658 |
| professor | 14,110 | 15,564 | 546 | 15,018 |
| clown | 13,195 | 13,195 | 3,138 | 10,057 |
| paladin | 9,764 | 9,764 | 1,572 | 8,191 |
| gypsy | 6,464 | 6,464 | 1,807 | 4,657 |
| high_priest | 4,179 | 2,726 | 1,060 | 1,666 |

Champion retains the explicitly requested Gate of Hell 1,200–2,500% pre-HP coefficient. The reduced Palm/Dragon Tiger built-in critical bonus lowers its best dummy result without removing its burst identity. Gate leaves HP at 1%; in the separate two-person pressure probe without a healer the Champion setup lost an ally. Professor control, and Priest/Bard/Dancer healing/buffs, must not be valued by this dummy ranking.

## Class2 Lv70 / gear comparison

| Job | Tier1 before→after | Tier20 before→after | Tier40 before→after | Tier60 before→after |
|---|---:|---:|---:|---:|
| crusader | 2,007 → 2,007 | 2,268 → 2,268 | 2,560 → 2,560 | 2,872 → 2,872 |
| monk | 2,355 → 2,309 | 2,650 → 2,598 | 2,980 → 2,922 | 3,336 → 3,271 |
| bard | 1,308 → 1,308 | 1,463 → 1,463 | 1,630 → 1,630 | 1,801 → 1,801 |
| wizard | 3,016 → 3,016 | 3,346 → 3,346 | 3,739 → 3,739 | 4,170 → 4,170 |
| assassin | 3,152 → 3,152 | 3,563 → 3,563 | 4,018 → 4,018 | 4,505 → 4,505 |
| blacksmith | 1,985 → 2,133 | 2,553 → 2,377 | 2,854 → 2,720 | 3,167 → 3,052 |
| knight | 2,432 → 2,432 | 2,749 → 2,749 | 3,102 → 3,102 | 3,480 → 3,480 |
| priest | 728 → 700 | 759 → 732 | 796 → 768 | 836 → 808 |
| hunter | 2,649 → 2,649 | 3,000 → 3,000 | 3,390 → 3,390 | 3,808 → 3,808 |
| dancer | 1,269 → 1,269 | 1,420 → 1,420 | 1,583 → 1,583 | 1,748 → 1,748 |
| sage | 2,522 → 2,522 | 2,833 → 2,833 | 3,189 → 3,189 | 3,583 → 3,583 |
| rogue | 2,349 → 2,349 | 2,659 → 2,659 | 3,005 → 3,005 | 3,376 → 3,376 |
| alchemist | 2,510 → 2,510 | 2,781 → 2,781 | 3,122 → 3,122 | 3,500 → 3,500 |

Monk/Blacksmith receive +20% Triple Attack/Cart Crash power, but their selected whole-rotation results are slightly lower after the separate speed/raw-buff corrections. This is an intentional trade-off between clearer attack roles and removing shared buff inflation, not a claim that every buff raises total DPS.

## Changed programs and causes

| Skill | Change / reason |
|---|---|
| whitesmith_maximum_overthrust | Raw ATK130.5% plus65.25% penetration and Weapon Perfection doubled offensive lanes; retain team P/MATK+Aw skill boost, move penetration identity to Weapon Perfection. |
| blacksmith_weapon_perfection | Distinct armor penetration + critical precision instead of another raw P/MATK stack; separates its role from Maximum Overthrust and Impo. |
| high_wizard_mystical_amplification | Whole rotation was amplified by116%MATK plus magic crit/penetration; lower raw boost while keeping spell crit permission and identity. |
| creator_acid_demonstration | Align ultimate with Alchemist MATK spells and Chemical Expertise; five neutral magic hits, no physical hit/crit dependency. |
| creator_full_chemical_protection | Shield scales from the same MATK build as potion/plant skills. |
| professor_soul_change | Psychic Wave periodic damage lags comparable High ultimates; strengthen field rather than raising shared bolts or silence uptime. |
| blacksmith_cart_crash | Class2 damage rotation below peers; improve own direct skill, not stack another team multiplier. |
| monk_triple_attack | Ball-free combo filler underperforms the alternatives; improve filler, preserve paid-ball finishers. |
| acolyte_blessing | Reduce speed feedback from repeated party buffs; retain independent additive stacks, STR/INT/DEX and meaningful10s base duration. |
| champion_palm_strike | Six high-power hits also received free50percentage-point crit, duplicating Gate burst at little preparation; retain hit power, lower built-in crit to20points. |
| whitesmith_cart_termination | Preserve HighLv1 finisher superiority after Cart Crash20% buff, while lowering multiplicative buff feedback separately. |

Exact rank curves are authored in [skill-balance-2026-11.json](../../generators/skill-balance-2026-11.json); the final generator applies them after all inherited/Awaken/hierarchy programs. Costs, skill IDs, order, resource payment, four-slot timing and legacy paid ledgers are retained. Weapon Perfection now emphasizes penetration/critical support, distinct from Max Overthrust raw attack. Creator Acid Demonstration uses magical M.ATK and Full Chemical Protection uses M.ATK shielding, coherent with the class magic build.

## Support/control causal probes

144 before + 144 after fights: one candidate + one identical Knight, +15,000 HP survival window, two pressure levels, three fresh seeds. Compare the same build with all four active slots empty against its role rotation; learned passives remain in both. These are contribution probes, not standardized damage ranks.

After-patch pressure6 averages:

| Role | Team DPS empty→active | Active HPS | Boss casts empty→active |
|---|---:|---:|---:|
| priest | 1,094 → 1,454 | 305 | 13.0 → 13.0 |
| bard | 1,436 → 1,935 | 317 | 13.0 → 13.0 |
| dancer | 1,436 → 1,762 | 269 | 13.0 → 13.0 |
| sage | 1,834 → 3,595 | 0 | 13.0 → 3.0 |
| crusader | 1,306 → 1,606 | 0 | 13.0 → 13.0 |
| high_priest | 1,761 → 7,310 | 125 | 13.0 → 13.0 |
| clown | 2,343 → 9,483 | 138 | 13.0 → 13.0 |
| gypsy | 2,343 → 4,672 | 78 | 13.0 → 12.3 |
| professor | 2,971 → 12,317 | 0 | 13.0 → 4.0 |
| paladin | 2,134 → 4,373 | 92 | 13.0 → 11.0 |
| creator | 1,727 → 11,467 | 3 | 13.0 → 13.0 |
| champion | 3,726 → 3,690 | 0 | 13.0 → 13.0 |

78 additional three-target fights hold each old winning rotation fixed across before/after, 13 High jobs × three new seeds. This checks AoE regression under matched builds; it does not optimize AoE or cover elemental/race/size variety. Full rows in [multiple-targets.json](multiple-targets.json).

## Artifact maximal-buff stress

Two Legendary Lv10/five-star pieces on Blessing/Impositio, two speed allocations, one held-out seed each; three policies per allocation (six fights). The predecessor full-duration policy is reconstructed only on the enhanced status durations; no combat source was modified to run the counterfactual.

| Allocation | No artifacts team DPS | Full duration team DPS | Final quarter duration team DPS |
|---|---:|---:|---:|
| spell_speed | 36,636 | 2,083,525 | 63,177 |
| speed | 34,240 | 304,110 | 52,640 |

Final utility duration receives one quarter of the nominal Artifact power bonus: +75% power becomes +18.75% duration. UI exposes the actual duration bonus and the resolved skill values. Passive power, direct damage/healing/shields and periodic healing power retain the full rarity/level/star multiplier. No cap on independent buffs was introduced. This bounded check removes the demonstrated feedback explosion; it is not proof against all possible high-speed stacks.

## Evidence and reproducibility

- [before.json.gz](before.json.gz), [after.json.gz](after.json.gz): all screening and confirmation rows, skills, seeds, resource skips, DPS breakdown, HPS, cast/interrupts, survivors, early/late DPS. [comparison.json](comparison.json) summarizes all 194 paired confirmed rows.
- [roles-before.json.gz](roles-before.json.gz), [roles-after.json.gz](roles-after.json.gz), [artifact-stress.json](artifact-stress.json): separate causal/stress experiments.
- [audit-content.json.gz](audit-content.json.gz): generated bundle used by final main audit. Main comparisons contain no Artifact, so the subsequent quarter-duration Artifact-only compiler correction cannot change these results; its own stress experiment uses the corrected compiler. Source/UI/docs and implementation fingerprint can change without changing these authored combat programs.
- Main: `node --import tsx scripts/game/refresh-balance-audit.ts run --worker 0 --workers 2 --out <directory>` (repeat worker1, then `merge --workers 2 --out <directory>`). Frozen before bundle: `plan/evidence/task-190/content-before.json.gz`.
- Support: `scripts/game/refresh-support-probes.ts`; multi-target: `scripts/game/refresh-multi-probes.mjs`; artifact stress: `scripts/game/refresh-artifact-stress.mjs`. All use the same shared combat engine. No cloud saves or player accounts used.
- Actual command/API/native mobile and migration evidence belongs to tasks190–191; historical snapshots are retained, not rewritten.

Limitations: neutral encounter baseline; bounded rotations; no exhaustive elemental/race/card/Artifact combinations; synthetic gear and healing windows; no physical-phone FPS claim. Lower support DPS is intentional. Current differences leave room for build/encounter identity rather than forcing all professions to one damage number.

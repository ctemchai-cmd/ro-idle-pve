# Hi-class migration v2 — local review

คำขอ: `assets/modern/migration-v2.txt` · D169/design58 · TASK143–145. Released source581557c2b, VercelSUCCESS; public hosted4 groups passed (hosted.json).

21 exact user-selected icons, 15 base/Awaken Hi programs plus five icon-only Hi skills. Four stable IDs display Bond Fate, Dragon Tiger Combo, Gate of Hell and Psychic Wave. Ruwach uses priest13; native sound remains. All old IDs, skill ranks/prices/ledger/timing and four-slot rotation are preserved except the explicitly requested Gate five-ball cost.

Generic typed contracts add highest-offense ally targeting, caster-based status formulas, HP-sacrifice damage, one-action damage charges, ordered Bolt echo and magical critical permission snapshots. Runtime, headless and serialized checkpoints use the same pipeline.

## Actual verification

- 698/698 full TypeScript checks; 38 focused checks, including 20 old actual-paid High builds and 78 independent numeric goldens. Full34 authored-document scope guard; unrelated gameplay is identical.
- M0/readiness, strict TypeScript, root and filtered uncached Vercel builds, boundaries, secrets scan passed.
- 304 starter images, 60,460 library entries, 162 selected modern icons; nine pre-existing native dependency issues remain outside the selected pack. Runtime pack raw including manifest: 33230664 bytes / 33,554,432 budget.
- Native Chrome four groups: all21 source-SHA/decode/static appearance; in-game base/Awaken catalog, purple display, 320/390 layout; actual Canvas link/field lifetime, Gate HP and six hits; Timeline tap and reduced motion. Screenshots are the reviewed static states, not a claim to inspect every animation frame.
- Generator plus independent numeric goldens reproduce byte-identically. No owner login/save mutation, SQL/env changes, personal6173 restart or agents.

## Bounded A/B results

Final 2120 fights + 24 focused Gate risk fights. First-pass1,828 is retained separately. Same neutral boss,90s, validated manual point budgets/CommonLv60 gear, actual skill prices and identical before/after seed per build. Base90 andAwaken10 phases; two screening seeds and six independent confirmation seeds. Main-only dummy and four-person pressure fight. Hybrid professions additionally include critical profiles. This is a bounded set, not an exhaustive best-build search.

Frozen pre-patch data executes the current engine legacy path. These are data A/B counterfactuals; no historical-binary equivalence is claimed. Cross-build prices differ; each before-after pair has exactly equal paid costs and initial stats. Support/tank roles are assessed by team/healing/mitigation, not forced into damage-role targets.

| Hi-class | Before DPS | After DPS | Skill DPS |
| --- | ---: | ---: | ---: |
| lord_knight | 10433 | 11382 | 8653 |
| paladin | 5949 | 5949 | 4561 |
| champion | 11861 | 11861 | 9552 |
| sniper | 10290 | 10290 | 8573 |
| high_wizard | 10237 | 12945 | 12368 |
| professor | 7223 | 8818 | 8356 |
| assassin_cross | 10037 | 10037 | 7765 |
| stalker | 9100 | 11783 | 9612 |
| whitesmith | 8828 | 11099 | 8752 |
| creator | 8208 | 8208 | 7754 |
| high_priest | 3257 | 3257 | 1801 |

Rows use the selected after candidate paired against that exact old build. Before winner/after winner can differ; raw per-build/per-skill metrics, healing, shield, interruption, SP and sphere skips are in balance.json.gz. High Priest and Paladin rows are reference roles, not damage-tier rankings. No claim that every build is9–11k.

First pass raised LK to17.5k andHW19k. The actual cause was adding crit/crit damage/skill bonuses on top of the old attack buff and penetration. We reallocated only Aura/Mystical/Spiral/NapalmAw power budgets; no global multiplier or Class2 nerf. Final Aura P.ATK12–25% plus crit3–6%,critdamage4–8%,skill3–6%; Mystical M.ATK10–20% plus crit3–6%,critdamage4–8% and magical critical permission; Spiral750–1150% total plus penetration10–20% and interruption; Awaken budgets in design58. Napalm base curse10–50% stays exactly requested; Aw55–60%.

Assassin Cross critical control reaches10.0k unchanged; its requested icon changes do not need another damage buff. Gate is not the strongest sustained rotation in these fixtures: five-ball payment competes with Finger/Asura/Palm and HP risk is real. Never silently compact empty slots or give free spheres to make it look stronger.

## Gate resource risk

| Phase / fight | Gate damage /90s | HP paid | Gate sphere skips |
| --- | ---: | ---: | ---: |
| high-90-base/dummy | 108882 | 22021 | 0 |
| high-90-base/pressure | 251494 | 58701 | 0 |
| high-90-awaken10/dummy | 221415 | 28756 | 0 |
| high-90-awaken10/pressure | 469864 | 59130 | 0 |

Each sacrifice is separately accounted as resource cost, not incoming damage/tanking; exact timestamps and three-seed samples in gate-risk.json. A full-health hit has factor1.99;20%HP has1.19; below1% never heals or self-kills. SP/balls are paid at cast start; interruption before resolve does not sacrifice HP.

## Presentation and save compatibility

Bond locks a living party ally, grants the greater attack lane from casterM.ATK, heals immediately then once per second for10s, and draws one deduplicated connection. Death/expiry/dispel remove it through live status projection. Psychic Wave has a purple offensive field, six immediate-through+5s ticks and repeated interruptions. Chase normals/procs/periodic ticks do not consume a charge; the next resolved damaging skill receives it for the whole action.

Only excess-rank migration rules already released remain; v2 does not reset/reprice skills. Existing backed-up content migration is used. Synthetic actual-paid legacy migrations and old receipt/checkpoint paths pass; no owner cloud account was read or changed.

Native screenshots: selected21-icons.png, catalog320/390, six battle scenes and timeline-gate-320.png. Public hosted proof passed in hosted.json: API Singapore/auth401,24 bundleSHAs, exact pack+21icons,32 jobs and eight mobile skill pages, no errors or writes.

Deployment: https://vercel.com/chanon2/ro-idle-pve/BGRfAd3jT8AAqaxpMz4G8cufrDoQ · https://ro-idle-pve.vercel.app/

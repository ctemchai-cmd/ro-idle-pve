# TASK176 — Battle rendering cost

The user reports whole-screen battle frame drops, including digits and live Timeline, after the all-profession animation rollout. No power/economy/backend changes or owner save access.

The pack now owns a bounded LRU of tightly cropped computed poses. Repeated native artwork uses one image draw, including when actor wrappers and battle renderers are reconstructed. Sampling rounds down within each original ACT interval at60Hz; original key times and native fallback are retained. Native component/variant changes invalidate identity. Maximum12MiB RGBA/256images plus the existing4×384² scratch; disposal releases both. Browser/GPU allocations are additional.

Timeline writes directly to its existing lane/marker compositor transforms; inherited root variables previously invalidated the whole chart. Locale formatters and status-group counts are reused without changing independently timed buff stacks. Approved CSS/backdrop/number appearance remains unchanged.

## Matched production measurement

`performance-production.json` is the final compiled-source comparison with all real entry-point global styles, actual BossField/shared engine/native effects/digits and open Timeline. Same synthetic Champion-party build/seed, Chrome CPU4x, 6.5s warm-up plus8s measurement per variant. Timeline forecast is computed before the measured window.

| Measurement | Frozen175 | Current176 |
| --- | ---: | ---: |
| Draw p50 | 6.7ms | 3.7ms |
| Draw p95 | 10.8ms | 5.9ms |
| Frame interval p50 | 50.0ms | 16.7ms |
| Frame interval p95 | 66.7ms | 33.3ms |
| Long tasks during window | 35 | 0 |

Warm cache held245images/5,837,908RGBAbytes, with1,997hits and no evictions in the measured party. This is a bounded synthetic production comparison, not physical-phone FPS certification. The measured frames cover the live battle including effects and numbers; they are not a class DPS/balance batch.

## Correctness

`native.json`:32jobs/60gender rigs/68attack clips;6,888canonical computed-pose comparisons to frozen175,1,148original-key samples,360worn cases, both facings, early release boundaries, native other states/reduced motion. Pressure caps at256entries witheviction,100new equivalent wrappers add100hits/0compositions; component replacement invalidates; two battle renderers share pack cache; pack disposal resets cache/scratch to0.

`timeline.json`:actual compiled Timeline320/390px,10/20/40second windows, matching axis/actor shifts and now-marker geometry, nested skill details open/close without losing parent. Oracle allows existing display-clock interpolation up to49ms ahead of engine steps. No new clock rule.

87focused TS tests (including4cache tests), strict typecheck, root and Vercel-filtered builds and M0 pass. Root/filtered content-version is identical; all five core/data/schema/content/pack fingerprints match175. No SQL/env/media changes, owner sign-in/cloud reads/writes or6173restart.

## Diagnostic artifacts

`before.json.gz` freezes eight existing presentation files; `source-after.json` pins their exact current bytes. The historical scope normalizer restores only those exact approved bytes before earlier frozen-source tests. `before-actor-tween.mjs`/baseline-source record the original175renderer used by native and performance probes.

Final compiled profiles/screenshots are `production-before/after.*`. `performance-before/after.json` are development observations, not the release metric. `performance-hmr-invalid.json` records an invalid prototype-probe run with0drawsamples and was discarded; the harness now requires actual draws. `timeline-experiment.json` was diagnostic: direct transforms helped, subsequent backdrop-blur removal had no clear extra median benefit and was not adopted. `performance-production-incomplete-styles.json` is a preliminary fixture run missing entry-point global CSS, superseded by final `performance-production.json`. These files do not certify phone performance.

Public release verification is pending.

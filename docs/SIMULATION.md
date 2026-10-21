# Simulation and replay

The runner calls the shared combat engine without rendering, network, audio, timers or persistence. Import `runScenario`, `runMatchedBatch`, `replayBattle` and `captureReplay` from `src/simulation/index.ts`. The CLI is the separate Node I/O adapter; it only reads replay files and writes requested reports.

```sh
npm run content:generate
npm run simulate -- list
npm run simulate -- run cc_resistance --seed 7 --trace --out /private/tmp/fight.json --replay-out /private/tmp/replay.json
npm run simulate -- replay /private/tmp/replay.json --out /private/tmp/replayed.json
npm run simulate -- batch 100 --out /private/tmp/batch.json
npm run simulate -- benchmark area --out /private/tmp/benchmark.json
```

`ReplayInput` includes a versioned scenario, an actual compiled runtime checkpoint, a variant ID and a spent-resource vector. It does not compile a second set of damage formulas or invent an account. The future build/encounter adapter supplies checkpoints and verified spending from the same runtime paths. Restoring a midcast checkpoint continues its actual cursor, RNG, SP, cast token, statuses, timers and per-battle proc counts. Unsupported schema/content/rules/RNG inputs fail; the runner never substitutes the latest version.

Reports include team/actor/skill DPS and effective HPS, all28 core metrics including overheal/shield/SP/interrupts/CC union versus source-instance time, damage by actor/skill/effect/origin, build/stat sources, status application/expiry parameters and observed CC Resistance. Final combat cleanup clears transient statuses, so use `status_timeline` to inspect Resistance during the fight. Full traces retain removal and other lifecycle events. Metrics are cumulative from battle start; event/breakdown/timeline data cover only the requested checkpoint-to-end segment. The `start_ms`, `end_ms`, `metric_scope` and `event_scope` fields make this explicit.

Batch output keeps group/paired summaries in JSON, group metrics in CSV, and all individual reports in a gzip JSON array with a SHA-256 checksum. Summary mode omits the full event array. Its FNV fingerprint is a regression identifier, not an authentication or integrity hash. Exact replay validation compares full traces and checkpoints; the CLI additionally prints a SHA-256 digest of the canonical report for cross-process checks.

Matched A/B runs require identical ordered seed sets, declared resource vectors and opponent setup, starting at time0 without prior RNG draws. Duplicate samples, changed encounters, midfight advantages and unequal budgets are rejected. Reports include sample count, spread, quantiles, Wilson95 win intervals and normal-approximation95 intervals for mean/paired DPS differences. One-sample mean intervals are null. These estimates do not automatically declare a class strong or weak; examine support/survival and encounter tradeoffs too.

The six bundled scenarios are controlled engine probes. They use actual Class1 skill definitions plus labeled generic boss/guard probes, fixed HP/SP offsets and a declared zero-spend fixture profile to keep90-second fights reproducible. `power_plus10pct` changes one Bash coefficient at the same declared budget. They verify the engine/reporting path, not legitimate release builds, authored stage difficulty, all126 skills or economy balance. TASK-029–034/041 supplies complete class verification and real invested-build comparisons. Summon rotations remain explicitly unsupported until the class actor factory is supplied.

The warm benchmark measures100 forced90-second fights after10 warmups, including schema restore, combat, report aggregation and fingerprinting. It excludes install/content generation and input construction. Record machine/Node/content hash with the result; the current target is5 seconds. It is separate from browser frame rate and server/DB latency.
